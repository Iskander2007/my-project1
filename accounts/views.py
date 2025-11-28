from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ProfileUpdateSerializer,
    AvatarUploadSerializer,
)
from .utils import create_tokens
from .models import normalize_phone


# ==========================
#   РЕГИСТРАЦИЯ
# ==========================

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"ok": True, "msg": "Аккаунт успешно создан"})
        return Response({"ok": False, "errors": serializer.errors}, status=400)


# ==========================
#   ВХОД
# ==========================

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"ok": False, "errors": serializer.errors}, status=400)

        phone = normalize_phone(serializer.validated_data["phone"])
        password = serializer.validated_data["password"]

        user = authenticate(phone=phone, password=password)

        if not user:
            return Response({"ok": False, "error": "Неверный номер или пароль"}, status=400)

        return Response({"ok": True, **create_tokens(user)})


# ==========================
#   ВЫХОД
# ==========================

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"ok": True, "msg": "Выход выполнен"})


# ==========================
#   ПРОФИЛЬ — ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
# ==========================

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"ok": True, "user": UserSerializer(request.user, context={"request": request}).data})


# ==========================
#   ОБНОВЛЕНИЕ ПРОФИЛЯ (ИМЯ)
# ==========================

class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"ok": True, "msg": "Профиль обновлён"})

        return Response({"ok": False, "errors": serializer.errors}, status=400)


# ==========================
#   ЗАГРУЗКА АВАТАРКИ (ФОТО)
# ==========================

class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AvatarUploadSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"ok": True, "avatar": request.user.avatar.url})
        return Response({"ok": False, "errors": serializer.errors}, status=400)
