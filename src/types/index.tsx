export interface Vitals {
  heartRate: number;
  bloodOxygen: number;
  tremorFrequency: number;
  gaitSpeed: number;
  sleepDuration: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  status: 'Stabile' | 'Attenzione' | 'Critico';
  lastUpdate: string;
  vitals: Vitals;
  notes: string;
}

export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  timestamp: string;
  read: boolean;
}