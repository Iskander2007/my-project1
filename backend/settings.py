from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
DEBUG = os.getenv("DEBUG", "0") == "1"

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "clickclear-backend.onrender.com",
    "172.31.3.238",
    "my-project1-xtw2.onrender.com",
]

render_host = os.getenv("RENDER_EXTERNAL_HOSTNAME")
if render_host:
    ALLOWED_HOSTS.append(render_host)


# APPLICATIONS
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",

    # Your apps
    "accounts",
    "orders",
    "wallet",
    "meta",
    # "frontend",  # Удалено, так как нет Django-приложения frontend
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS":  [
            BASE_DIR / 'backend' / 'templates'
            ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"


# DATABASES — Локально SQLite, на Render автоматически PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render: PostgreSQL
    DATABASES = {
        "default": dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    # Локальная разработка: SQLite
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }



# PASSWORD
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# LANGUAGE & TIMEZONE
LANGUAGE_CODE = "ru"
TIME_ZONE = "Asia/Almaty"
USE_I18N = True
USE_TZ = False


# STATIC FILES
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"


# MEDIA
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# CORS
CORS_ALLOW_ALL_ORIGINS = True


# JWT
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    )
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=60),
}
AUTH_USER_MODEL = "accounts.User"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STATICFILES_DIRS = [
    BASE_DIR / "backend" / "static",
]
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"



