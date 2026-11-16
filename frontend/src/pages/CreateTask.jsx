
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import TaskForm from '../components/TaskForm';
import Loading from '../components/Loading';
import { createTask } from '../api/taskApi';
import { getCategories } from '../api/categoryApi';

function CreateTask() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data.results || data);
            } catch (error) {
                setError('Unable to load categories.');
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    const handleCreate = async (taskData) => {
        await createTask(taskData);

        navigate('/tasks', {
            replace: true,
            state: {
                message: 'Task created successfully.'
            }
        });
    };

    if (loading) {
        return <Loading message='Loading form...' />;
    }

    return (
        <div className='form-page'>
            <div className='page-header'>
                <h1>Create New Task</h1>
                <Link to='/tasks' className='secondary-link'>
                    Back to Tasks
                </Link>
            </div>

            {error && <p className='error-message'>{error}</p>}

            <TaskForm
                categories={categories}
                onSubmit={handleCreate}
                submitLabel='Create Task'
            />
        </div>
    );
}

export default CreateTask;
