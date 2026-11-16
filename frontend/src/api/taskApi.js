
import api from './axios';

export const getTasks = async (params = {}) => {
    const response = await api.get('/tasks/', { params });
    return response.data;
};

export const getTask = async (id) => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
};

export const updateTask = async (id, taskData) => {
    const response = await api.patch(`/tasks/${id}/`, taskData);
    return response.data;
};

export const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}/`);
};

export const toggleTaskComplete = async (id) => {
    const response = await api.patch(`/tasks/${id}/toggle-complete/`);
    return response.data;
};

export const createSubtask = async (taskId, title) => {
    const response = await api.post(`/tasks/${taskId}/subtasks/`, { title });
    return response.data;
};

export const updateSubtask = async (taskId, subtaskId, changes) => {
    const response = await api.patch(
        `/tasks/${taskId}/subtasks/${subtaskId}/`,
        changes
    );
    return response.data;
};

export const deleteSubtask = async (taskId, subtaskId) => {
    await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}/`);
};


