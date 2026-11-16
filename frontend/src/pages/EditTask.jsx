
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import TaskForm from '../components/TaskForm';
import Loading from '../components/Loading';

import { getTask, updateTask } from '../api/taskApi';
import { getCategories } from '../api/categoryApi';

function EditTask() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [taskData, categoryData] = await Promise.all([
                    getTask(id),
                    getCategories()
                ]);

                setTask(taskData);
                setCategories(categoryData.results || categoryData);
            } catch (error) {
                setError('Unable to load task details.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleUpdate = async (taskData) => {
        await updateTask(id, taskData);

        navigate('/tasks', {
            replace: true,
            state: {
                message: 'Task updated successfully.'
            }
        });
    };

    if (loading) {
        return <Loading message='Loading task...' />;
    }

    if (error || !task) {
        return (
            <div className='page-container'>
                <p className='error-message'>
                    {error || 'Task not found.'}
                </p>

                <Link to='/tasks' className='primary-link'>
                    Back to Tasks
                </Link>
            </div>
        );
    }

    return (
        <div className='form-page'>
            <div className='page-header'>
                <h1>Edit Task</h1>

                <Link to='/tasks' className='secondary-link'>
                    Back to Tasks
                </Link>
            </div>

            <TaskForm
                initialData={task}
                categories={categories}
                onSubmit={handleUpdate}
                submitLabel='Update Task'
            />
        </div>
    );
}

export default EditTask;
