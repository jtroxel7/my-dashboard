export interface StravaWeeklyMileage {
  week: string;          // ISO date of Monday
  miles: number;
}

export interface StravaData {
  weeklyMileage: StravaWeeklyMileage[];  // 12 weeks
  totalMiles: number;
}
