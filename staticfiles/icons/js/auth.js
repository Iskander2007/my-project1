/* ==================================================
   CLICK&CLEAN — AUTH.JS
   Логин + Регистрация
   ================================================== */

const API = "http://127.0.0.1:8000";
// На Render заменить на https://clickclear-backend.onrender.com


/* ==================================================
   ВОЙТИ
   ================================================== */
async function login() {
    const phone = document.getElementById("login-phone").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!phone || !password) {
        return showToast("Заполните все поля");
    }

    try {
        const res = await fetch(`${API}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password })
        });

        const data = await res.json();

        if (!data.ok) {
            return showToast(data.error || "Ошибка входа");
        }

        // сохраняем токены
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        showToast("Успешный вход!", "success");

        setTimeout(() => {
            window.location.href = "client.html";
        }, 600);

    } catch (err) {
        console.error(err);
        showToast("Ошибка сервера");
    }
}


/* ==================================================
   РЕГИСТРАЦИЯ
   ================================================== */
async function register() {
    const name = document.getElementById("reg-name").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const password = document.getElementById("reg-password").value.trim();

    if (!name || !phone || !password) {
        return showToast("Заполните все поля");
    }

    if (password.length < 4) {
        return showToast("Минимальная длина пароля — 4 символа");
    }

    try {
        const res = await fetch(`${API}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, password })
        });

        const data = await res.json();

        if (!data.ok) {
            return showToast(data.error || "Ошибка регистрации");
        }

        showToast("Аккаунт создан!", "success");

        setTimeout(() => {
            window.location.href = "login.html";
        }, 600);

    } catch (err) {
        console.error(err);
        showToast("Ошибка сервера");
    }
}


/* ==================================================
   TOAST УВЕДОМЛЕНИЯ
   ================================================== */

function showToast(text, type = "error") {
    let old = document.querySelector(".toast");
    if (old) old.remove();

    const div = document.createElement("div");
    div.className = `toast toast-${type}`;
    div.textContent = text;

    document.body.appendChild(div);

    setTimeout(() => div.classList.add("show"), 10);
    setTimeout(() => div.classList.remove("show"), 2500);
    setTimeout(() => div.remove(), 3000);
}
