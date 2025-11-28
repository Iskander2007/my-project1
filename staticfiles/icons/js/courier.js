/* ==================================================
   CLICK&CLEAN — COURIER.JS
   Личный кабинет курьера
   ================================================== */

const API = "http://127.0.0.1:8000";
// На Render поменять на https://clickclear-backend.onrender.com

/* ==========================
   ЗАГРУЗКА ДОСТУПНЫХ ЗАКАЗОВ
   ========================== */

async function loadCourierOrders() {
    const list = document.getElementById("courier-orders");
    const token = localStorage.getItem("access");

    list.innerHTML = `
        <div class="skeleton" style="height: 70px; margin-bottom: 10px;"></div>
        <div class="skeleton" style="height: 70px; margin-bottom: 10px;"></div>
    `;

    try {
        const res = await fetch(`${API}/api/orders`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();

        if (!data.ok) {
            return list.innerHTML = "<p>Ошибка загрузки заказов</p>";
        }

        if (data.orders.length === 0) {
            list.innerHTML = "<p style='color:var(--text-muted);'>Нет доступных заказов</p>";
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

                <button class="btn-primary" onclick="takeOrder(${order.id})">
                    Взять заказ
                </button>
            `;

            list.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = "<p>Ошибка соединения</p>";
    }
}


/* ==========================
   ВЗЯТЬ ЗАКАЗ
   ========================== */

async function takeOrder(id) {
    const token = localStorage.getItem("access");
    showToast("Берем заказ...", "loading");

    try {
        const res = await fetch(`${API}/api/orders/${id}/take`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await res.json();

        if (!data.ok) {
            return showToast("Ошибка: " + (data.error || "Не удалось взять заказ"));
        }

        showToast("Заказ взят!", "success");

        setTimeout(() => {
            loadCourierOrders();
        }, 600);

    } catch (err) {
        console.error(err);
        showToast("Ошибка сервера");
    }
}


/* ==========================
   СТАТУС КУРЬЕРА
   ========================== */

const statusToggle = document.getElementById("status-toggle");
const courierStatus = document.getElementById("courier-status");

statusToggle.addEventListener("change", () => {
    if (statusToggle.checked) {
        courierStatus.textContent = "Онлайн";
        courierStatus.classList.remove("offline");
        courierStatus.classList.add("online");
        showToast("Статус: Онлайн", "success");
    } else {
        courierStatus.textContent = "Оффлайн";
        courierStatus.classList.remove("online");
        courierStatus.classList.add("offline");
        showToast("Статус: Оффлайн");
    }
});


/* ==========================
   УВЕДОМЛЕНИЯ (TOAST)
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
    window.location.href = "client.html";
}


/* ==========================
   СТАРТ
   ========================== */

loadCourierOrders();
