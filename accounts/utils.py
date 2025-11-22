from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

def create_tokens(user):
    refresh = RefreshToken.for_user(user)
    user.last_online = timezone.now()
    user.save()
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    }

