import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (username: string, password: string) => {
    // Qui potresti fare una chiamata API per il login.
    // Per ora facciamo finta che sia sempre valido:
    console.log("Login effettuato con:", username, password);
    navigate('/dashboard');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard Dottore - Login</h1>
      <LoginForm onLogin={handleLogin} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '400px',
    margin: '100px auto',
    padding: '30px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#2c3e50',
  },
};

export default LoginPage;