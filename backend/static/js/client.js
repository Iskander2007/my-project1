(function () {
    const nameEl = document.getElementById('client-name');
    const phoneEl = document.getElementById('client-phone');
    const ordersList = document.getElementById('orders-list');
    const createBtn = document.getElementById('create-order-btn');

    document.addEventListener('DOMContentLoaded', () => {
        ensureClient().then(loadOrders);
        if (createBtn) {
            createBtn.addEventListener('click', () => window.location.href = '/orders/new');
        }
    });

    async function ensureClient() {
        if (!window.ClickCleanAPI) {
            window.location.href = '/login';
            return null;
        }
        const { res, data } = await ClickCleanAPI.fetchJson('/api/auth/me');
        if (res.status === 401 || !data || !data.ok) {
            window.location.href = '/login';
            return null;
        }
        const user = data.user;
        if (user.role !== 'client') {
            window.location.href = user.role === 'courier' ? '/courier' : '/profile';
            return null;
        }
        if (nameEl) {
            nameEl.textContent = user.name || 'Без имени';
        }
        if (phoneEl) {
            phoneEl.textContent = user.phone ? `Телефон: ${user.phone}` : '';
        }
        return user;
    }

    async function loadOrders() {
        if (!ordersList || !window.ClickCleanAPI) {
            return;
        }
        ordersList.innerHTML = skeletonMarkup();
        const { res, data } = await ClickCleanAPI.fetchJson('/api/my/orders');
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        const orders = Array.isArray(data) ? data : (data && data.results) ? data.results : [];
        if (!orders.length) {
            ordersList.innerHTML = "<div class='empty-state'>У вас пока нет активных заказов</div>";
            return;
        }
        ordersList.innerHTML = '';
        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card card-enter';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <h3 style="margin:0;">Заказ #${order.id}</h3>
                    <span style="font-weight:600;">${formatCurrency(order.amount)} ₸</span>
                </div>
                <div class="order-info">
                    ${order.district ? order.district.name : '—'} · ${order.date} · ${order.slot}
                </div>
                <div class="order-info">Вес: ${order.weight_kg ?? '—'} кг</div>
            `;
            ordersList.appendChild(card);
        });
    }

    function skeletonMarkup() {
        return `
            <div class="skeleton" style="height: 60px; margin-bottom: 10px;"></div>
            <div class="skeleton" style="height: 60px; margin-bottom: 10px;"></div>
        `;
    }

    function formatCurrency(value) {
        const number = typeof value === 'number' ? value : parseFloat(value);
        if (Number.isNaN(number)) return value;
        return new Intl.NumberFormat('ru-RU').format(number);
    }
})();
