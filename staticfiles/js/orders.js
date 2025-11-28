(function () {
    const districtSelect = document.getElementById('district-select');
    const slotSelect = document.getElementById('slot-select');
    const form = document.getElementById('order-form');
    const feedback = document.getElementById('order-feedback');
    const backBtn = document.getElementById('back-to-client');
    const dateInput = document.getElementById('order-date');

    document.addEventListener('DOMContentLoaded', () => {
        ensureClient();
        hydrateDate();
        loadDistricts();
        loadSlots();
        if (form) {
            form.addEventListener('submit', submitOrder);
        }
        if (backBtn) {
            backBtn.addEventListener('click', () => window.location.href = '/client');
        }
    });

    function hydrateDate() {
        if (!dateInput) return;
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;
    }

    async function ensureClient() {
        if (!window.ClickCleanAPI) return;
        const { res, data } = await ClickCleanAPI.fetchJson('/api/auth/me');
        if (res.status === 401 || !data || !data.ok) {
            window.location.href = '/login';
            return;
        }
        if (data.user.role !== 'client') {
            window.location.href = data.user.role === 'courier' ? '/courier' : '/profile';
        }
    }

    async function loadDistricts() {
        if (!districtSelect) return;
        districtSelect.innerHTML = '<option value="" disabled selected>Загрузка...</option>';
        try {
            const res = await fetch('/api/meta/districts');
            const data = await res.json();
            const districts = Array.isArray(data) ? data : (data && data.results) ? data.results : [];
            districtSelect.innerHTML = '<option value="" disabled selected>Выберите район</option>';
            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district.id;
                option.textContent = district.name;
                districtSelect.appendChild(option);
            });
        } catch (error) {
            console.error('District load error', error);
            districtSelect.innerHTML = '<option value="" disabled selected>Не удалось загрузить районы</option>';
        }
    }

    async function loadSlots() {
        if (!slotSelect) return;
        slotSelect.innerHTML = '<option value="" disabled selected>Загрузка...</option>';
        try {
            const res = await fetch('/api/meta/slots');
            const data = await res.json();
            const slots = Array.isArray(data) ? data : (data && data.results) ? data.results : [];
            slotSelect.innerHTML = '<option value="" disabled selected>Выберите слот</option>';
            slots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot.value;
                option.textContent = slot.label;
                slotSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Slot load error', error);
            slotSelect.innerHTML = '<option value="" disabled selected>Не удалось загрузить интервалы</option>';
        }
    }

    async function submitOrder(event) {
        event.preventDefault();
        if (!window.ClickCleanAPI) {
            window.location.href = '/login';
            return;
        }
        const payload = collectPayload();
        if (!payload) return;
        setFeedback('', '');
        toggleForm(true);
        const { res, data } = await ClickCleanAPI.fetchJson('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        toggleForm(false);
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        if (res.ok) {
            setFeedback('Заявка отправлена! Курьеры увидят её сразу после публикации.', 'success');
            form.reset();
            hydrateDate();
        } else {
            const message = (data && (data.detail || data.error)) || 'Не удалось создать заказ';
            setFeedback(message, 'error');
        }
    }

    function collectPayload() {
        const district = districtSelect.value;
        const address = document.getElementById('address-input').value.trim();
        const entrance = document.getElementById('entrance-input').value.trim();
        const floor = document.getElementById('floor-input').value.trim();
        const intercom = document.getElementById('intercom-input').value.trim();
        const date = dateInput.value;
        const slot = slotSelect.value;
        const weight = parseFloat(document.getElementById('weight-input').value);
        const amount = parseFloat(document.getElementById('price-input').value);
        const notes = document.getElementById('notes-input').value.trim();

        if (!district || !address || !date || !slot || Number.isNaN(weight) || Number.isNaN(amount)) {
            setFeedback('Проверьте обязательные поля', 'error');
            return null;
        }
        return {
            district,
            address,
            entrance,
            floor,
            intercom,
            date,
            slot,
            weight_kg: weight,
            amount,
            notes,
        };
    }

    function setFeedback(message, state) {
        if (!feedback) return;
        feedback.textContent = message;
        feedback.className = `order-feedback ${state || ''}`;
    }

    function toggleForm(disabled) {
        if (!form) return;
        Array.from(form.querySelectorAll('input, select, textarea, button')).forEach(el => {
            el.disabled = disabled;
        });
    }
})();
