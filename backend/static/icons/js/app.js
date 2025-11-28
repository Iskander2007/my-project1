/* ------------------------------------------
   Click&Clean — Global App JavaScript
   Универсальный файл для всех страниц
------------------------------------------- */

/* =============================
      НАВИГАЦИЯ
============================= */

function goHome() {
  window.location.href = "client.html";
}

function goCourier() {
  window.location.href = "courier.html";
}

function goProfile() {
  window.location.href = "profile.html";
}

function goOrders() {
  window.location.href = "orders.html";
}


/* =============================
       АВТОРИЗАЦИЯ
============================= */

// Получение токена
function getToken() {
  return localStorage.getItem("access");
}

// Проверка авторизации
function checkAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

// Выход
function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "login.html";
}


/* =============================
      ТЕМНАЯ / СВЕТЛАЯ ТЕМА
============================= */

function toggleTheme() {
  const current = localStorage.getItem("theme") || "light";
  const next = current === "light" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

// Восстановление темы при загрузке
(function () {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
})();


/* =============================
     ЗАГРУЗКА ДАННЫХ ПРОФИЛЯ
============================= */

async function loadProfile() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(API_URL + "/auth/me", {
      headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();
    if (!data.ok) return;

    // имя
    document.getElementById("profile-name").innerText = data.user.name || "Не указано";

    // телефон
    document.getElementById("profile-phone").innerText = data.user.phone;

    // аватар
    if (data.user.avatar) {
      document.getElementById("avatar-img").src = data.user.avatar;
    }

  } catch (e) {
    console.error("Ошибка загрузки профиля:", e);
  }
}


/* =============================
       ЗАГРУЗКА АВАТАРКИ
============================= */

async function uploadAvatar(file) {
  if (!file) return;

  const form = new FormData();
  form.append("avatar", file);

  const token = getToken();

  try {
    const res = await fetch(API_URL + "/auth/avatar", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: form
    });

    const data = await res.json();

    if (data.ok) {
      document.getElementById("avatar-img").src = data.avatar;
    } else {
      alert("Ошибка загрузки фото");
    }

  } catch (err) {
    console.error("Ошибка:", err);
  }
}


/* =============================
     ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
============================= */

document.addEventListener("DOMContentLoaded", () => {
  // Если есть элемент профиля — загружаем данные
  if (document.getElementById("profile-name")) {
    loadProfile();

    // Обработка выбора файла
    const avatarInput = document.getElementById("avatarInput");
    if (avatarInput) {
      avatarInput.addEventListener("change", (e) => {
        uploadAvatar(e.target.files[0]);
      });
    }
  }

  // Если есть кнопка выхода — подключаем
  if (document.getElementById("logout-btn")) {
    document.getElementById("logout-btn").addEventListener("click", logout);
  }
});
