export interface Vitals {
  heartRate: number;
  bloodOxygen: number;
  tremorFrequency: number;
  gaitSpeed: number;
  sleepDuration: number;
}



export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  timestamp: string;
  read: boolean;

}
export type Sesso = 'M' | 'F' | 'Altro';
export interface Patient {
  id: string;
  name: string;
  età: number;
  sesso: Sesso;
  peso: number;       // in kg
  altezza: number;    // in cm
  tratti_caratteristici: string[];
  diagnosi: string;
}
export interface Doctor{
  id:string,
  name:string,
  surname:string,
  email:string,
  password:string,
  license:string,
  patient: Patient[];
}