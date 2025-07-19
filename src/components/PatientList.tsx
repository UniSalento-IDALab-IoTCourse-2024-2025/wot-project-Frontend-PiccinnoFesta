import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types';
import { Trash2 } from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  onDelete: (id: string) => void;

}

const PatientList: React.FC<PatientListProps> = ({ patients , onDelete}) => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleDelete = async (patientId: string) => {
    const confirm = window.confirm('Sei sicuro di voler eliminare questo paziente?');
    if (!confirm) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/patient/delete/${patientId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore durante la cancellazione');
      }

      alert('Paziente eliminato con successo.');
      onDelete(patientId);
    } catch (error) {
      console.error(error);
      alert('Si è verificato un errore durante l\'eliminazione.');
    }
  };

  return (
    <div>
      {patients.map((p) => (
        <div
          key={p.id}
          style={{
            ...styles.listItem,
            backgroundColor: hoveredId === p.id ? '#eef2ff' : styles.listItem.backgroundColor,
            boxShadow: hoveredId === p.id ? '0 4px 12px rgba(0,0,0,0.08)' : styles.listItem.boxShadow,
            transform: hoveredId === p.id ? 'scale(1.045)' : 'scale(1)',
          }}
          onMouseEnter={() => setHoveredId(p.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <span
            style={styles.name}
            onClick={() => navigate(`/patient/${p.id}`, { state: { patient: p } })}
          >
            {p.name} {p.surname}
          </span>

          <button
            style={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation(); // evita che venga eseguito anche il navigate
              handleDelete(p.id);
            }}
            title="Elimina paziente"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    marginBottom: '10px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  name: {
    fontSize: '17px',
    fontWeight: 500,
    color: '#1f2937',
    letterSpacing: '0.3px',
    flex: 1,
  },
  deleteButton: {
    background: 'transparent',
    border: '1.6px solid #ef4444',
    borderRadius: '50%',
    padding: '6px',
    cursor: 'pointer',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    width: '32px',
    height: '32px',
  },
};

export default PatientList;