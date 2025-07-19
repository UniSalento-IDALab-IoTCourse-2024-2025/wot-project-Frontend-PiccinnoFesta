import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import logoFrontendFull from '../assets/images/logoFrontendFull.png'; 

const LOGIN_API_URL = '/api/users/doctor/login';    
const SIGNUP_API_URL = '/api/users/doctor/signUp';  

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    license: '',
  });

  const handleLogin = async (email: string, password: string) => {
  try {
    const payload = JSON.stringify({ email, password });
    const response = await fetch(LOGIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    console.log('Dati di login:', payload);
    const text = await response.text();
    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (jsonError) {
      console.error("Errore nel parsing JSON:", jsonError);
      throw new Error("Risposta non valida dal server");
    }

    console.log('Dati ricevuti dal server:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Errore durante il login');
    }

    if (data.jwt) {
      const token = data.jwt;
      localStorage.setItem('authToken', token);

      // 🔽 CHIAMATA PER PROFILO DOCTOR
      const profileResponse = await fetch('/api/users/doctor', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Errore nel recupero del profilo del dottore');
      }

      const doctorProfile = await profileResponse.json();
      
      localStorage.setItem('doctorProfile', JSON.stringify(doctorProfile));


      // 🔁 Navigazione solo dopo aver ricevuto e salvato il profilo
      navigate('/dashboard');
    } else {
      throw new Error('JWT non presente nella risposta');
    }
  } catch (error: any) {
    alert(`Login fallito: ${error.message}`);
  }
};

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, surname, email, password, license } = signupData;

    if (!name || !surname || !email || !password || !license) {
      alert('Per favore compila tutti i campi');
      return;
    }

    try {
      const response = await fetch(SIGNUP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      console.log('Risposta del server:', response);
      console.log('Dati di registrazione:', response.body);
      console.log(' status:', response.status);

      if (response.ok) {
        alert('Successo');
        setShowSignup(false);
      } else {
        alert('Qualcosa è andato storto');
      }
    } catch (error) {
      alert('Errore nella richiesta: ' + (error as Error).message);
    }
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  return (
        <div style={styles.container}>
        <img
          src={logoFrontendFull}
          alt="PDTrack Logo"
          style={styles.logo}
        />
        <h1 style={styles.title}>Login</h1>
        {!showSignup ? (
          <>
            <LoginForm onLogin={handleLogin} />
            <button style={styles.signupButton} onClick={() => setShowSignup(true)}>
              Registrati
            </button>
          </>
        ) : (
        <form onSubmit={handleSignupSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Nome"
            value={signupData.name}
            onChange={handleSignupChange}
            style={styles.input}
            required
          />
          <input
            type="text"
            name="surname"
            placeholder="Cognome"
            value={signupData.surname}
            onChange={handleSignupChange}
            style={styles.input}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={signupData.email}
            onChange={handleSignupChange}
            style={styles.input}
            required
          />
         
          <input
            type="text"
            name="license"
            placeholder="License"
            value={signupData.license}
            onChange={handleSignupChange}
            style={styles.input}
            required
          />
           <input
            type="password"
            name="password"
            placeholder="Password"
            value={signupData.password}
            onChange={handleSignupChange}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.signupButton}>
            Registrati
          </button>
          <button type="button" style={styles.cancelButton} onClick={() => setShowSignup(false)}>
            Annulla
          </button>
        </form>
      )}
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
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
 signupButton: {
  marginTop: '20px',
  backgroundColor: '#2c3e50', // stesso colore
  color: 'white',
  border: 'none',
  padding: '10px',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '100%',
  maxWidth: '300px', // uguale a LoginForm
  marginLeft: 'auto',
  marginRight: 'auto',
  display: 'block',
},
  cancelButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#bdc3c7',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginTop: '10px',
    cursor: 'pointer',
  },
  logo: {
  display: 'block',
  margin: '0 auto 20px',
  maxWidth: '200px',
  height: 'auto',
},
};

export default LoginPage;