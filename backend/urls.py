from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, response

# AUTH
from accounts.views import (
    RegisterView, LoginView, LogoutView,
    MeView, ProfileUpdateView, AvatarUploadView
)

# META
from meta.views import DistrictList, slots_list

# ORDERS
from orders.views import (
    OrdersFeed, MyOrdersClient, MyCourierOrders, MyCourierHistory, CreateOrder,
    take_order, cancel_order, mark_failed, complete_order, clear_courier_history
)

# WALLET
from wallet.views import deposit, withdraw


# --- API HEALTH ---
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(_):
    return response.Response({"ok": True})


# --- Главная: отдаём фронтенд ---
def root_html(_):
    return TemplateView.as_view(template_name="index.html")(_)


urlpatterns = [
    # Главная — фронтенд
    path("", root_html),
    #1
    path("login", TemplateView.as_view(template_name="login.html")),
    path("register", TemplateView.as_view(template_name="register.html")),
    path("profile", TemplateView.as_view(template_name="profile.html")),
    path("courier", TemplateView.as_view(template_name="courier.html")),
    path("client", TemplateView.as_view(template_name="client.html")),
    path("orders", TemplateView.as_view(template_name="orders.html")),
    path("orders/new", TemplateView.as_view(template_name="orders.html")),

    # Admin
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
    path("api/my/courier/orders", MyCourierOrders.as_view()),
    path("api/my/courier/history", MyCourierHistory.as_view()),
    path("api/my/courier/history/clear", clear_courier_history),
    path("api/orders/create", CreateOrder.as_view()),
    path("api/orders/<int:pk>/take", take_order),
    path("api/orders/<int:pk>/cancel", cancel_order),
    path("api/orders/<int:pk>/failed", mark_failed),
    path("api/orders/<int:pk>/complete", complete_order),

    # WALLET
    path("api/wallet/deposit", deposit),
    path("api/wallet/withdraw", withdraw),

    # API health
    path("api/health", health),
]


# STATIC / MEDIA
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
