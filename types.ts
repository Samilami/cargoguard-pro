
export enum AppStep {
  DASHBOARD = 'DASHBOARD',
  VIEW_REPORT = 'VIEW_REPORT',
  SCAN_DOCUMENT = 'SCAN_DOCUMENT',
  DAMAGE_LOG = 'DAMAGE_LOG',
  DRIVER_SIGNATURE = 'DRIVER_SIGNATURE',
  SUMMARY = 'SUMMARY'
}

export interface DocumentData {
  deliveryNumber: string;
  date: string;
  sender: string;
  recipient: string;
  rawText: string;
  imageUrl: string;
}

export interface DamageRecord {
  id: string;
  imageUrls: string[]; // Multiple images per damage
  description: string;
  severity: 'Gering' | 'Mittel' | 'Schwer';
  categories: string[]; // Changed to array for multiple selections
  timestamp: number;
}

export interface DriverData {
  name: string;
  licensePlate: string;
  signatureDataUrl: string;
  company: string;
  underReserve: boolean;
}

export interface InspectionReport {
  id: string;
  createdAt: number;
  employeeName: string; // Neuer Feld für Mitarbeiter
  document: DocumentData | null;
  damages: DamageRecord[];
  driver: DriverData | null;
  status: 'draft' | 'submitted';
}
