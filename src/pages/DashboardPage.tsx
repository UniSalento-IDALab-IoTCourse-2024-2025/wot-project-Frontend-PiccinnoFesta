import React, { use, useEffect, useState } from 'react';
import PatientList from '../components/PatientList';
import Notifications from '../components/Notification';
import EditPatientForm from '../components/EditPatientForm';
import { Doctor, Patient } from '../types';
import { useNavigate } from 'react-router-dom';
import logoFrontend from '../assets/images/logoFrontend.png'; 
import { Info, RefreshCw } from 'lucide-react';

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

  const [hoveredLogout, setHoveredLogout] = useState(false);
  const [hoveredAdd, setHoveredAdd] = useState(false);
  

  const [isHoveringAdd, setIsHoveringAdd] = useState(false);

  /**
   * ----------------------------------------------------
   * SIDE EFFECTS
   * ----------------------------------------------------
   */
useEffect(() => {
  // Recupera il profilo del dottore dal localStorage
  const storedDoctor = localStorage.getItem('doctorProfile');
  if (storedDoctor) {
    setDoctor(JSON.parse(storedDoctor));
  }

  // Fetch dei pazienti dal backend
  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/users/patient/getAll', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nel recupero dei pazienti');
      }

      const data = await response.json();

      if (Array.isArray(data.patientList)) {
        console.log('Pazienti recuperati:', data.patientList);
        setPatients(data.patientList);
      } else {
        console.error('Formato non valido:', data);
      }
    } catch (error) {
      console.error('Errore durante il fetch dei pazienti:', error);
    }
  };

  fetchPatients();

  // Notifiche statiche
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
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/users/patient/insert', {
        method: 'POST',
        headers: { 

          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });

      if (!response.ok) {
        alert('Errore durante il salvataggio del paziente');
        throw new Error('Errore nel salvataggio');
      }

      const json = await response.json();
      console.log('Paziente salvato:', json);
      const savedPatient: Patient = json; // qui non va bene senza asserzione, perché json è any
      //const savedPatient: Patient = await response.json()
      console.log('Paziente parsato:', savedPatient);
      if(savedPatient){
      alert(
      `Paziente salvato con successo.\n` +
      `ID assegnato: ${savedPatient.id}\n\n` +
      `Notifica l'identificativo al tecnico per completare l'installazione di PDTrack.\n\n` +
      `Per visualizzare nuovamente quest'informazione, controlla il pannello per il monitoraggio dei dispositivi non installati.`
    );
      }

      setPatients((prev) => [...prev, savedPatient]);
      setShowForm(false);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
    }
  };
  //da passare come prop a PatientList
  const handleDeletePatient = (idToDelete: string) => {
  setPatients((prev) => prev.filter((p) => p.id !== idToDelete));
};  


  const handleLogout = () => {
  const conferma = window.confirm('Sei sicuro di voler effettuare il logout?');
  if (!conferma) return;

  localStorage.removeItem('authToken');
  localStorage.removeItem('doctorProfile');
  navigate('/');
};

const handleUpdatePatient = async (patient: Patient) => {
  const confirmUpdate = window.confirm(
    `Vuoi segnare il dispositivo come installato per ${patient.name} ${patient.surname}?`
  );
  if (!confirmUpdate) return;

  try {
    const token = localStorage.getItem('authToken');

    const updatedPatient = {
      ...patient,
      deviceInstalled: true,
    };

    const response = await fetch('/api/users/patient/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedPatient),
    });

    if (!response.ok) {
      throw new Error('Errore durante l’aggiornamento del paziente');
    }

    const updated = await response.json();
    alert(`Dispositivo installato per ${updated.name} ${updated.surname}`);

    setPatients((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  } catch (error) {
    console.error('Errore aggiornamento paziente:', error);
    alert('Errore durante l’aggiornamento');
  }
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
      <div style={styles.logo}>
        <img
          src={logoFrontend}
          alt="Logo PDTrack"
          style={{ height: 32, marginRight: 8, verticalAlign: 'middle' }}
        />
        Tremor Monitoring
      </div>
      <div style={styles.headerRight}>
        <span style={styles.username}>Dott. {doctor?.surname}</span>
        <button
          style={{
            ...styles.logout,
            ...(hoveredLogout && styles.logoutHover),
          }}
          onClick={handleLogout}
          onMouseEnter={() => setHoveredLogout(true)}
          onMouseLeave={() => setHoveredLogout(false)}
        >
          Logout
        </button>
      </div>
    </header>

      {/* Main */}
      <main style={styles.main}>
        {/* Left Pane */}
        <section style={styles.leftPane}>
          <h2 style={styles.sectionTitle}>Pazienti</h2>
          <div style={styles.patientListBox}>
            <PatientList patients={patients} onDelete={handleDeletePatient} />            </div>
          <div
            style={{
              ...styles.addCard,
              ...(isHoveringAdd ? styles.addCardHover : {}),
            }}
          >           <button
          style={{
            ...styles.addButton,
            ...(isHoveringAdd ? styles.addButtonHover : {}),
          }}
          onClick={() => setShowForm(true)}
          onMouseEnter={() => setIsHoveringAdd(true)}
          onMouseLeave={() => setIsHoveringAdd(false)}
        >
          ＋
        </button>
            <p style={styles.addText}>Aggiungi nuovo paziente</p>
          </div>
        </section>

        {/* Right Pane */}
        <section style={styles.rightPane}>
          <h2 style={styles.sectionTitle}>Dispositivi non installati</h2>
        <div style={styles.notificationsBox}>
          {patients
  .filter((p) => !p.deviceInstalled)
  .map((p) => (
    <div key={p.id} style={styles.uninstalledPatient}>
      <span style={styles.redDot}></span>
      {p.name} {p.surname}
      
      {/* Icone info e update */}
     <div style={styles.iconWrapper}>
        <button
          style={styles.iconButton}
          onClick={() => alert(`ID paziente: ${p.id}`)}
          title="Visualizza ID paziente"
        >
          <Info size={18} color="#4b5563" />
        </button>
        <button
          style={styles.iconButton}
          onClick={() => handleUpdatePatient(p)}
          title="Imposta dispositivo come installato"
        >
          <RefreshCw size={18} color="#4b5563" />
        </button>
      </div>
          </div>
        ))}
        </div>
          
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
  fontSize: '22px',
  fontWeight: 800,
  color: primaryColor,
  letterSpacing: '0.6px',
  textTransform: 'uppercase',
  fontFamily: `'Inter', 'Segoe UI', sans-serif`,
  textShadow: '1px 1px 0 rgba(0, 0, 0, 0.02)',
  cursor: 'default',
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
  color: '#4b5563', // tonalità soft-gray
  backgroundColor: '#f3f4f6',
  padding: '4px 10px',
  borderRadius: '8px',
  fontSize: '0.9rem',
  letterSpacing: '0.3px',
  boxShadow: 'inset 0 0 0.5px rgba(0,0,0,0.06)',
},
  logout: {
  backgroundColor: dangerColor,
  color: white,
  border: 'none',
  borderRadius: '8px',
  padding: '8px 20px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)', // ombra rossa soft
  transition: 'transform 0.1s ease, box-shadow 0.2s ease',
  letterSpacing: '0.5px',
},
logoutHover: {
  backgroundColor: '#dc2626', // rosso più scuro per l’hover
  transform: 'scale(1.04)',
  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
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
  addCardHover: {
  backgroundColor: '#eef2ff',
  transform: 'scale(1.015)',
  boxShadow: '0 6px 14px rgba(79, 70, 229, 0.1)',
  transition: 'all 0.2s ease-in-out',
},
  addButtonHover: {
  transform: 'scale(1.08)',
  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)', // primaryColor glow
  backgroundColor: '#4338ca', // colore leggermente più scuro per feedback
},
  addText: {
    fontSize: '15px',
    color: primaryColor,
    fontWeight: 600,
  },
 patientListBox: {
  height: '200px',
  overflowY: 'auto',
  backgroundColor: white,
  borderRadius: '16px',
  boxShadow: '0 6px 12px rgba(0,0,0,0.08)',  
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  border: `1px solid #e5e7eb`,                
  scrollBehavior: 'smooth',
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
  uninstalledPatient: {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px',
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  fontWeight: 500,
  color: '#991b1b',
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
},

redDot: {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: '#dc2626',
  flexShrink: 0,
},
iconWrapper: {
  marginLeft: 'auto',
  display: 'flex',
  gap: '8px',
},

iconButton: {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '6px',
  transition: 'background-color 0.2s ease',
},
iconInfoButton: {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '6px',
  color: '#2563eb', // blu info
  transition: 'background-color 0.2s ease',
},

iconRefreshButton: {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '6px',
  color: '#10b981', // verde update
  transition: 'background-color 0.2s ease',
},
iconButtonHover: {
  backgroundColor: '#f3f4f6',
},
};
export default DashboardPage;
