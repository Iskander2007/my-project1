from rest_framework import serializers

from .models import User, normalize_phone


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "phone", "name", "role", "avatar_url", "is_active"]

    def get_avatar_url(self, obj):
        if obj.avatar and "request" in self.context:
            request = self.context["request"]
            return request.build_absolute_uri(obj.avatar.url)
        if obj.avatar:
            return obj.avatar.url
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["name", "phone", "password", "role"]
        extra_kwargs = {
            "name": {"required": False, "allow_blank": True},
        }

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
