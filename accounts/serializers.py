from rest_framework import serializers
from .models import User, normalize_phone


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "phone", "name", "role",
            "avatar", "balance",
            "rating", "orders_completed",
            "last_online", "created_at",
        ]
        def get_avatar(self, obj):
            if obj.avatar:
               request = self.context.get("request")
               return request.build_absolute_uri(obj.avatar.url)
            return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["phone", "password", "role"]

    def validate_phone(self, value):
        return normalize_phone(value)

    def validate_role(self, value):
        if value not in ["client", "courier"]:
            raise serializers.ValidationError("Недопустимая роль")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "avatar"]
class AvatarUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["avatar"]
