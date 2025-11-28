/* =======================================
   CLICK&CLEAN — CLIENT.JS
   Личный кабинет клиента
   ======================================= */

const API = "http://127.0.0.1:8000";
// На Render поменяем на https://clickclear-backend.onrender.com

/* ===== ЗАГРУЗКА ПРОФИЛЯ ===== */

async function loadClientProfile() {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
        const res = await fetch(`${API}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();

        if (!data.ok) {
            alert("Сессия истекла. Войдите снова.");
            return logout();
        }

        const user = data.user;

        document.getElementById("client-name").textContent = user.name;
        document.getElementById("client-phone").textContent = "Телефон: " + user.phone;

    } catch (err) {
        console.error(err);
        alert("Ошибка связи с сервером");
    }
}


/* ===== ЗАГРУЗКА ЗАКАЗОВ ===== */

async function loadClientOrders() {
    const token = localStorage.getItem("access");
    const list = document.getElementById("orders-list");

    list.innerHTML = `
        <div class="skeleton" style="height: 60px; margin-bottom: 10px;"></div>
        <div class="skeleton" style="height: 60px; margin-bottom: 10px;"></div>
    `;

    try {
        const res = await fetch(`${API}/api/my/orders`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();

        if (!data.ok) {
            list.innerHTML = "<p>Ошибка загрузки заказов</p>";
            return;
        }

        if (data.orders.length === 0) {
            list.innerHTML = "<p style='color: var(--text-muted);'>У вас пока нет заказов</p>";
            return;
        }

        list.innerHTML = "";

        data.orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-card card-enter";

            card.innerHTML = `
                <h3>Заказ №${order.id}</h3>
                <div class="order-info">
                    Район: <b>${order.district_name}</b><br>
                    Время: ${order.slot_time}
                </div>
                <div class="order-status">${order.status}</div>
            `;

            list.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = "<p>Ошибка загрузки</p>";
    }
}


/* ===== КНОПКА СОЗДАТЬ ЗАКАЗ ===== */

document.getElementById("create-order-btn").addEventListener("click", () => {
    window.location.href = "orders.html";
});


/* ===== НАВИГАЦИЯ ===== */

function goHome() {
    window.location.href = "client.html";
}

function goOrders() {
    window.location.href = "orders.html";
}

function goProfile() {
    window.location.href = "client.html";
}


/* ===== ВЫХОД ===== */

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}


/* ===== ЗАПУСК ===== */

loadClientProfile();
loadClientOrders();

