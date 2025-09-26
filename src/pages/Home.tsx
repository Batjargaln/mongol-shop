interface HomeProps {
  username?: string;
  onLogout?: () => void;
}

export default function Home({ username, onLogout }: HomeProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        padding: '3rem',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            color: '#333',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            Welcome {username || 'Guest'}!
          </h1>

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              Logout
            </button>
          )}
        </div>

        <p style={{
          color: '#666',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          You have successfully logged into Mongol Shop! 🎉
        </p>

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: '#333', marginTop: 0 }}>What would you like to do?</h3>
          <ul style={{ color: '#666', lineHeight: '1.8' }}>
            <li>Browse our authentic Mongolian products</li>
            <li>Manage your account settings</li>
            <li>View your order history</li>
            <li>Explore featured items</li>
          </ul>
        </div>
      </div>
    </div>
  );
}