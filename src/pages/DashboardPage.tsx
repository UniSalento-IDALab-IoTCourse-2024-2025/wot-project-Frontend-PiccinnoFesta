import React, { useEffect, useState } from 'react';
import PatientList from '../components/PatientList';
import Notifications from '../components/Notification';
import EditPatientForm from '../components/EditPatientForm';
import { Doctor, Patient } from '../types';
import { useNavigate } from 'react-router-dom';


interface Notification {
  id: number;
  message: string;
  timestamp: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  /**
   * ----------------------------------------------------
   * SIDE EFFECTS
   * ----------------------------------------------------
   */
  useEffect(() => {

    //prendo il profilo del dottore dal localStorage
    setDoctor(
      localStorage.getItem('doctorProfile')
        ? JSON.parse(localStorage.getItem('doctorProfile')!)
        : null
    );    
    console.log('Dottore:', doctor);

    setPatients([
      {
        id: '1',
        name: 'Mario Rossi',
        età: 30,
        sesso: 'M',
        peso: 70,
        altezza: 175,
        tratti_caratteristici: ['Capelli castani', 'Occhi verdi'],
        diagnosi: 'Nessuna',
      },
      {
        id: '2',
        name: 'Luisa Bianchi',
        età: 25,
        sesso: 'F',
        peso: 60,
        altezza: 165,
        tratti_caratteristici: ['Capelli biondi'],
        diagnosi: 'Ipertensione',
      },
      {
        id: '3',
        name: 'Giorgio Verdi',
        età: 45,
        sesso: 'M',
        peso: 80,
        altezza: 180,
        tratti_caratteristici: ['Barba folta'],
        diagnosi: 'Diabete',
      },
    ]);

    setNotifications([
      {
        id: 1,
        message: 'Frequenza cardiaca elevata (115 bpm) rilevata.',
        timestamp: '17/06/2024, 12:31:00',
      },
      {
        id: 2,
        message: 'Variazione significativa nella velocità di andatura.',
        timestamp: '17/06/2024, 13:06:00',
      },
      {
        id: 3,
        message: 'Frequenza dei tremori superiore alla soglia.',
        timestamp: '17/06/2024, 10:15:00',
      },
    ]);
  }, []);

  /**
   * ----------------------------------------------------
   * HANDLERS
   * ----------------------------------------------------
   */
  const handleAddPatient = async (newPatient: Omit<Patient, 'id'>) => {
    try {
      console.log('Salvataggio paziente:', newPatient);
      const response = await fetch('YOUR_API_ENDPOINT_HERE', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });
      console.log('Risposta del server:', response);
      if (!response.ok) {
        alert('Errore durante il salvataggio del paziente');
        throw new Error('Errore nel salvataggio');
      } else {
        alert('Paziente salvato con successo, ricaricare la pagina per visualizzare il nuovo paziente');
      }

      const savedPatient: Patient = await response.json();
      setPatients((prev) => [...prev, savedPatient]);
      setShowForm(false);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
    }
  };


  const handleLogout = () => {
  const conferma = window.confirm('Sei sicuro di voler effettuare il logout?');
  if (!conferma) return;

  localStorage.removeItem('authToken');
  localStorage.removeItem('doctorProfile');
  navigate('/');
};


  /**
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */
  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <header style={styles.topBar}>
        <div style={styles.logo}>PDMonitor</div>
        <div style={styles.headerRight}>
          <span style={styles.username}>Dott. {doctor?.surname}</span>
          <button style={styles.logout} onClick={handleLogout}>Logout</button>          </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        {/* Left Pane */}
        <section style={styles.leftPane}>
          <h2 style={styles.sectionTitle}>Pazienti</h2>
          <div style={styles.patientListBox}>
            <PatientList patients={patients} />
          </div>
          <div style={styles.addCard}>
            <button style={styles.addButton} onClick={() => setShowForm(true)}>
              ＋
            </button>
            <p style={styles.addText}>Aggiungi nuovo paziente</p>
          </div>
        </section>

        {/* Right Pane */}
        <section style={styles.rightPane}>
          <h2 style={styles.sectionTitle}>Blocco destro</h2>
          
        </section>
      </main>

      {/* Modal Overlay */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Nuovo Paziente</h3>
            <EditPatientForm onSave={handleAddPatient} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ----------------------------------------------------
 * STYLES
 * ----------------------------------------------------
 */

const primaryColor = '#4f46e5';
const lightPrimary = '#eef2ff';
const darkPrimary = '#3730a3';
const accentColor = '#a78bfa';
const lightAccent = '#ede9fe';
const dangerColor = '#ef4444';
const textDark = '#1f2937';
const textMuted = '#6b7280';
const white = '#ffffff';

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    fontFamily: `'Inter', 'Segoe UI', sans-serif`,
    backgroundColor: lightPrimary,
    minHeight: '100vh',
    color: textDark,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    background: white,
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: '20px',
    fontWeight: 700,
    color: primaryColor,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  bell: {
    fontSize: '22px',
    cursor: 'pointer',
    color: accentColor,
  },
  username: {
    fontWeight: 500,
    color: textMuted,
  },
  logout: {
    backgroundColor: dangerColor,
    color: white,
    border: 'none',
    borderRadius: '8px',
    padding: '6px 16px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'transform 0.1s ease',
  },
  main: {
    display: 'flex',
    flexDirection: 'row',
    gap: '40px',
    padding: '40px',
    flexWrap: 'wrap',
  },
  leftPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightPane: {
    flex: 1,
    backgroundColor: white,
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    maxHeight: '650px',
    overflowY: 'auto',
    borderLeft: `6px solid ${accentColor}`,
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: darkPrimary,
    marginBottom: '8px',
  },
  addCard: {
    border: `2px dashed ${accentColor}`,
    borderRadius: '16px',
    padding: '20px',
    backgroundColor: lightAccent,
    textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: white,
    backgroundColor: primaryColor,
    border: 'none',
    borderRadius: '50%',
    width: '64px',
    height: '64px',
    margin: '0 auto 12px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  addText: {
    fontSize: '15px',
    color: primaryColor,
    fontWeight: 600,
  },
  patientListBox: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '520px',
    paddingRight: '6px',
  },
  notificationsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  notificationItem: {
    padding: '14px 16px',
    backgroundColor: white,
    borderLeft: `4px solid ${primaryColor}`,
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
  },
  timestamp: {
    color: textMuted,
    fontSize: '12px',
    marginTop: '6px',
    display: 'block',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: white,
    padding: '32px 28px',
    borderRadius: '18px',
    minWidth: '320px',
    maxWidth: '420px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    borderTop: `6px solid ${primaryColor}`,
  },
  modalTitle: {
    marginBottom: '16px',
    fontSize: '18px',
    fontWeight: 600,
    color: darkPrimary,
  },
};
export default DashboardPage;
