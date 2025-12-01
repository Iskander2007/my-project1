from rest_framework import generics, permissions, response, status
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from accounts.permissions import IsClient, IsCourier, IsAdmin
from .models import Order, OrderStatus, OrderLog
from .serializers import OrderListSerializer, OrderCreateSerializer
from .filters import filter_orders
from wallet.models import Transaction, TxType

class OrdersFeed(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        qs = Order.objects.select_related("district","client").filter(status=OrderStatus.NEW)
        return filter_orders(qs, self.request.query_params, self.request.user)

class MyOrdersClient(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]
    def get_queryset(self):
        return Order.objects.filter(client=self.request.user).exclude(status=OrderStatus.DONE)


class MyCourierOrders(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def get_queryset(self):
        return (
            Order.objects.select_related("district", "client").filter(courier=self.request.user)
            .exclude(status__in=[OrderStatus.DONE, OrderStatus.CANCELED, OrderStatus.FAILED])
            .order_by("-taken_at", "-created_at")
        )


class MyCourierHistory(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def get_queryset(self):
        return (
            Order.objects.select_related("district", "client")
            .filter(
                courier=self.request.user,
                status=OrderStatus.DONE,
                courier_history_hidden=False,
            )
            .order_by("-taken_at", "-created_at")
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsCourier])
def clear_courier_history(request):
    user = request.user
    updated = (
        Order.objects.filter(
            courier=user,
            status=OrderStatus.DONE,
            courier_history_hidden=False,
        ).update(courier_history_hidden=True)
    )
    return response.Response({"ok": True, "cleared": updated})

class CreateOrder(generics.CreateAPIView):
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

def _log(order, user, action, details=None):
    OrderLog.objects.create(order=order, by_user_id=(user.id if user else None),
                            action=action, details=details or {})

# правило «без пересечения слотов у курьера»
def _courier_has_overlap(courier, date, slot):
    return Order.objects.filter(courier=courier, date=date, slot=slot)\
        .exclude(status__in=[OrderStatus.CANCELED, OrderStatus.FAILED, OrderStatus.DONE]).exists()

from django.db import transaction as dbtx

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsCourier])
def take_order(request, pk):
    user = request.user
    try:
        with dbtx.atomic():
            order = Order.objects.select_for_update().get(id=pk)
            if order.status != OrderStatus.NEW:
                return response.Response({"detail":"Заказ уже недоступен"}, status=400)
            if _courier_has_overlap(user, order.date, order.slot):
                return response.Response({"detail":"Слот занят другими заказами"}, status=400)
            # Попытка зарезервировать средства клиента, но без блокировки потока
            if order.client.balance >= order.amount:
                order.client.balance -= order.amount
                order.payment_reserved = True
            else:
                order.payment_reserved = False
            order.courier = user
            order.status = OrderStatus.TAKEN
            order.taken_at = timezone.now()
            if order.payment_reserved:
                order.client.save(update_fields=["balance"])
                Transaction.objects.create(user=order.client, type=TxType.HOLD, amount=order.amount, related_order_id=order.id)
            order.save()
            _log(order, user, "taken")
            return response.Response({"ok": True})
    except Order.DoesNotExist:
        return response.Response({"detail":"Не найдено"}, status=404)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request, pk):
    user = request.user
    try:
        with dbtx.atomic():
            order = Order.objects.select_for_update().get(id=pk)
            if user != order.client and user != order.courier and not IsAdmin().has_permission(request, None):
                return response.Response({"detail":"Нет прав"}, status=403)
            if order.payment_reserved:
                order.client.balance += order.amount
                Transaction.objects.create(user=order.client, type=TxType.REFUND, amount=order.amount, related_order_id=order.id)
                order.payment_reserved = False
            order.status = OrderStatus.CANCELED
            order.save(); order.client.save()
            _log(order, user, "canceled")
            return response.Response({"ok": True})
    except Order.DoesNotExist:
        return response.Response({"detail":"Не найдено"}, status=404)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_failed(request, pk):
    user = request.user
    comment = request.data.get("comment","")
    try:
        with dbtx.atomic():
            order = Order.objects.select_for_update().get(id=pk)
            if user != order.courier and not IsAdmin().has_permission(request, None):
                return response.Response({"detail":"Нет прав"}, status=403)
            if order.payment_reserved:
                order.client.balance += order.amount
                Transaction.objects.create(user=order.client, type=TxType.REFUND, amount=order.amount, related_order_id=order.id)
                order.payment_reserved = False
            order.status = OrderStatus.FAILED
            order.save(); order.client.save()
            _log(order, user, "failed", {"comment": comment})
            return response.Response({"ok": True})
    except Order.DoesNotExist:
        return response.Response({"detail":"Не найдено"}, status=404)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def complete_order(request, pk):
    user = request.user
    try:
        with dbtx.atomic():
            order = Order.objects.select_for_update().get(id=pk)
            if user != order.courier and not IsAdmin().has_permission(request, None):
                return response.Response({"detail":"Нет прав"}, status=403)
            if not order.taken_at:
                return response.Response({"detail":"Заказ ещё не назначен"}, status=400)
            had_reserve = order.payment_reserved
            if had_reserve:
                order.courier.balance += order.amount
                Transaction.objects.create(user=order.courier, type=TxType.RELEASE, amount=order.amount, related_order_id=order.id)
                order.payment_reserved = False
            order.status = OrderStatus.DONE
            order.save()
            if had_reserve:
                order.courier.save()
            _log(order, user, "done")
            return response.Response({"ok": True})
    except Order.DoesNotExist:
        return response.Response({"detail":"Не найдено"}, status=404)

