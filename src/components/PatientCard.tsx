import React, { FC, CSSProperties } from 'react';
import { User } from 'lucide-react';
import { Patient } from '../types';


interface PatientCardProps {
  patient: Patient;
}

const styles: Record<string, CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '1000px',              // leggermente più largo
    margin: '1rem auto', 
    marginLeft: 'auto',
    background: '#f0f8ff33', // molto chiaro
    border: '1px solid #dbeafe',
    borderRadius: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(6px)',
    overflow: 'hidden',

  },
  header: {
    background: 'linear-gradient(to right, #bfdbfe, #c7d2fe)', // toni molto soft
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    color: '#1e3a8a',
    fontSize: '1.5rem',
    fontWeight: 600,
    marginLeft: '1rem',
  },
  body: {
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '1rem',
  },
  label: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: '#475569',
    marginBottom: '0.25rem',
  },
  value: {
    fontSize: '1.125rem',
    fontWeight: 500,
    color: '#1f2937',
  },
  traitsLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: '#475569',
    marginBottom: '0.5rem',
  },
  traitsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  trait: {
    fontSize: '0.75rem',
    background: 'rgba(229, 231, 235, 0.5)',
    color: '#334155',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    backdropFilter: 'blur(4px)',
  },
  diagnosisLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: '#475569',
    marginBottom: '0.5rem',
  },
  diagnosis: {
    fontSize: '0.875rem',
    color: '#1f2937',
  },
};

const PatientCard: FC<PatientCardProps> = ({ patient }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <User size={32} color="#1e3a8a" />
        <h2 style={styles.title}>Scheda Paziente</h2>
      </div>

      <div style={styles.body}>
        <div style={styles.grid}>
          <div>
            <p style={styles.label}>Età</p>
            <p style={styles.value}>{patient.age} anni</p>
          </div>
          <div>
            <p style={styles.label}>Sesso</p>
            <p style={styles.value}>{patient.gender}</p>
          </div>
          <div>
            <p style={styles.label}>Peso</p>
            <p style={styles.value}>{patient.weight} kg</p>
          </div>
          <div>
            <p style={styles.label}>Altezza</p>
            <p style={styles.value}>{patient.height} cm</p>
          </div>
        </div>

        <div>
          <p style={styles.traitsLabel}>Tratti caratteristici</p>
          <div style={styles.traitsContainer}>
            {patient.traits.map((trait, i) => (
              <span key={i} style={styles.trait}>
                {trait}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p style={styles.diagnosisLabel}>Diagnosi</p>
          <p style={styles.diagnosis}>{patient.diagnosis}</p>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;