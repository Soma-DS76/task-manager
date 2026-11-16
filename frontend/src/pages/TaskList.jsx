
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import {
    getTasks,
    deleteTask,
    toggleTaskComplete,
    updateTask,
    createSubtask,
    updateSubtask,
    deleteSubtask
} from '../api/taskApi';

import { getCategories } from '../api/categoryApi';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { useToast } from '../context/ToastContext';

function TaskList() {
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchInput, setSearchInput] = useState(
        searchParams.get('search') || ''
    );

    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(
        location.state?.message || ''
    );
    const [boardView, setBoardView] = useState(false);
    const [subtaskInputs, setSubtaskInputs] = useState({});
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const queryString = useMemo(() => {
        const params = new URLSearchParams(searchParams);
        if (boardView) {
            params.delete('status');
            params.delete('page');
        }
        return params.toString();
    }, [searchParams, boardView]);

    const currentPage = Number(searchParams.get('page') || 1);
    const totalPages = Math.max(1, Math.ceil(count / 10));

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = Object.fromEntries(
                new URLSearchParams(queryString)
            );

            const response = await getTasks(
                boardView ? { ...params, page_size: 100 } : params
            );
            let resultTasks = response.results || response;

            if (boardView && response.count > resultTasks.length) {
                const pageCount = Math.ceil(response.count / resultTasks.length);
                const remainingPages = await Promise.all(
                    Array.from({ length: pageCount - 1 }, (_, index) =>
                        getTasks({ ...params, page_size: 100, page: index + 2 })
                    )
                );
                resultTasks = resultTasks.concat(
                    ...remainingPages.map((page) => page.results)
                );
            }

            setTasks(resultTasks);
            setCount(response.count ?? resultTasks.length);
        } catch (err) {
            console.error(err);
            setError('Unable to load tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [queryString, boardView]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await getCategories();
                setCategories(response.results || response);
            } catch (err) {
                console.error('Category loading failed:', err);
            }
        };

        loadCategories();
    }, []);

    // Keep the search input synchronized with browser navigation.
    useEffect(() => {
        setSearchInput(searchParams.get('search') || '');
    }, [searchParams]);

    // Update the URL only after the user stops typing for 500 ms.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchParams((previous) => {
                const next = new URLSearchParams(previous);

                if (searchInput.trim()) {
                    next.set('search', searchInput.trim());
                } else {
                    next.delete('search');
                }

                next.delete('page');
                return next;
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput, setSearchParams]);

    const updateFilter = (name, value) => {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);

            if (value) {
                next.set(name, value);
            } else {
                next.delete(name);
            }

            next.delete('page');
            return next;
        });
    };

    const changePage = (page) => {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.set('page', String(page));
            return next;
        });
    };

    const handleToggle = async (taskId) => {
        try {
            const response = await toggleTaskComplete(taskId);

            setTasks((previous) =>
                previous.map((task) =>
                    task.id === taskId ? response.task : task
                )
            );
            if (response.task.recurrence !== 'none') {
                await loadTasks();
            }
        } catch (err) {
            console.error(err);
            setError('Unable to update task status.');
        }
    };

    const handleStatusChange = async (taskId, status) => {
        try {
            const updatedTask = await updateTask(taskId, { status });
            setTasks((previous) =>
                previous.map((task) => task.id === taskId ? updatedTask : task)
            );
            if (status === 'Done' && updatedTask.recurrence !== 'none') {
                await loadTasks();
            }
        } catch (err) {
            console.error(err);
            setError('Unable to move task to that status.');
        }
    };

    const handleDrop = (event, status) => {
        event.preventDefault();
        const taskId = Number(event.dataTransfer.getData('text/plain'));
        const task = tasks.find((item) => item.id === taskId);
        if (task && task.status !== status) {
            handleStatusChange(taskId, status);
        }
    };

    const handleAddSubtask = async (taskId) => {
        const title = (subtaskInputs[taskId] || '').trim();
        if (!title) return;

        try {
            const subtask = await createSubtask(taskId, title);
            setTasks((previous) =>
                previous.map((task) => task.id === taskId
                    ? { ...task, subtasks: [...(task.subtasks || []), subtask] }
                    : task
                )
            );
            setSubtaskInputs((previous) => ({ ...previous, [taskId]: '' }));
        } catch (err) {
            console.error(err);
            setError('Unable to add checklist item.');
        }
    };

    const handleSubtaskToggle = async (taskId, subtask) => {
        try {
            const updatedSubtask = await updateSubtask(
                taskId,
                subtask.id,
                { is_completed: !subtask.is_completed }
            );
            setTasks((previous) =>
                previous.map((task) => task.id === taskId
                    ? {
                        ...task,
                        subtasks: task.subtasks.map((item) =>
                            item.id === subtask.id ? updatedSubtask : item
                        )
                    }
                    : task
                )
            );
        } catch (err) {
            console.error(err);
            setError('Unable to update checklist item.');
        }
    };

    const handleDeleteSubtask = async (taskId, subtaskId) => {
        try {
            await deleteSubtask(taskId, subtaskId);
            setTasks((previous) =>
                previous.map((task) => task.id === taskId
                    ? {
                        ...task,
                        subtasks: task.subtasks.filter((item) => item.id !== subtaskId)
                    }
                    : task
                )
            );
        } catch (err) {
            console.error(err);
            setError('Unable to delete checklist item.');
        }
    };

    const handleDelete = (task) => {
        setPendingDelete(task);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;

        setDeleting(true);
        try {
            await deleteTask(pendingDelete.id);

            setTasks((previous) =>
                previous.filter((task) => task.id !== pendingDelete.id)
            );

            setCount((previous) => Math.max(0, previous - 1));
            showToast('Task deleted successfully.');
        } catch (err) {
            console.error(err);
            setError('Unable to delete task.');
            showToast('Unable to delete task.', 'error');
        } finally {
            setPendingDelete(null);
            setDeleting(false);
        }
    };

    const getCategory = (categoryId) => {
        return categories.find(
            (category) => category.id === categoryId
        );
    };

    const isOverdue = (task) => {
        return (
            task.due_date &&
            new Date(task.due_date) < new Date() &&
            task.status !== 'Done'
        );
    };

    const formatDate = (date) => {
        if (!date) return 'No due date';

        return new Date(date).toLocaleString();
    };

    const renderTaskCard = (task) => {
        const category = getCategory(task.category);
        const subtasks = task.subtasks || [];
        const completedSubtasks = subtasks.filter((item) => item.is_completed).length;

        return (
            <div
                className={`task-card ${isOverdue(task) ? 'overdue-task' : ''}`}
                key={task.id}
                draggable={boardView}
                onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', String(task.id));
                    event.dataTransfer.effectAllowed = 'move';
                }}
            >
                <div className='task-card-header'>
                    <label className='task-checkbox'>
                        <input
                            type='checkbox'
                            checked={task.status === 'Done'}
                            onChange={() => handleToggle(task.id)}
                        />
                    </label>

                    <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                    </span>
                </div>

                <h3 className={task.status === 'Done' ? 'completed-title' : ''}>
                    {task.title}
                </h3>

                {task.description && <p>{task.description}</p>}

                <div className='task-category'>
                    <span
                        className='category-dot'
                        style={{ backgroundColor: category?.color || '#94A3B8' }}
                    />
                    {category?.name || 'Uncategorized'}
                </div>

                <p className='task-status'>Status: {task.status}</p>

                <p className={isOverdue(task) ? 'overdue-text' : 'task-due-date'}>
                    {isOverdue(task) ? 'Overdue: ' : 'Due: '}
                    {formatDate(task.due_date)}
                </p>

                {task.recurrence !== 'none' && (
                    <p className='task-recurrence'>
                        Repeats {task.recurrence}
                    </p>
                )}

                <section className='subtask-list' aria-label={`Checklist for ${task.title}`}>
                    <h4>Checklist ({completedSubtasks}/{subtasks.length})</h4>
                    {subtasks.map((subtask) => (
                        <div className='subtask-item' key={subtask.id}>
                            <label>
                                <input
                                    type='checkbox'
                                    checked={subtask.is_completed}
                                    onChange={() => handleSubtaskToggle(task.id, subtask)}
                                />
                                <span className={subtask.is_completed ? 'subtask-completed' : ''}>
                                    {subtask.title}
                                </span>
                            </label>
                            <button
                                type='button'
                                aria-label={`Delete ${subtask.title}`}
                                onClick={() => handleDeleteSubtask(task.id, subtask.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <div className='subtask-add'>
                        <input
                            type='text'
                            value={subtaskInputs[task.id] || ''}
                            aria-label='New checklist item'
                            placeholder='Add checklist item'
                            onChange={(event) =>
                                setSubtaskInputs((previous) => ({
                                    ...previous,
                                    [task.id]: event.target.value
                                }))
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    handleAddSubtask(task.id);
                                }
                            }}
                        />
                        <button type='button' onClick={() => handleAddSubtask(task.id)}>
                            Add
                        </button>
                    </div>
                </section>

                {boardView && (
                    <label className='board-status-select'>
                        Move to
                        <select
                            value={task.status}
                            onChange={(event) => handleStatusChange(task.id, event.target.value)}
                        >
                            <option value='To Do'>To Do</option>
                            <option value='In Progress'>In Progress</option>
                            <option value='Done'>Done</option>
                        </select>
                    </label>
                )}

                <div className='task-actions'>
                    <Link to={`/tasks/${task.id}/edit`} className='edit-button'>
                        Edit
                    </Link>
                    <button
                        type='button'
                        className='delete-button'
                        onClick={() => handleDelete(task)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className='page-container'>
            <div className='page-header'>
                <div>
                    <h1>My Tasks</h1>
                    <p>Manage and organize your tasks.</p>
                </div>

                <Link to='/tasks/new' className='primary-link'>
                    + Create Task
                </Link>
            </div>

            <div className='task-view-toggle' role='group' aria-label='Task view'>
                <button
                    type='button'
                    className={!boardView ? 'active' : ''}
                    aria-pressed={!boardView}
                    onClick={() => setBoardView(false)}
                >
                    List
                </button>
                <button
                    type='button'
                    className={boardView ? 'active' : ''}
                    aria-pressed={boardView}
                    onClick={() => setBoardView(true)}
                >
                    Kanban board
                </button>
            </div>

            {message && (
                <div className='success-message'>
                    {message}
                </div>
            )}

            {error && (
                <div className='error-message'>
                    {error}
                </div>
            )}

            <div className='task-filters'>
                <input
                    type='search'
                    placeholder='Search tasks...'
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className='search-input'
                />

                {!boardView && <select
                    value={searchParams.get('status') || ''}
                    onChange={(event) =>
                        updateFilter('status', event.target.value)
                    }
                >
                    <option value=''>All Statuses</option>
                    <option value='To Do'>To Do</option>
                    <option value='In Progress'>In Progress</option>
                    <option value='Done'>Done</option>
                </select>}

                <select
                    value={searchParams.get('priority') || ''}
                    onChange={(event) =>
                        updateFilter('priority', event.target.value)
                    }
                >
                    <option value=''>All Priorities</option>
                    <option value='Low'>Low</option>
                    <option value='Medium'>Medium</option>
                    <option value='High'>High</option>
                </select>

                <select
                    value={searchParams.get('category') || ''}
                    onChange={(event) =>
                        updateFilter('category', event.target.value)
                    }
                >
                    <option value=''>All Categories</option>

                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                <select
                    value={searchParams.get('due') || ''}
                    onChange={(event) =>
                        updateFilter('due', event.target.value)
                    }
                >
                    <option value=''>All Due Dates</option>
                    <option value='today'>Today</option>
                    <option value='overdue'>Overdue</option>
                    <option value='upcoming'>Upcoming</option>
                </select>

                <select
                    value={searchParams.get('ordering') || ''}
                    onChange={(event) =>
                        updateFilter('ordering', event.target.value)
                    }
                >
                    <option value=''>Default Sorting</option>
                    <option value='due_date'>Due Date (Oldest First)</option>
                    <option value='-due_date'>Due Date (Newest First)</option>
                    <option value='priority'>Priority</option>
                    <option value='-priority'>Priority (Reverse)</option>
                    <option value='created_at'>Created Date (Oldest First)</option>
                    <option value='-created_at'>Created Date (Newest First)</option>
                </select>
            </div>

            {loading ? (
                <Loading message='Loading tasks...' />
            ) : tasks.length === 0 ? (
                <EmptyState
                    title='No tasks found'
                    message='Try changing your filters or create a new task.'
                    action={
                        <Link to='/tasks/new' className='primary-link'>
                            Create task
                        </Link>
                    }
                />
            ) : boardView ? (
                <div className='kanban-board'>
                    {['To Do', 'In Progress', 'Done'].map((status) => (
                        <section
                            className='kanban-column'
                            key={status}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, status)}
                            aria-label={`${status} tasks`}
                        >
                            <h2>{status}</h2>
                            <div className='kanban-column-tasks'>
                                {tasks.filter((task) => task.status === status).map(renderTaskCard)}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className='task-grid'>
                    {tasks.map(renderTaskCard)}
                </div>
            )}

            {!loading && !boardView && count > 0 && (
                <div className='pagination'>
                    <button
                        type='button'
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </button>

                    <span>
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        type='button'
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                title='Delete task?'
                message={pendingDelete ? `${pendingDelete.title} will be permanently deleted.` : ''}
                confirmLabel='Delete task'
                isBusy={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}

export default TaskList;
