export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  images: string[];   // data URLs
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  duration: number;   // minutes
  comments: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  images: string[];   // data URLs
  createdAt: string;
}

export interface AppointmentWithClient extends Appointment {
  client: Client | null;
}

export interface AppointmentDateFilter {
  date?: string;   // exact match (YYYY-MM-DD)
  from?: string;   // inclusive range start (YYYY-MM-DD)
  to?: string;     // inclusive range end (YYYY-MM-DD)
}

export interface DB {
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  createClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client>;
  updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client | null>;
  deleteClient(id: string): Promise<boolean>;

  getAppointments(filter?: AppointmentDateFilter): Promise<AppointmentWithClient[]>;
  getAppointmentsByClient(clientId: string): Promise<Appointment[]>;
  countAppointmentsByClient(clientId: string): Promise<number>;
  createAppointment(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment>;
  updateAppointment(id: string, data: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<Appointment | null>;
  deleteAppointment(id: string): Promise<boolean>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}
