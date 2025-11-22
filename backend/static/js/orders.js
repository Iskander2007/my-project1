/* ==================================================
   CLICK&CLEAN — ORDERS.JS
   Создание нового заказа
   ================================================== */

const API = "http://127.0.0.1:8000";
// На Render заменить на https://clickclear-backend.onrender.com


/* ==========================
   ЗАГРУЗКА РАЙОНОВ
   ========================== */

async function loadDistricts() {
    const districtSelect = document.getElementById("district-select");

    districtSelect.innerHTML = `<option>Загрузка...</option>`;

    try {
        const res = await fetch(`${API}/api/meta/districts`);
        const data = await res.json();

        districtSelect.innerHTML = "";

        data.districts.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id;
            opt.textContent = d.name;
            districtSelect.appendChild(opt);
        });

    } catch (err) {
        console.error(err);
        districtSelect.innerHTML = `<option>Ошибка загрузки</option>`;
    }
}


/* ==========================
   ЗАГРУЗКА ВРЕМЕННЫХ СЛОТОВ
   ========================== */

async function loadSlots() {
    const slotSelect = document.getElementById("slot-select");

    slotSelect.innerHTML = `<option>Загрузка...</option>`;

    try {
        const res = await fetch(`${API}/api/meta/slots`);
        const data = await res.json();

        slotSelect.innerHTML = "";

        data.slots.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.label;
            slotSelect.appendChild(opt);
        });

    } catch (err) {
        console.error(err);
        slotSelect.innerHTML = `<option>Ошибка загрузки</option>`;
    }
}


/* ==========================
   СОЗДАНИЕ ЗАКАЗА
   ========================== */

async function createOrder() {
    const district = document.getElementById("district-select").value;
    const slot = document.getElementById("slot-select").value;

    const token = localStorage.getItem("access");

    if (!district || !slot) {
        return showToast("Выберите район и время!");
    }

    try {
        const res = await fetch(`${API}/api/orders/create`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                district_id: district,
                slot_id: slot
            })
        });

        const data = await res.json();

        if (!data.ok) {
            return showToast("Ошибка: " + (data.error || "Не удалось создать заказ"));
        }

        showToast("Заказ создан!", "success");

        setTimeout(() => {
            window.location.href = "client.html";
        }, 800);

    } catch (err) {
        console.error(err);
        showToast("Ошибка соединения");
    }
}


/* ==========================
   УВЕДОМЛЕНИЯ (TOAST)
   ========================== */

function showToast(text, type = "error") {
    let old = document.querySelector(".toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = text;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => toast.classList.remove("show"), 2500);
    setTimeout(() => toast.remove(), 3000);
}


/* ==========================
   НАВИГАЦИЯ
   ========================== */

function goHome() {
    window.location.href = "client.html";
}

function goOrders() {
    window.location.href = "orders.html";
}

function goProfile() {
    window.location.href = "client.html";
}


/* ==========================
   СТАРТ
   ========================== */

loadDistricts();
loadSlots();

document
    .getElementById("confirm-order-btn")
    .addEventListener("click", createOrder);
