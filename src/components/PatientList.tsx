import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types';

interface PatientListProps {
  patients: Patient[];
}

const PatientList: React.FC<PatientListProps> = ({ patients }) => {
  const navigate = useNavigate();

  return (
    <div>
      {patients.map((p) => (
        <div
          key={p.id}
          onClick={() => navigate(`/patient/${p.id}`)}
          style={{
            ...styles.listItem,
            cursor: 'pointer',
          }}
        >
          <span style={styles.name}>{p.name}</span>
          <span
            style={{
              ...styles.status,
              color:'red'
               
            }}
          >
          </span>
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
    padding: '12px',
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s ease',
  },
  name: {
    fontSize: '16px',
  },
  status: {
    fontSize: '16px',
  },
};

export default PatientList;