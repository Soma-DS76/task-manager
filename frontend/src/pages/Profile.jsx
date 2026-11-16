
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/authApi';
import { useToast } from '../context/ToastContext';

function Profile() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_new_password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');

        if (formData.new_password.length < 8) {
            setError('New password must contain at least 8 characters.');
            return;
        }

        if (formData.new_password !== formData.confirm_new_password) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await changePassword(formData);

            showToast(response.message || 'Password changed successfully.');

            setFormData({
                old_password: '',
                new_password: '',
                confirm_new_password: ''
            });
        } catch (err) {
            const errors = err.response?.data || {};
            const firstError = Object.values(errors)[0];

            setError(
                Array.isArray(firstError)
                    ? firstError[0]
                    : firstError || 'Unable to change password.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='page-container'>
            <div className='page-header'>
                <h1>My Profile</h1>
                <p>View your account information and manage your password.</p>
            </div>

            <div className='profile-card'>
                <h2>Personal Information</h2>

                <div className='profile-details'>
                    <div>
                        <strong>First Name</strong>
                        <p>{user?.first_name || 'Not provided'}</p>
                    </div>

                    <div>
                        <strong>Last Name</strong>
                        <p>{user?.last_name || 'Not provided'}</p>
                    </div>

                    <div>
                        <strong>Email Address</strong>
                        <p>{user?.email || 'Not available'}</p>
                    </div>

                    <div>
                        <strong>Username</strong>
                        <p>{user?.username || 'Not available'}</p>
                    </div>
                </div>
            </div>

            <div className='profile-card'>
                <h2>Change Password</h2>

                {error && (
                    <p className='error-message'>{error}</p>
                )}

                <form onSubmit={handleSubmit} className='task-form'>
                    <div className='form-group'>
                        <label>Current Password</label>
                        <input
                            type='password'
                            name='old_password'
                            value={formData.old_password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <label>New Password</label>
                        <input
                            type='password'
                            name='new_password'
                            value={formData.new_password}
                            onChange={handleChange}
                            required
                            minLength={8}
                        />
                    </div>

                    <div className='form-group'>
                        <label>Confirm New Password</label>
                        <input
                            type='password'
                            name='confirm_new_password'
                            value={formData.confirm_new_password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type='submit'
                        className='auth-button'
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Profile;
