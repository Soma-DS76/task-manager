
import { Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
    return (
        <Routes>
            <Route
                path='/'
                element={<Navigate to='/dashboard' replace />}
            />

            <Route
                path='/login'
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />

            <Route
                path='/register'
                element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                }
            />

            <Route element={<ProtectedRoute />}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/tasks' element={<TaskList />} />
                <Route path='/tasks/new' element={<CreateTask />} />
                <Route path='/tasks/:id/edit' element={<EditTask />} />
                <Route path='/categories' element={<Categories />} />
                <Route path='/profile' element={<Profile />} />
            </Route>

            <Route path='*' element={<NotFound />} />
        </Routes>
    );
}

export default App;
