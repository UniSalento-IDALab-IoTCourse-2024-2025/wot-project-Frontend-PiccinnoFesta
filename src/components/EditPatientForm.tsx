import React, { FC, useState, ChangeEvent, FormEvent } from 'react';
import { Patient } from '../types';

// Definiamo le props che il form riceverà
interface EditPatientFormProps {
  patient: Patient;
  onSave: (updated: Patient) => void;
  onCancel: () => void;
}

const EditPatientForm: FC<EditPatientFormProps> = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Patient>({ ...patient });
  const [trattiInput, setTrattiInput] = useState(formData.tratti_caratteristici.join(', '));

const handleChange = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  if (name === 'tratti_caratteristici') {
    setTrattiInput(value); // aggiorna la stringa raw
    return;
  }

  setFormData(prev => ({
    ...prev,
    [name]:
      name === 'età' || name === 'peso' || name === 'altezza'
        ? Number(value)
        : (value as any),
  }));
};
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  onSave({
    ...formData,
    tratti_caratteristici: trattiInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  });
};

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <label style={styles.label}>
        Nome:
        <input
          type="text"
          name="name"
          value={(formData as any).name}
          onChange={handleChange}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        Età:
        <input
          type="number"
          name="età"
          value={formData.età}
          onChange={handleChange}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        Sesso:
        <select
          name="sesso"
          value={formData.sesso}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="M">M</option>
          <option value="F">F</option>
          <option value="Altro">Altro</option>
        </select>
      </label>

      <label style={styles.label}>
        Peso (kg):
        <input
          type="number"
          name="peso"
          value={formData.peso}
          onChange={handleChange}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        Altezza (cm):
        <input
          type="number"
          name="altezza"
          value={formData.altezza}
          onChange={handleChange}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        Tratti (separati da virgola):
       <textarea
  name="tratti_caratteristici"
  value={trattiInput}
  onChange={handleChange}
  style={{ ...styles.input, height: '4rem' }}
/>
      </label>

      <label style={styles.label}>
        Diagnosi:
        <textarea
          name="diagnosi"
          value={formData.diagnosi}
          onChange={handleChange}
          style={{ ...styles.input, height: '3rem' }}
        />
      </label>

      <div style={styles.buttonRow}>
        <button type="submit"   style={{ ...styles.buttonBase, ...styles.primaryButton }}>
          Salva
        </button>
        <button type="button" onClick={onCancel}   style={{ ...styles.buttonBase, ...styles.secondaryButton }}
>
          Annulla
        </button>
      </div>
    </form>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
  },
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  // Stile base per i button nel form
  buttonBase: {
    flex: 1,
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
};


export default EditPatientForm;
