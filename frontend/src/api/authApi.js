
import api from './axios';
import axios from 'axios';

export const registerUser = async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me/');
    return response.data;
};

export const changePassword = async (passwordData) => {
    const response = await api.put('/auth/change-password/', passwordData);
    return response.data;
};

export const logoutUser = async (refreshToken) => {
    const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/logout/`,
        { refresh: refreshToken }
    );
    return response.data;
};
