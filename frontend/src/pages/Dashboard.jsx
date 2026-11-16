import { useEffect, useState } from 'react';

import { getDashboard } from '../api/dashboardApi';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const response = await getDashboard();
                setData(response);
            } catch (err) {
                setError('Unable to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    if (loading) {
        return <Loading message='Loading dashboard...' />;
    }

    if (error) {
        return <p className='error-message'>{error}</p>;
    }

    const statistics = [
        { title: 'Total Tasks', value: data.total_tasks, color: '#4F46E5' },
        { title: 'To Do', value: data.todo_tasks, color: '#64748B' },
        { title: 'In Progress', value: data.in_progress_tasks, color: '#D97706' },
        { title: 'Completed', value: data.done_tasks, color: '#16A34A' },
        { title: 'Overdue', value: data.overdue_tasks, color: '#DC2626' },
        { title: 'Due Today', value: data.due_today_tasks, color: '#2563EB' }
    ];

    return (
        <div className='page-container'>
            <div className='page-header'>
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome to your Task Manager!</p>
                </div>
            </div>

            <div className='dashboard-layout'>
                <aside className='dashboard-menu'>
                    {statistics.map((item) => (
                        <div
                            className='dashboard-card'
                            key={item.title}
                            style={{ borderLeft: `4px solid ${item.color}` }}
                        >
                            <h3>{item.title}</h3>
                            <h2 style={{ color: item.color }}>{item.value}</h2>
                        </div>
                    ))}
                </aside>

                <main className='dashboard-main'>
                    <div className='dashboard-section'>
                        <h2>Overall Progress</h2>
                        <h3>{data.completion_percentage}% Completed</h3>

                        <div className='progress-track'>
                            <div
                                className='progress-fill'
                                style={{ width: `${data.completion_percentage}%` }}
                            />
                        </div>
                    </div>

                    <div className='dashboard-section'>
                        <h2>Tasks by Category</h2>

                        {data.category_counts.length === 0 ? (
                            <EmptyState
                                title='Nothing to summarize yet'
                                message='Add tasks or categories to see them here.'
                            />
                        ) : (
                            <div className='category-summary'>
                                {data.category_counts.map((category) => (
                                    <div className='category-summary-item' key={category.id ?? 'uncategorized'}>
                                        <div className='category-summary-name'>
                                            <span
                                                className='category-dot'
                                                style={{
                                                    backgroundColor: category.color || '#94A3B8'
                                                }}
                                            />
                                            <span>{category.name}</span>
                                        </div>
                                        <strong>{category.task_count} tasks</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;
