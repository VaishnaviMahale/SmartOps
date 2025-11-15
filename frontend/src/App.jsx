import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import WorkflowList from './pages/WorkflowList';
import WorkflowBuilder from './pages/WorkflowBuilder';
import WorkflowDetails from './pages/WorkflowDetails';
import TaskInbox from './pages/TaskInbox';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';

function App() {
  const { user } = useSelector((state) => state.auth);

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }) => {
    return user && (user.role === 'admin' || user.role === 'manager') 
      ? children 
      : <Navigate to="/dashboard" />;
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="workflows" element={<WorkflowList />} />
        <Route path="workflows/new" element={<WorkflowBuilder />} />
        <Route path="workflows/:id" element={<WorkflowDetails />} />
        <Route path="workflows/:id/edit" element={<WorkflowBuilder />} />
        <Route path="tasks" element={<TaskInbox />} />
        <Route
          path="analytics"
          element={
            <AdminRoute>
              <Analytics />
            </AdminRoute>
          }
        />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;

