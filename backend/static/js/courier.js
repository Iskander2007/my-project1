(function () {
    const ordersContainer = document.getElementById('courier-orders');
    const statusToggle = document.getElementById('status-toggle');
    const statusDot = document.getElementById('courier-status');
    const nameEl = document.getElementById('courier-name');
    const phoneEl = document.getElementById('courier-phone');
    const roleEl = document.getElementById('courier-role');
    const activeWrapper = document.getElementById('active-order-wrapper');
    const activeTitle = document.getElementById('active-order-title');
    const activeAddress = document.getElementById('active-order-address');
    const activeMeta = document.getElementById('active-order-meta');
    const activeTimer = document.getElementById('active-order-timer');
    const completeBtn = document.getElementById('complete-order-btn');
    const mapEl = document.getElementById('active-order-map');

    let timerInterval = null;
    let activeOrder = null;
    let mapInstance = null;
    let courierMarker = null;
    let orderMarker = null;
    let routeLine = null;
    let courierCoords = null;
    let geoWatchId = null;

    document.addEventListener('DOMContentLoaded', () => {
        ensureCourier().then(() => {
            loadActiveOrder();
            loadOrders();
        });
        if (statusToggle) {
            statusToggle.addEventListener('change', handleStatusChange);
        }
        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                if (activeOrder) {
                    completeActiveOrder(activeOrder.id);
                }
            });
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
            ordersContainer.innerHTML = "<div class='empty-state'>Новых заказов пока нет</div>";
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
        const defaultLabel = button.textContent;
        button.textContent = 'Отправляем...';
        const { res, data } = await ClickCleanAPI.fetchJson(`/api/orders/${id}/take`, {
            method: 'POST',
        });
        if (res.ok) {
            button.textContent = 'Готово';
            await loadActiveOrder();
            loadOrders();
        } else {
            button.disabled = false;
            button.textContent = defaultLabel;
            const message = (data && (data.detail || data.error)) || 'Не удалось взять заказ';
            alert(message);
        }
    }

    async function loadActiveOrder() {
        if (!activeWrapper || !window.ClickCleanAPI) return;
        stopTimer();
        const { res, data } = await ClickCleanAPI.fetchJson('/api/my/courier/orders');
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        const orders = Array.isArray(data) ? data : (data && data.results) ? data.results : [];
        if (!orders.length) {
            activeOrder = null;
            activeWrapper.classList.add('hidden');
            if (completeBtn) {
                completeBtn.disabled = true;
                completeBtn.textContent = 'Завершить заказ';
            }
            clearRouteLayers();
            return;
        }
        activeOrder = orders[0];
        renderActiveOrder();
    }

    function renderActiveOrder() {
        if (!activeOrder || !activeWrapper) return;
        activeWrapper.classList.remove('hidden');
        activeTitle.textContent = `${activeOrder.district ? activeOrder.district.name : 'Заказ'} · #${activeOrder.id}`;
        activeAddress.textContent = `${activeOrder.address}`;
        activeMeta.innerHTML = `
            <div>
                <span>Дата и слот</span>
                <strong>${activeOrder.date} · ${activeOrder.slot}</strong>
            </div>
            <div>
                <span>Вес</span>
                <strong>${activeOrder.weight_kg ?? '—'} кг</strong>
            </div>
            <div>
                <span>Оплата</span>
                <strong>${formatCurrency(activeOrder.amount)} ₸</strong>
            </div>
        `;
        if (completeBtn) {
            completeBtn.disabled = false;
            completeBtn.textContent = 'Завершить заказ';
        }
        startTimer();
        initLiveMap();
        updateRoute();
    }

    function startTimer() {
        if (!activeOrder || !activeTimer) return;
        stopTimer();
        const startedAt = Date.now();
        const tick = () => {
            const diff = Math.max(0, Date.now() - startedAt);
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            activeTimer.textContent = `${pad(minutes)}:${pad(seconds)}`;
        };
        tick();
        timerInterval = setInterval(tick, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    async function completeActiveOrder(orderId) {
        if (!window.ClickCleanAPI || !completeBtn) return;
        completeBtn.disabled = true;
        const prevLabel = completeBtn.textContent;
        completeBtn.textContent = 'Завершаем...';
        const { res, data } = await ClickCleanAPI.fetchJson(`/api/orders/${orderId}/complete`, { method: 'POST' });
        if (res.ok) {
            completeBtn.textContent = 'Готово';
            await loadActiveOrder();
            loadOrders();
            setTimeout(() => {
                if (completeBtn) {
                    completeBtn.textContent = 'Завершить заказ';
                }
            }, 1500);
        } else {
            completeBtn.disabled = false;
            completeBtn.textContent = prevLabel;
            const message = (data && (data.detail || data.error)) || 'Не удалось завершить заказ';
            alert(message);
        }
    }

    function initLiveMap() {
        if (!mapEl || !window.L) return;
        if (!mapInstance) {
            mapInstance = L.map(mapEl).setView([43.238949, 76.889709], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance);
        }
        setTimeout(() => mapInstance.invalidateSize(), 120);
        if (!navigator.geolocation) {
            return;
        }
        if (geoWatchId !== null) {
            return;
        }
        geoWatchId = navigator.geolocation.watchPosition((pos) => {
            courierCoords = [pos.coords.latitude, pos.coords.longitude];
            if (mapInstance) {
                mapInstance.setView(courierCoords, 14);
            }
            if (courierMarker) {
                courierMarker.setLatLng(courierCoords);
            } else if (mapInstance) {
                courierMarker = L.marker(courierCoords, { title: 'Вы' }).addTo(mapInstance);
            }
            updateRoute();
        }, () => {
            // fallback: keep default center
        }, { enableHighAccuracy: true, maximumAge: 5000 });
    }

    function updateRoute() {
        if (!mapInstance || !activeOrder) return;
        const orderCoords = getOrderCoords();
        if (!orderCoords) {
            clearRouteLayers('order');
            return;
        }
        if (orderMarker) {
            orderMarker.setLatLng(orderCoords);
        } else {
            orderMarker = L.marker(orderCoords, { title: 'Адрес клиента' }).addTo(mapInstance);
        }
        if (courierCoords) {
            if (routeLine) {
                routeLine.setLatLngs([courierCoords, orderCoords]);
            } else {
                routeLine = L.polyline([courierCoords, orderCoords], {
                    color: '#18B06D',
                    weight: 5,
                    opacity: 0.85,
                }).addTo(mapInstance);
            }
            mapInstance.fitBounds([courierCoords, orderCoords], { padding: [30, 30] });
        }
    }

    function getOrderCoords() {
        if (!activeOrder) return null;
        const lat = parseFloat(activeOrder.latitude);
        const lon = parseFloat(activeOrder.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return null;
        }
        return [lat, lon];
    }

    function clearRouteLayers(scope = 'all') {
        if ((scope === 'all' || scope === 'order') && orderMarker && mapInstance) {
            mapInstance.removeLayer(orderMarker);
            orderMarker = null;
        }
        if ((scope === 'all' || scope === 'order') && routeLine && mapInstance) {
            mapInstance.removeLayer(routeLine);
            routeLine = null;
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

    function pad(value) {
        return String(value).padStart(2, '0');
    }

})();
