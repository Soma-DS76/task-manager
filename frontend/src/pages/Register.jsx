
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required.';
        }

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

        if (!formData.confirm_password) {
            newErrors.confirm_password = 'Please confirm your password.';
        } else if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match.';
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
            await register(formData);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            const backendErrors = error.response?.data || {};

            setErrors(backendErrors);

            if (backendErrors.detail) {
                setErrors({
                    general: backendErrors.detail.join(' ')
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const getError = (field) => {
        const message = errors[field];

        if (Array.isArray(message)) {
            return message.join(' ');
        }

        return message || '';
    };

    return (
        <div className='auth-container'>
            <form className='auth-card' onSubmit={handleSubmit}>
                <h1>Create Account</h1>
                <p>Register to start managing your tasks.</p>

                {getError('general') && (
                    <p className='error-message'>{getError('general')}</p>
                )}

                <div className='form-group'>
                    <label>First Name</label>
                    <input
                        type='text'
                        name='first_name'
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder='Enter first name'
                    />
                    <small className='error-message'>{getError('first_name')}</small>
                </div>

                <div className='form-group'>
                    <label>Last Name</label>
                    <input
                        type='text'
                        name='last_name'
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder='Enter last name'
                    />
                    <small className='error-message'>{getError('last_name')}</small>
                </div>

                <div className='form-group'>
                    <label>Email</label>
                    <input
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        placeholder='Enter email'
                    />
                    <small className='error-message'>{getError('email')}</small>
                </div>

                <div className='form-group'>
                    <label>Password</label>
                    <input
                        type='password'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        placeholder='Enter password'
                    />
                    <small className='error-message'>{getError('password')}</small>
                </div>

                <div className='form-group'>
                    <label>Confirm Password</label>
                    <input
                        type='password'
                        name='confirm_password'
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder='Confirm password'
                    />
                    <small className='error-message'>
                        {getError('confirm_password')}
                    </small>
                </div>

                <button type='submit' disabled={loading} className='auth-button'>
                    {loading ? 'Registering...' : 'Register'}
                </button>

                <p className='auth-footer'>
                    Already have an account? <Link to='/login'>Login</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;
