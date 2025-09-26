import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';
import Register from './Register';
import Home from './Home';

export default function Landing() {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signOut } = useAuthActions();
  const currentUser = useQuery(api.userProfile.getCurrentUser);
  const createUserProfile = useMutation(api.userProfile.createUserProfile);
  const loginUser = useMutation(api.users.loginUser);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await loginUser({
        username: loginData.username,
        password: loginData.password,
      });

      // Success - set user data and show home page
      setCurrentUser(user);
      setIsLoggedIn(true);
      setLoginData({ username: '', password: '' });
      setShowLoginForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signIn("facebook");
    } catch (err) {
      setError('Facebook login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signIn("google");
    } catch (err) {
      setError('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginData({ username: '', password: '' });
    setError('');
  };

  // Show Home page if user is authenticated (either OAuth or local login)
  if (currentUser || isLoggedIn) {
    return (
      <Home
        username={currentUser?.firstName || currentUser?.username || 'User'}
        onLogout={handleLogout}
      />
    );
  }

  if (showRegister) {
    return (
      <div>
        <button
          onClick={() => setShowRegister(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          ← Back to Login
        </button>
        <Register />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        padding: '3rem',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: '#333',
          marginBottom: '0.5rem',
          fontSize: '2.5rem',
          fontWeight: 'bold'
        }}>
          Welcome to Mongol Shop
        </h1>
        <p style={{
          color: '#666',
          marginBottom: '2.5rem',
          fontSize: '1.1rem'
        }}>
          Your one-stop destination for authentic Mongolian products
        </p>

        <div>
          <h2 style={{
            color: '#333',
            marginBottom: '1.5rem',
            fontSize: '1.8rem'
          }}>
            Login to Continue
          </h2>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #f5c6cb',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Social Login Options */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={handleFacebookLogin}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#6c757d' : '#1877f2',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              margin: '0.5rem',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              maxWidth: '280px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#166fe5';
            }}
            onMouseOut={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#1877f2';
            }}
          >
            {isLoading ? 'Connecting...' : 'Continue with Facebook'}
          </button>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#6c757d' : '#db4437',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              margin: '0.5rem',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              maxWidth: '280px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#c23321';
            }}
            onMouseOut={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#db4437';
            }}
          >
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
        </div>

        {/* Divider */}
        <div style={{
          margin: '1.5rem 0',
          fontSize: '14px',
          color: '#888',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: '#ddd'
          }}></div>
          <span style={{
            backgroundColor: 'white',
            padding: '0 1rem',
            position: 'relative'
          }}>
            Or
          </span>
        </div>

        {/* Username/Password Login */}
        <div>
          {!showLoginForm ? (
            <button
              onClick={() => setShowLoginForm(true)}
              style={{
                backgroundColor: '#333',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                width: '100%',
                maxWidth: '280px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#555'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#333'}
            >
              Login with Username & Password
            </button>
          ) : (
            <form onSubmit={handleLoginSubmit} style={{ maxWidth: '300px', margin: '0 auto' }}>
              {error && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #f5c6cb',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={loginData.username}
                  onChange={handleLoginChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? '#6c757d' : '#28a745',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = '#218838';
                }}
                onMouseOut={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = '#28a745';
                }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => setShowLoginForm(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666',
                  padding: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginTop: '0.5rem',
                  textDecoration: 'underline'
                }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Register Option */}
        <div style={{ marginTop: '2rem' }}>
          <button
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              maxWidth: '280px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onClick={() => setShowRegister(true)}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            Register New Account
          </button>
        </div>

        <div style={{
          marginTop: '1.5rem',
          fontSize: '14px',
          color: '#888',
          lineHeight: '1.4'
        }}>
          Already have an account? Use the login options above
        </div>
        </div>
      </div>
    </div>
  );
}