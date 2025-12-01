(function () {
    const districtSelect = document.getElementById('district-select');
    const slotSelect = document.getElementById('slot-select');
    const form = document.getElementById('order-form');
    const feedback = document.getElementById('order-feedback');
    const backBtn = document.getElementById('back-to-client');
    const dateInput = document.getElementById('order-date');
    const phoneInput = document.getElementById('contact-phone');
    const weightInput = document.getElementById('weight-input');
    const priceInput = document.getElementById('price-input');
    const addressInput = document.getElementById('address-input');
    const geocodeBtn = document.getElementById('geocode-btn');
    const geocodeStatus = document.getElementById('geocode-status');
    const latitudeInput = document.getElementById('latitude-input');
    const longitudeInput = document.getElementById('longitude-input');
    const mapContainer = document.getElementById('address-map');
    let priceDirty = false;
    let cachedPhone = '';
    let addressMap = null;
    let addressMarker = null;

    document.addEventListener('DOMContentLoaded', () => {
        ensureClient();
        hydrateDate();
        loadDistricts();
        loadSlots();
        setupAutoPrice();
        if (form) {
            form.addEventListener('submit', submitOrder);
        }
        if (backBtn) {
            backBtn.addEventListener('click', () => window.location.href = '/client');
        }
        if (geocodeBtn) {
            geocodeBtn.addEventListener('click', geocodeAddress);
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
            return;
        }
        cachedPhone = data.user.phone || '';
        if (phoneInput && !phoneInput.value) {
            phoneInput.value = cachedPhone;
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
            priceDirty = false;
            if (phoneInput) {
                phoneInput.value = cachedPhone;
            }
            resetGeocodeState();
            window.location.href = '/client';
        } else {
            const message = (data && (data.detail || data.error)) || 'Не удалось создать заказ';
            setFeedback(message, 'error');
        }
    }

    function collectPayload() {
        const district = districtSelect.value;
        const address = addressInput.value.trim();
        const entrance = document.getElementById('entrance-input').value.trim();
        const floor = document.getElementById('floor-input').value.trim();
        const intercom = document.getElementById('intercom-input').value.trim();
        const date = dateInput.value;
        const slot = slotSelect.value;
        const weight = parseFloat(document.getElementById('weight-input').value);
        const amount = parseFloat(document.getElementById('price-input').value);
        const notes = document.getElementById('notes-input').value.trim();
        const contactPhone = phoneInput ? phoneInput.value.trim() : '';
        const latitude = latitudeInput ? parseFloat(latitudeInput.value) : NaN;
        const longitude = longitudeInput ? parseFloat(longitudeInput.value) : NaN;

        if (!district || !address || !date || !slot || Number.isNaN(weight) || Number.isNaN(amount)) {
            setFeedback('Проверьте обязательные поля', 'error');
            return null;
        }
        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            setFeedback('Нажмите «Определить координаты», чтобы указать точку на карте.', 'error');
            return null;
        }
        const combinedNotes = contactPhone
            ? `Телефон для связи: ${contactPhone}${notes ? '\n' + notes : ''}`
            : notes;
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
            notes: combinedNotes,
            latitude,
            longitude,
        };
    }

    function setFeedback(message, state) {
        if (!feedback) return;
        feedback.textContent = message;
        feedback.className = `order-feedback ${state || ''}`;
    }

    async function geocodeAddress() {
        if (!addressInput) return;
        const query = addressInput.value.trim();
        if (!query) {
            setGeocodeStatus('Введите адрес для поиска', 'error');
            return;
        }
        setGeocodeStatus('Определяем координаты...', 'info');
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
            const res = await fetch(url, {
                headers: {
                    'Accept-Language': 'ru',
                },
            });
            if (!res.ok) {
                throw new Error('Geocode HTTP error');
            }
            const data = await res.json();
            if (!Array.isArray(data) || !data.length) {
                setGeocodeStatus('Не нашли такой адрес. Уточните ввод.', 'error');
                return;
            }
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            if (latitudeInput) {
                latitudeInput.value = lat.toFixed(6);
            }
            if (longitudeInput) {
                longitudeInput.value = lon.toFixed(6);
            }
            showAddressOnMap(lat, lon);
            setGeocodeStatus('Координаты сохранены', 'success');
        } catch (error) {
            console.error('Geocode error', error);
            setGeocodeStatus('Не удалось определить координаты. Попробуйте позже или введите вручную.', 'error');
        }
    }

    function showAddressOnMap(lat, lon) {
        if (!mapContainer || !window.L) return;
        mapContainer.classList.remove('hidden');
        if (!addressMap) {
            addressMap = L.map(mapContainer).setView([lat, lon], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(addressMap);
        }
        setTimeout(() => addressMap.invalidateSize(), 100);
        if (addressMarker) {
            addressMarker.setLatLng([lat, lon]);
        } else {
            addressMarker = L.marker([lat, lon]).addTo(addressMap);
        }
        addressMap.setView([lat, lon], 15);
    }

    function setGeocodeStatus(message, state) {
        if (!geocodeStatus) return;
        geocodeStatus.textContent = message;
        geocodeStatus.style.color = state === 'error' ? '#ff6b6b' : state === 'success' ? '#18B06D' : 'var(--text-muted)';
    }

    function resetGeocodeState() {
        if (latitudeInput) {
            latitudeInput.value = '';
        }
        if (longitudeInput) {
            longitudeInput.value = '';
        }
        if (geocodeStatus) {
            geocodeStatus.textContent = '';
        }
        if (mapContainer) {
            mapContainer.classList.add('hidden');
        }
        if (addressMap) {
            addressMap.remove();
            addressMap = null;
            addressMarker = null;
        }
    }

    function toggleForm(disabled) {
        if (!form) return;
        Array.from(form.querySelectorAll('input, select, textarea, button')).forEach(el => {
            el.disabled = disabled;
        });
    }

    function setupAutoPrice() {
        if (!weightInput || !priceInput) return;
        const recalc = () => {
            if (priceDirty) return;
            const weight = parseFloat(weightInput.value);
            if (Number.isNaN(weight) || weight <= 0) {
                priceInput.value = '';
                return;
            }
            const suggested = Math.max(500, Math.round((weight * 120) / 10) * 10);
            priceInput.value = suggested;
        };
        weightInput.addEventListener('input', recalc);
        priceInput.addEventListener('input', () => {
            priceDirty = true;
        });
    }
})();
