import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TremorDashboard from '../components/TremorDashboard'; // <-- ✅ Usa il nuovo componente

interface Patient {
  id: string | undefined;
  name: string;
}

const PatientPage: React.FC = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showPrompt, setShowPrompt] = useState(true);

  useEffect(() => {
    if (!showPrompt) {
      setPatient({ id, name: 'Mario Rossi' });
    }
  }, [id, showPrompt]);

  if (showPrompt) {
    return (
      <div style={styles.promptContainer}>
        <div style={styles.promptBox}>
          <h2>Vuoi caricare gli ultimi dati sul tremore del paziente?</h2>
          <div style={styles.buttonRow}>
            <button onClick={() => setShowPrompt(false)} style={styles.button}>No</button>
            <button
              onClick={() => {
                setShowPrompt(false);
                setPatient({ id, name: 'Mario Rossi' });
              }}
              style={{ ...styles.button, backgroundColor: '#27ae60' }}
            >
              Sì
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return <div style={styles.loading}>Caricamento dati...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dettaglio Paziente: {patient.name}</h1>
      
      {/* 🔁 Sostituzione qui */}
      <TremorDashboard  />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '30px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  title: {
    marginBottom: '25px',
    color: '#2c3e50',
  },
  loading: {
    textAlign: 'center',
    marginTop: '100px',
    fontSize: '18px',
  },
  promptContainer: {
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
  },
  promptBox: {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  buttonRow: {
    marginTop: '20px',
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default PatientPage;