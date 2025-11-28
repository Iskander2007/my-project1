/* =======================================
   CLICK&CLEAN — REGISTER.JS
   Регистрация пользователя (имя + телефон + пароль + роль)
   ======================================= */

const API = "http://127.0.0.1:8000";
// На Render будет: https://clickclear-backend.onrender.com

// Элементы формы
const regBtn = document.getElementById("register-btn");

const nameInput = document.getElementById("reg-name");
const phoneInput = document.getElementById("reg-phone");
const passInput = document.getElementById("reg-password");
const roleSelect = document.getElementById("reg-role");

/* ========== РЕГИСТРАЦИЯ ========== */

if (regBtn) {
    regBtn.addEventListener("click", async () => {

        regBtn.classList.add("tap-pop");

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passInput.value.trim();
        const role = roleSelect.value;

        if (name.length < 2) {
            alert("Введите корректное имя");
            return;
        }

        if (phone.length < 5) {
            alert("Введите корректный номер телефона");
            return;
        }

        if (password.length < 3) {
            alert("Пароль слишком короткий");
            return;
        }

        try {
            const res = await fetch(`${API}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phone,
                    password,
                    role
                })
            });

            const data = await res.json();

            if (!data.ok) {
                alert("Ошибка: " + JSON.stringify(data.errors));
                return;
            }

            // После успешной регистрации — логиним автоматически
            await loginAfterRegister(phone, password);

        } catch (err) {
            alert("Ошибка соединения с сервером");
            console.error(err);
        }
    });
}


/* ========== АВТО-ЛОГИН ПОСЛЕ РЕГИСТРАЦИИ ========== */

async function loginAfterRegister(phone, password) {
    try {
        const res = await fetch(`${API}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password })
        });

        const data = await res.json();

        if (!data.ok) {
            alert("Ошибка входа после регистрации");
            return;
        }

        // Сохраняем токены
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        // Загружаем профиль и редиректим
        await loadProfileAndRedirect();

    } catch (err) {
        alert("Ошибка авторизации после регистрации");
        console.error(err);
    }
}


/* ========== ПОЛУЧЕНИЕ ПРОФИЛЯ И РЕДИРЕКТ ========== */

async function loadProfileAndRedirect() {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
        const res = await fetch(`${API}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();

        if (!data.ok) {
            alert("Ошибка загрузки профиля");
            return;
        }

        const user = data.user;
        localStorage.setItem("user", JSON.stringify(user));

        // Редирект по роли
        if (user.role === "client") {
            window.location.href = "client.html";
        } else if (user.role === "courier") {
            window.location.href = "courier.html";
        } else {
            alert("Неизвестная роль");
        }

    } catch (err) {
        console.error(err);
        alert("Ошибка сервера");
    }
}
