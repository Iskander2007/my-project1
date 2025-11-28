from rest_framework import serializers

from .models import Order
from meta.serializers import DistrictSerializer
from meta.models import Slot


class OrderListSerializer(serializers.ModelSerializer):
    district = DistrictSerializer()
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "amount",
            "district",
            "address",
            "date",
            "slot",
            "weight_kg",
            "notes",
            "photo_url",
            "client_name",
            "status",
            "taken_at",
            "latitude",
            "longitude",
        ]

    def get_client_name(self, obj):
        if getattr(obj.client, "name", None):
            return obj.client.name
        return obj.client.phone


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            "district",
            "address",
            "entrance",
            "floor",
            "intercom",
            "date",
            "slot",
            "weight_kg",
            "amount",
            "notes",
            "photo_url",
            "latitude",
            "longitude",
        ]

    def validate(self, attrs):
        if attrs["amount"] < 500:
            raise serializers.ValidationError("Минимальное вознаграждение 500 ₸")
        if attrs["slot"] not in [c.value for c in Slot]:
            raise serializers.ValidationError("Неверный слот")
        if attrs.get("weight_kg") is None or attrs["weight_kg"] <= 0:
            raise serializers.ValidationError("Укажите вес мусора (кг)")
        lat = attrs.get("latitude")
        lng = attrs.get("longitude")
        if lat is None or lng is None:
            raise serializers.ValidationError("Не удалось определить координаты адреса")
        return attrs

    def create(self, data):
        user = self.context["request"].user
        return Order.objects.create(client=user, **data)
