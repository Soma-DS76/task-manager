
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Enter a valid email address.';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required.';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must contain at least 8 characters.';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

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

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await login(formData);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            const backendErrors = error.response?.data || {};

            if (backendErrors.detail) {
                const message = Array.isArray(backendErrors.detail)
                    ? backendErrors.detail.join(' ')
                    : backendErrors.detail;

                setErrors({ general: message });
            } else {
                const formattedErrors = {};

                Object.entries(backendErrors).forEach(([field, messages]) => {
                    formattedErrors[field] = Array.isArray(messages)
                        ? messages.join(' ')
                        : String(messages);
                });

                setErrors(formattedErrors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='auth-container'>
            <form className='auth-card' onSubmit={handleSubmit}>
                <h1>Welcome Back</h1>
                <p>Login to manage your tasks.</p>

                {errors.general && (
                    <p className='error-message'>{errors.general}</p>
                )}

                <div className='form-group'>
                    <label>Email</label>
                    <input
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        placeholder='Enter your email'
                    />
                    <small className='error-message'>{errors.email}</small>
                </div>

                <div className='form-group'>
                    <label>Password</label>
                    <input
                        type='password'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        placeholder='Enter your password'
                    />
                    <small className='error-message'>{errors.password}</small>
                </div>

                <button type='submit' disabled={loading} className='auth-button'>
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <p className='auth-footer'>
                    Don't have an account? <Link to='/register'>Register</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
