import React, { useEffect, useState } from 'react';
import PatientList from '../components/PatientList';
import Notifications from '../components/Notification';

interface Patient {
  id: number;
  name: string;
  status: 'ok' | 'warning' | 'critical';
}

interface Notification {
  id: number;
  message: string;
  timestamp: string;
}

const DashboardPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setPatients([
      { id: 1, name: 'Mario Rossi', status: 'critical' },
      { id: 2, name: 'Luisa Bianchi', status: 'warning' },
      { id: 3, name: 'Giorgio Verdi', status: 'ok' },
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

  return (
    <div style={styles.wrapper}>
      {/* Top Bar */}
      <header style={styles.topBar}>
        <div style={styles.logo}>🧠 NeuroMonitor</div>
        <div style={styles.headerRight}>
          <span style={styles.bell}>🔔</span>
          <span style={styles.username}>Dott.ssa Riva</span>
          <button style={styles.logout}>Logout</button>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <section style={styles.leftPane}>
          <h2 style={styles.sectionTitle}>Pazienti</h2>
          <PatientList patients={patients} />
          <div style={styles.addCard}>
            <button style={styles.addButton}>＋</button>
            <p style={styles.addText}>Aggiungi nuovo paziente</p>
          </div>
        </section>

        <section style={styles.rightPane}>
          <h2 style={styles.sectionTitle}>Notifiche</h2>
          <div style={styles.notificationsBox}>
            {notifications.map((n) => (
              <div key={n.id} style={styles.notificationItem}>
                <strong>• {n.message.split(' ')[0]}</strong>
                <p>{n.message}</p>
                <small style={styles.timestamp}>{n.timestamp}</small>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    fontFamily: `'Segoe UI', sans-serif`,
    backgroundColor: '#f4f6f8',
    minHeight: '100vh',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  bell: {
    fontSize: '20px',
    cursor: 'pointer',
  },
  username: {
    fontWeight: 500,
    color: '#2c3e50',
  },
  logout: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
  },
  main: {
    display: 'flex',
    flexDirection: 'row',
    gap: '40px',
    padding: '40px',
  },
  leftPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightPane: {
    flex: 1,
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  addCard: {
    border: '2px dashed #27ae60',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#f9fdf9',
    textAlign: 'center',
  },
   addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: 'white',
    backgroundColor: '#27ae60',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: '0.2s ease',
    lineHeight: '1', // evita vertical misalignment
  },
  addText: {
    fontSize: '14px',
    color: '#27ae60',
    fontWeight: 500,
  },
  notificationsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  notificationItem: {
    padding: '12px',
    backgroundColor: '#fefefe',
    borderLeft: '4px solid #e67e22',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  timestamp: {
    color: '#888',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
  },
};

export default DashboardPage;