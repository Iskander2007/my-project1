from django.db import models
from django.conf import settings
from meta.models import District, Slot

class OrderStatus(models.TextChoices):
    NEW="new","Новый"
    TAKEN="taken","Назначен"
    EN_ROUTE="en_route","В пути"
    DONE="done","Выполнен"
    CANCELED="canceled","Отменён"
    FAILED="failed","Не удалось"
    OVERDUE="overdue","Просрочен"

class Order(models.Model):
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="client_orders")
    courier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="courier_orders")
    district = models.ForeignKey(District, on_delete=models.PROTECT)
    address = models.CharField(max_length=255)
    entrance = models.CharField(max_length=50, blank=True)
    floor = models.CharField(max_length=50, blank=True)
    intercom = models.CharField(max_length=50, blank=True)
    date = models.DateField()
    slot = models.CharField(max_length=10, choices=Slot.choices)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # вознаграждение, ≥500
    notes = models.TextField(blank=True)
    photo_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.NEW)
    payment_reserved = models.BooleanField(default=False)  # эскроу зарезервирован?
    taken_at = models.DateTimeField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    courier_history_hidden = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.id} {self.address} {self.date} {self.slot}"

class OrderLog(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    by_user_id = models.IntegerField(null=True, blank=True)
    action = models.CharField(max_length=100)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
