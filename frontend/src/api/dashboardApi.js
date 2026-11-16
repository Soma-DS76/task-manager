
import api from './axios';

export const getDashboard = async () => {
    const response = await api.get('/tasks/dashboard/');
    return response.data;
};
