from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager


# Роли пользователей
class Roles(models.TextChoices):
    CLIENT = "client", "Клиент"
    COURIER = "courier", "Курьер"
    ADMIN = "admin", "Админ"


# Менеджер пользователя
class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Телефон обязателен")

        phone = self.normalize_email(phone)  # можно заменить при желании
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(phone, password, **extra_fields)


# Основная модель User
class User(AbstractBaseUser, PermissionsMixin):
    phone = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CLIENT)

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.phone


# Функция нормализации телефона
def normalize_phone(phone: str):
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        return phone
    if phone.startswith("8"):
        return "+7" + phone[1:]
    if phone.startswith("7"):
        return "+7" + phone[1:]
    return phone
