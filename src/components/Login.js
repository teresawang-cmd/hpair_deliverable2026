import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInUser, registerUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let result;
      if (isLogin) {
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail === 'hpairadmin@gmail.com') {
          result = loginAdmin({ username: email.trim(), password });

          if (result.success) {
            navigate('/admin');
            return;
          }
        } else {
          result = await signInUser(email, password);
        }
      } else {
        result = await registerUser(email, password);
      }

      if (result.success) {
        setMessage(result.message);
        onLogin(result.user);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1>{isLogin ? 'Login' : 'Register'}</h1>
        <p>{isLogin ? 'Sign in to access the form challenge' : 'Create an account to get started'}</p>

        {message && (
          <div className={`submit-message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              required
              minLength="6"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage('');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#007bff', 
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
