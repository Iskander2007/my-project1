/* ==================================================
   CLICK&CLEAN — PROFILE.JS
   Профиль пользователя
   ================================================== */

const API = "http://127.0.0.1:8000";
// На Render → https://clickclear-backend.onrender.com


/* ==========================
   ЗАГРУЗИТЬ ДАННЫЕ ПРОФИЛЯ
   ========================== */

async function loadProfile() {
    const token = localStorage.getItem("access");

    try {
        const res = await fetch(`${API}/api/auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!data.ok) {
            showToast("Сессия истекла");
            return logout();
        }

        const user = data.user;

        document.getElementById("profile-name").textContent = user.name || "Без имени";
        document.getElementById("profile-phone").textContent = user.phone || "—";

    } catch (err) {
        console.error(err);
        showToast("Ошибка загрузки");
    }
}


/* ==========================
   ИЗМЕНИТЬ ИМЯ
   ========================== */

async function updateName() {
    const newName = prompt("Введите новое имя:");

    if (!newName || newName.trim().length < 2) {
        return showToast("Введите корректное имя");
    }

    const token = localStorage.getItem("access");

    try {
        const res = await fetch(`${API}/api/auth/profile/update`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: newName })
        });

        const data = await res.json();

        if (!data.ok) {
            return showToast("Ошибка обновления");
        }

        showToast("Имя обновлено!", "success");

        document.getElementById("profile-name").textContent = newName;

    } catch (err) {
        console.error(err);
        showToast("Ошибка сервера");
    }
}


/* ==========================
   АВАТАР (ЛОКАЛЬНО)
   ========================== */

document.getElementById("change-avatar-btn").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = evt => {
            document.getElementById("avatar-img").src = evt.target.result;
            showToast("Фото обновлено", "success");
        };

        reader.readAsDataURL(file);
    };

    input.click();
});


/* ==========================
   ВЫХОД
   ========================== */

document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("Выйти из аккаунта?")) {
        logout();
    }
});

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}


/* ==========================
   ТОСТЫ
   ========================== */

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


/* ==========================
   НАВИГАЦИЯ
   ========================== */

function goHome() {
    window.location.href = "client.html";
}

function goCourier() {
    window.location.href = "courier.html";
}

function goProfile() {
    window.location.href = "profile.html";
}


/* ==========================
   СТАРТ
   ========================== */

loadProfile();
document.getElementById("edit-name-btn").addEventListener("click", updateName);
