// src/pages/PatientPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TremorDashboard from '../components/TremorDashboard';
import PatientCard from '../components/PatientCard';
import EditPatientForm from '../components/EditPatientForm';
import { Patient } from '../types';

import { useLocation } from 'react-router-dom';

const PatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showPrompt, setShowPrompt] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const incomingPatient = (location.state as { patient?: Patient })?.patient;

const [awaitingUserChoice, setAwaitingUserChoice] = useState(true);


const [hoveringAccept, setHoveringAccept] = useState(false);
const [hoveringDecline, setHoveringDecline] = useState(false);


  useEffect(() => {
    console.log('Incoming patient from state:', incomingPatient);
  if (incomingPatient && !patient) {
    setPatient(incomingPatient);
  }
}, [incomingPatient, patient]);


const handleUserAcceptInference = async () => {
  setAwaitingUserChoice(false);
  await handleLoadData();
};

const handleUserDeclineInference = () => {
  setAwaitingUserChoice(false);
  setShowPrompt(false);
};

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

  const handleSave = async (updated: Patient) => {
  setPatient(updated);
  setIsEditing(false);

  try {
    console.log('Salvataggio del paziente:', updated);
    const token = localStorage.getItem('authToken');
    console.log('Token:', token);
    const response = await fetch('/api/users/patients/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updated),
    });

    if (!response.ok) {
      throw new Error('Errore durante il salvataggio del paziente');
    }

    console.log('Paziente aggiornato con successo');
  } catch (error) {
    console.error('Errore nella PUT /api/log/editOpen:', error);
    alert('⚠️ Errore durante il salvataggio del paziente');
  }
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

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  return () => {
    document.head.removeChild(style);
  };
}, []);

if (awaitingUserChoice) {
  return (
    <div style={styles.fullscreenOverlay}>
  <div style={styles.confirmBox}>
    <h2 style={styles.confirmTitle}>Vuoi recuperare i dati più recenti?</h2>
    <p style={styles.confirmSubtitle}>
      Questa operazione potrebbe richiedere qualche istante.
    </p>
    <div style={styles.buttonRow}>
          <button
        style={{
          ...styles.primaryButton,
          ...(hoveringAccept ? styles.primaryButtonHover : {}),
        }}
        onMouseEnter={() => setHoveringAccept(true)}
        onMouseLeave={() => setHoveringAccept(false)}
        onClick={handleUserAcceptInference}
      >
        Sì, procedi
      </button>

      <button
        style={{
          ...styles.secondaryButton,
          ...(hoveringDecline ? styles.secondaryButtonHover : {}),
        }}
        onMouseEnter={() => setHoveringDecline(true)}
        onMouseLeave={() => setHoveringDecline(false)}
        onClick={handleUserDeclineInference}
      >
        No, continua
      </button>
    </div>
  </div>
</div>
  );
}

if (isLoading) {
  return (
    <div style={styles.fullscreenOverlay}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '18px', marginBottom: '1.5rem', color: '#374151' }}>
          Caricamento in corso...
        </p>
        <BarLoader />
      </div>
    </div>
  );
}

  if (!patient && !showPrompt) {
  return <div style={styles.loading}>Nessun dato paziente disponibile.</div>;
  }
  
  if(!patient){
    return (
      <div style={styles.promptContainer}>
        <div style={styles.promptBox}>
          <h2>Impossibile caricare i dati del paziente</h2>
        </div>
      </div>
    );
  }
  return (
    <div style={styles.pageContainer}>
      <div style={styles.leftPane}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>Dettaglio Paziente: {patient.name} {patient.surname}</h1>
        </div>
        <TremorDashboard patientId ={patient.id}/>
        <PatientCard patient={patient} />
        <button style={styles.editButton} onClick={()=> setIsEditing(true)}>
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
  justifyContent: 'center',
  gap: '1rem',
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
  fullscreenOverlay: {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
},
primaryButton: {
  padding: '10px 20px',
  backgroundColor: '#4f46e5',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.95rem',
  marginRight: '1rem',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  transition: 'background-color 0.2s ease',
},

secondaryButton: {
  padding: '10px 20px',
  backgroundColor: '#e5e7eb',
  color: '#1f2937',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '0.95rem',
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  transition: 'background-color 0.2s ease',
},
confirmBox: {
  backgroundColor: '#ffffff',
  padding: '2.5rem',
  borderRadius: '1rem',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  maxWidth: '460px',
  width: '90%',
  textAlign: 'center',
  animation: 'fadeIn 0.3s ease-in-out',
},

confirmTitle: {
  fontSize: '1.5rem',
  fontWeight: 700,
  marginBottom: '1rem',
  color: '#111827',
},

confirmSubtitle: {
  fontSize: '0.95rem',
  color: '#4b5563',
  marginBottom: '1.5rem',
  lineHeight: 1.5,
},
primaryButtonHover: {
  backgroundColor: '#4338ca', // tonalità più scura
  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
},

secondaryButtonHover: {
  backgroundColor: '#d1d5db', // grigio leggermente più scuro
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
},


};

export default PatientPage;