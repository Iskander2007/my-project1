(function () {
    const ordersContainer = document.getElementById('courier-orders');
    const statusToggle = document.getElementById('status-toggle');
    const statusDot = document.getElementById('courier-status');
    const nameEl = document.getElementById('courier-name');
    const phoneEl = document.getElementById('courier-phone');
    const roleEl = document.getElementById('courier-role');

    document.addEventListener('DOMContentLoaded', () => {
        ensureCourier().then(loadOrders);
        if (statusToggle) {
            statusToggle.addEventListener('change', handleStatusChange);
        }
    });

    async function ensureCourier() {
        if (!window.ClickCleanAPI) {
            window.location.href = '/login';
            return null;
        }
        const { res, data } = await ClickCleanAPI.fetchJson('/api/auth/me');
        if (res.status === 401 || !data || !data.ok) {
            window.location.href = '/login';
            return null;
        }
        if (data.user.role !== 'courier') {
            window.location.href = data.user.role === 'client' ? '/client' : '/profile';
            return null;
        }
        if (nameEl) {
            nameEl.textContent = data.user.name || 'Без имени';
        }
        if (phoneEl) {
            phoneEl.textContent = data.user.phone || '';
        }
        if (roleEl) {
            roleEl.textContent = data.user.role.toUpperCase();
        }
        return data.user;
    }

    function handleStatusChange(event) {
        if (!statusDot) return;
        if (event.target.checked) {
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
            statusDot.textContent = 'Онлайн';
        } else {
            statusDot.classList.remove('online');
            statusDot.classList.add('offline');
            statusDot.textContent = 'Оффлайн';
        }
    }

    async function loadOrders() {
        if (!ordersContainer || !window.ClickCleanAPI) return;
        ordersContainer.innerHTML = skeletonMarkup();
        const { res, data } = await ClickCleanAPI.fetchJson('/api/orders');
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        const orders = Array.isArray(data) ? data : (data && data.results) ? data.results : [];
        if (!orders.length) {
            ordersContainer.innerHTML = "<p style='color: var(--text-muted);'>Новых заказов пока нет</p>";
            return;
        }
        ordersContainer.innerHTML = '';
        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card card-enter';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;">${order.district ? order.district.name : 'Заказ'} · #${order.id}</h3>
                    <span style="font-weight:600;">${formatCurrency(order.amount)} ₸</span>
                </div>
                <div class="order-info">${order.address}</div>
                <div class="order-info">${order.date} · ${order.slot}</div>
                <div class="order-info">Вес: ${order.weight_kg ?? '—'} кг</div>
                <button class="btn-primary" data-take="${order.id}" style="margin-top:10px;">Взять заказ</button>
            `;
            ordersContainer.appendChild(card);
        });
        attachTakeHandlers();
    }

    function attachTakeHandlers() {
        document.querySelectorAll('[data-take]').forEach(button => {
            button.addEventListener('click', async () => {
                await takeOrder(button.dataset.take, button);
            });
        });
    }

    async function takeOrder(id, button) {
        if (!window.ClickCleanAPI) return;
        button.disabled = true;
        button.textContent = 'Отправляем...';
        const { res, data } = await ClickCleanAPI.fetchJson(`/api/orders/${id}/take`, {
            method: 'POST',
        });
        if (res.ok) {
            button.textContent = 'Готово';
            loadOrders();
        } else {
            button.disabled = false;
            button.textContent = 'Взять заказ';
            const message = (data && (data.detail || data.error)) || 'Не удалось взять заказ';
            alert(message);
        }
    }

    function skeletonMarkup() {
        return `
            <div class="skeleton" style="height: 70px; margin-bottom: 10px;"></div>
            <div class="skeleton" style="height: 70px; margin-bottom: 10px;"></div>
        `;
    }

    function formatCurrency(value) {
        const number = typeof value === 'number' ? value : parseFloat(value);
        if (Number.isNaN(number)) return value;
        return new Intl.NumberFormat('ru-RU').format(number);
    }
})();
