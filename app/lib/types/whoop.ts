export interface WhoopData {
  recovery: number;       // 0-100
  sleep: number;          // 0-100
  hrv: number;           // milliseconds
  restingHeartRate: number; // bpm
  steps: number;
  strain: number;        // 0-21
}
