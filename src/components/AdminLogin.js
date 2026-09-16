import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [username, setUsername] = useState('HPAIRAdmin@gmail.com');
  const [password, setPassword] = useState('HPAIRR0cks123!');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const result = loginAdmin({ username, password });

    if (result.success) {
      setMessage(result.message);
      navigate('/admin');
      return;
    }

    setMessage(result.message);
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1>Admin Login</h1>
        <p>Access the submitted form data dashboard.</p>

        {message && (
          <div className={`submit-message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="HPAIRAdmin@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter admin password"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Login as Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
