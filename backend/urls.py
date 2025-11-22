from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', TemplateView.as_view(template_name="index.html")),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse

from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, response

# AUTH
from accounts.views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ProfileUpdateView,
    AvatarUploadView,
)

# OTHER APPS
from meta.views import DistrictList, slots_list
from orders.views import (
    OrdersFeed, MyOrdersClient, CreateOrder,
    take_order, cancel_order, mark_failed, complete_order
)
from wallet.views import deposit, withdraw

# STATIC + FRONTEND
import os
from django.conf import settings
from django.conf.urls.static import static


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(_):
    return response.Response({"ok": True})


def root(_):
    return JsonResponse({"service": "Click&Clean API", "status": "ok"})


urlpatterns = [
    path("", root),
    path("admin/", admin.site.urls),

    # AUTH
    path("api/auth/register", RegisterView.as_view()),
    path("api/auth/login", LoginView.as_view()),
    path("api/auth/logout", LogoutView.as_view()),
    path("api/auth/me", MeView.as_view()),
    path("api/auth/profile/update", ProfileUpdateView.as_view()),
    path("api/auth/avatar", AvatarUploadView.as_view()),

    # META
    path("api/meta/districts", DistrictList.as_view()),
    path("api/meta/slots", slots_list),

    # ORDERS
    path("api/orders", OrdersFeed.as_view()),
    path("api/my/orders", MyOrdersClient.as_view()),
    path("api/orders/create", CreateOrder.as_view()),
    path("api/orders/<int:pk>/take", take_order),
    path("api/orders/<int:pk>/cancel", cancel_order),
    path("api/orders/<int:pk>/failed", mark_failed),
    path("api/orders/<int:pk>/complete", complete_order),

    # WALLET
    path("api/wallet/deposit", deposit),
    path("api/wallet/withdraw", withdraw),
]


# 👇 STATIC / MEDIA
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# 👇 FRONTEND (HTML, CSS, JS, IMG)
FRONTEND_PATH = os.path.join(os.path.dirname(settings.BASE_DIR), "ClickClear", "frontend")
if not os.path.exists(FRONTEND_PATH):
    FRONTEND_PATH = os.path.join(settings.BASE_DIR, "frontend")

urlpatterns += static("/frontend/", document_root=FRONTEND_PATH)
