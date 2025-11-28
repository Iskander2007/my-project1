(function (window) {
    const ACCESS_KEY = 'cc_access_token';
    const REFRESH_KEY = 'cc_refresh_token';
    const LEGACY_ACCESS = 'access';
    const LEGACY_REFRESH = 'refresh';

    function setTokens(tokens) {
        if (!tokens) return;
        if (tokens.access) {
            localStorage.setItem(ACCESS_KEY, tokens.access);
            localStorage.setItem(LEGACY_ACCESS, tokens.access);
        }
        if (tokens.refresh) {
            localStorage.setItem(REFRESH_KEY, tokens.refresh);
            localStorage.setItem(LEGACY_REFRESH, tokens.refresh);
        }
    }

    function clearTokens() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(LEGACY_ACCESS);
        localStorage.removeItem(LEGACY_REFRESH);
    }

    function getAccessToken() {
        return localStorage.getItem(ACCESS_KEY) || localStorage.getItem(LEGACY_ACCESS);
    }

    function getRefreshToken() {
        return localStorage.getItem(REFRESH_KEY) || localStorage.getItem(LEGACY_REFRESH);
    }

    async function fetchWithAuth(url, options = {}) {
        const headers = new Headers(options.headers || {});
        const token = getAccessToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            clearTokens();
        }

        return response;
    }

    async function fetchJson(url, options = {}) {
        const res = await fetchWithAuth(url, options);
        let data = null;
        try {
            data = await res.json();
        } catch (e) {
            data = null;
        }
        return { res, data };
    }

    window.ClickCleanAPI = {
        setTokens,
        clearTokens,
        getAccessToken,
        getRefreshToken,
        fetch: fetchWithAuth,
        fetchJson,
    };
})(window);