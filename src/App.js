import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import MultiStepForm from './components/MultiStepForm';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <div className="form-container">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const { adminUser, user, loading } = useAuth();
  const isAdminEmail = user?.email?.trim().toLowerCase() === 'hpairadmin@gmail.com';

  if (loading) {
    return (
      <div className="container">
        <div className="form-container">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!adminUser && !isAdminEmail) {
    return <AdminLogin />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <div className="App-header-inner">
              <span className="App-kicker">HPair</span>
              <h1>Personal Information Form</h1>
            </div>
          </header>
          <main>
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <MultiStepForm />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminPanel />
                </AdminProtectedRoute>
              } />
              <Route path="/admin-login" element={<AdminLogin />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
