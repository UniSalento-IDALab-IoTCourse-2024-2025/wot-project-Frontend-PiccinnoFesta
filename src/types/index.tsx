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
export type Sesso = 'MALE' | 'FEMALE' | 'OTHER';
export interface Patient {
  id: string;
  name: string;
  surname: string;
  age: number;
  gender: Sesso;
  weight: number;       // in kg
  height: number;    // in cm
  traits: string[];
  diagnosis: string;
}
export interface Doctor{
  id:string,
  name:string,
  surname:string,
  email:string,
  password:string,
  license:string,
  patientIds: string[];
}