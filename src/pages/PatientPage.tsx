// src/pages/PatientPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TremorDashboard from '../components/TremorDashboard';
import PatientCard from '../components/PatientCard';
import EditPatientForm from '../components/EditPatientForm';
import { Patient } from '../types';

const PatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showPrompt, setShowPrompt] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!showPrompt && !isLoading && id && !patient) {
      const fetched: Patient = {
        id,
        name: 'Mario Rossi',
        età: 30,
        sesso: 'M',
        peso: 70,
        altezza: 175,
        tratti_caratteristici: ['Capelli castani', 'Occhi verdi'],
        diagnosi: 'Nessuna',
      };
      setPatient(fetched);
    }
  }, [id, showPrompt, isLoading, patient]);

  const handleLoadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/inference/makeInference', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei dati');
      }
      setShowPrompt(false);
    } catch (error) {
      setShowPrompt(false);
      alert(error + ' Procedo con i dati disponibili.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (updated: Patient) => {
    setPatient(updated);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // BarLoader component
  const BarLoader: React.FC = () => (
    <div style={styles.barLoaderContainer}>
      <div style={styles.barLoader}></div>
    </div>
  );

  // Inject keyframes for bar loading animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bar-loading {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <BarLoader />
      </div>
    );
  }

  if (showPrompt) {
    return (
      <div style={styles.promptContainer}>
        <div style={styles.promptBox}>
          <h2>Vuoi caricare gli ultimi dati sul tremore del paziente?</h2>
          <div style={styles.buttonRow}>
            <button onClick={() => setShowPrompt(false)} style={styles.button}>
              No
            </button>
            <button
              onClick={handleLoadData}
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
    <div style={styles.pageContainer}>
      <div style={styles.leftPane}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>Dettaglio Paziente: {patient.name}</h1>
        </div>
        <TremorDashboard />
        <PatientCard patient={patient} />
        <button style={styles.editButton} onClick={() => setIsEditing(true)}>
          Modifica Paziente
        </button>
      </div>

      {isEditing && (
        <div style={styles.overlay} onClick={handleCancel}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <EditPatientForm
              patient={patient}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    display: 'flex',
    gap: '2rem',
    padding: '2rem',
    background: '#fff',
    minHeight: '100vh',
    position: 'relative',
  },
  leftPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
  },
  editButton: {
    alignSelf: 'center',
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    backgroundColor: '#4f46e5',
    color: '#fff',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  promptBox: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    backgroundColor: '#4f46e5',
    color: '#fff',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    width: '90%',
    maxWidth: '500px',
  },
  barLoaderContainer: {
    width: '200px',
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barLoader: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4f46e5',
    animation: 'bar-loading 1s linear infinite',
    transform: 'translateX(-100%)',
  },
};

export default PatientPage;