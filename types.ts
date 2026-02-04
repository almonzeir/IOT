
export interface SensorData {
  temperature: number;
  vibration: number;
  alert: number;
  timestamp: string;
}

export interface DeviceStatus {
  online: boolean;
  lastSeen: string;
  uptime: string;
  ipAddress: string;
  signalStrength: number;
}

export enum AlertLevel {
  NONE = 'none',
  WARNING = 'warning',
  CRITICAL = 'critical'
}
