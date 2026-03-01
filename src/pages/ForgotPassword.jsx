import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glossy">
        <Link to="/" className="auth-home-link">
          ← Back to home
        </Link>

        <div className="auth-header">
          <h1 className="auth-title">✨ Pryde Social</h1>
          <p className="auth-subtitle">Reset your password</p>
          <p className="auth-subtext">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="form-input glossy"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary glossy-gold"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
          <p>
            Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

