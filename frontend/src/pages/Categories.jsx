
import { useEffect, useState } from 'react';

import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../api/categoryApi';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { useToast } from '../context/ToastContext';

function Categories() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        color: '#4F46E5'
    });

    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [errors, setErrors] = useState({});

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data.results || data);
        } catch (error) {
            setErrors({
                general: 'Unable to load categories.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setErrors({});
    };

    const resetForm = () => {
        setFormData({
            name: '',
            color: '#4F46E5'
        });

        setEditingId(null);
        setErrors({});
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const name = formData.name.trim();

        if (!name) {
            setErrors({
                name: 'Category name is required.'
            });
            return;
        }

        setSaving(true);
        setErrors({});

        try {
            if (editingId) {
                await updateCategory(editingId, {
                    name,
                    color: formData.color
                });

                showToast('Category updated successfully.');
            } else {
                await createCategory({
                    name,
                    color: formData.color
                });

                showToast('Category created successfully.');
            }

            resetForm();
            await loadCategories();
        } catch (error) {
            const backendErrors = error.response?.data || {};

            const formattedErrors = {};

            Object.entries(backendErrors).forEach(([field, messages]) => {
                formattedErrors[field] = Array.isArray(messages)
                    ? messages.join(' ')
                    : String(messages);
            });

            setErrors(formattedErrors);
            showToast('Unable to save category.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);

        setFormData({
            name: category.name,
            color: category.color
        });

        setErrors({});
    };

    const handleDelete = (category) => {
        setPendingDelete(category);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) {
            return;
        }

        setDeleting(true);
        try {
            await deleteCategory(pendingDelete.id);

            setCategories((previous) =>
                previous.filter((category) => category.id !== pendingDelete.id)
            );

            if (editingId === pendingDelete.id) {
                resetForm();
            }

            showToast('Category deleted successfully.');
        } catch (error) {
            setErrors({
                general: 'Unable to delete category.'
            });
            showToast('Unable to delete category.', 'error');
        } finally {
            setPendingDelete(null);
            setDeleting(false);
        }
    };

    if (loading) {
        return <Loading message='Loading categories...' />;
    }

    return (
        <div className='page-container'>
            <div className='page-header'>
                <div>
                    <h1>Categories</h1>
                    <p>Organize your tasks using categories.</p>
                </div>
            </div>

            {errors.general && (
                <div className='error-alert'>{errors.general}</div>
            )}

            <div className='category-layout'>
                <div className='category-form-card'>
                    <h2>{editingId ? 'Edit Category' : 'Add Category'}</h2>

                    <form onSubmit={handleSubmit}>
                        <div className='form-group'>
                            <label>Category Name *</label>

                            <input
                                type='text'
                                name='name'
                                value={formData.name}
                                onChange={handleChange}
                                placeholder='Enter category name'
                                maxLength={100}
                            />

                            <small className='error-message'>
                                {errors.name || ''}
                            </small>
                        </div>

                        <div className='form-group'>
                            <label>Choose Category Colour</label>

                            <div className='color-picker-row'>
                                <input
                                    type='color'
                                    name='color'
                                    value={formData.color}
                                    onChange={handleChange}
                                />

                                <span>{formData.color}</span>
                            </div>

                            <small className='error-message'>
                                {errors.color || ''}
                            </small>
                        </div>

                        <button
                            type='submit'
                            disabled={saving}
                            className='auth-button'
                        >
                            {saving
                                ? 'Saving...'
                                : editingId
                                    ? 'Update Category'
                                    : 'Add Category'}
                        </button>

                        {editingId && (
                            <button
                                type='button'
                                className='cancel-button'
                                onClick={resetForm}
                            >
                                Cancel Editing
                            </button>
                        )}
                    </form>
                </div>

                <div className='category-list-card'>
                    <h2>My Categories ({categories.length})</h2>

                    {categories.length === 0 ? (
                        <EmptyState
                            title='No categories yet'
                            message='Create a category to organize your tasks.'
                        />
                    ) : (
                        <div className='category-list'>
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className='category-item'
                                >
                                    <div className='category-item-info'>
                                        <span
                                            className='category-large-dot'
                                            style={{
                                                backgroundColor: category.color
                                            }}
                                        />

                                        <div>
                                            <strong>{category.name}</strong>
                                            <small>{category.color}</small>
                                        </div>
                                    </div>

                                    <div className='category-actions'>
                                        <button
                                            type='button'
                                            className='edit-button'
                                            onClick={() => handleEdit(category)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type='button'
                                            className='delete-button'
                                            onClick={() => handleDelete(category)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                title='Delete category?'
                message='Tasks using this category will become uncategorized.'
                confirmLabel='Delete category'
                isBusy={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}

export default Categories;
