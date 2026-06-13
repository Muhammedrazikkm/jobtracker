import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Company from './pages/Company';
import Template from './pages/Template';
import Resume from './pages/Resume';
import TimeManagement from './pages/TimeManagement';
import Status from './pages/Status';
import Layout from './components/Layout';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#334155', color: '#fff' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
        
        {/* Protected Routes inside Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="company" element={<Company />} />
          <Route path="template" element={<Template />} />
          <Route path="resume" element={<Resume />} />
          <Route path="status" element={<Status />} />
          <Route path="time-management" element={<TimeManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
