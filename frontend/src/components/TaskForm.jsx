
import { useEffect, useState } from 'react';

function toDateTimeLocal(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
}

function TaskForm({
    initialData = null,
    categories = [],
    onSubmit,
    submitLabel = 'Save Task'
}) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        status: 'To Do',
        due_date: '',
        recurrence: 'none'
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                category: initialData.category || '',
                priority: initialData.priority || 'Medium',
                status: initialData.status || 'To Do',
                due_date: toDateTimeLocal(initialData.due_date),
                recurrence: initialData.recurrence || 'none'
            });
        }
    }, [initialData]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: ''
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Task title is required.';
        } else if (formData.title.trim().length < 3) {
            newErrors.title = 'Title must contain at least 3 characters.';
        } else if (formData.title.trim().length > 100) {
            newErrors.title = 'Title cannot exceed 100 characters.';
        }

        if (
            formData.due_date &&
            !initialData &&
            new Date(formData.due_date) < new Date()
        ) {
            newErrors.due_date = 'Due date cannot be in the past.';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category || null,
            priority: formData.priority,
            status: formData.status,
            recurrence: formData.recurrence,
            due_date: formData.due_date
                ? new Date(formData.due_date).toISOString()
                : null
        };

        try {
            await onSubmit(payload);
        } catch (error) {
            const backendErrors = error.response?.data || {};

            const formattedErrors = {};

            Object.entries(backendErrors).forEach(([field, messages]) => {
                formattedErrors[field] = Array.isArray(messages)
                    ? messages.join(' ')
                    : String(messages);
            });

            setErrors(formattedErrors);
        } finally {
            setLoading(false);
        }
    };

    const getError = (field) => errors[field] || '';

    return (
        <form className='task-form' onSubmit={handleSubmit}>
            <div className='form-group'>
                <label>Task Title *</label>

                <input
                    type='text'
                    name='title'
                    value={formData.title}
                    onChange={handleChange}
                    placeholder='Enter task title'
                    maxLength={100}
                />

                <small className='error-message'>
                    {getError('title')}
                </small>
            </div>

            <div className='form-group'>
                <label>Description</label>

                <textarea
                    name='description'
                    value={formData.description}
                    onChange={handleChange}
                    placeholder='Enter task description'
                    rows={4}
                />

                <small className='error-message'>
                    {getError('description')}
                </small>
            </div>

            <div className='form-group'>
                <label>Category</label>

                <select
                    name='category'
                    value={formData.category || ''}
                    onChange={handleChange}
                >
                    <option value=''>No Category</option>

                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                <small className='error-message'>
                    {getError('category')}
                </small>
            </div>

            <div className='form-group'>
                <label>Priority</label>

                <select
                    name='priority'
                    value={formData.priority}
                    onChange={handleChange}
                >
                    <option value='Low'>Low</option>
                    <option value='Medium'>Medium</option>
                    <option value='High'>High</option>
                </select>

                <small className='error-message'>
                    {getError('priority')}
                </small>
            </div>

            <div className='form-group'>
                <label>Status</label>

                <select
                    name='status'
                    value={formData.status}
                    onChange={handleChange}
                >
                    <option value='To Do'>To Do</option>
                    <option value='In Progress'>In Progress</option>
                    <option value='Done'>Done</option>
                </select>

                <small className='error-message'>
                    {getError('status')}
                </small>
            </div>

            <div className='form-group'>
                <label>Due Date</label>

                <input
                    type='datetime-local'
                    name='due_date'
                    value={formData.due_date}
                    onChange={handleChange}
                />

                <small className='error-message'>
                    {getError('due_date')}
                </small>
            </div>

            <div className='form-group'>
                <label>Repeat</label>

                <select
                    name='recurrence'
                    value={formData.recurrence}
                    onChange={handleChange}
                >
                    <option value='none'>Does not repeat</option>
                    <option value='daily'>Daily</option>
                    <option value='weekly'>Weekly</option>
                </select>

                <small className='error-message'>
                    {getError('recurrence')}
                </small>
            </div>

            {getError('detail') && (
                <p className='error-message'>{getError('detail')}</p>
            )}

            <button
                type='submit'
                disabled={loading}
                className='auth-button'
            >
                {loading ? 'Saving...' : submitLabel}
            </button>
        </form>
    );
}

export default TaskForm;
