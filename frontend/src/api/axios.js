
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token helpers
const getAccessToken = () => localStorage.getItem('access_token');

const getRefreshToken = () => localStorage.getItem('refresh_token');

const saveAccessToken = (token) => {
    localStorage.setItem('access_token', token);
};

export const clearAuthTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

const redirectToLogin = () => {
    clearAuthTokens();

    if (window.location.pathname !== '/login') {
        window.location.replace('/login');
    }
};

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Refresh token queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });

    failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (!error.response || error.response.status !== 401) {
            return Promise.reject(error);
        }

        if (!originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }

        const requestUrl = originalRequest.url || '';

        const excludedUrls = [
            '/auth/login/',
            '/auth/register/',
            '/auth/token/refresh/',
        ];

        if (excludedUrls.some((url) => requestUrl.includes(url))) {
            return Promise.reject(error);
        }

        const refreshToken = getRefreshToken();

        if (!refreshToken) {
            redirectToLogin();
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve,
                    reject,
                });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            }).catch((refreshError) => {
                return Promise.reject(refreshError);
            });
        }

        isRefreshing = true;

        try {
            const response = await axios.post(
                `${BASE_URL}/auth/token/refresh/`,
                {
                    refresh: refreshToken,
                }
            );

            const newAccessToken = response.data.access;

            saveAccessToken(newAccessToken);
            if (response.data.refresh) {
                localStorage.setItem('refresh_token', response.data.refresh);
            }

            api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return api(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError, null);
            redirectToLogin();

            return Promise.reject(refreshError);

        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
