import { DayCapacity } from './DayCapacity';

/**
 * ScheduleException represents an override in availability for a person 
 * on a specific date. It overrides the default weekly schedule.
 */
export interface ScheduleException {
  /**
   * The specific date for which this exception applies.
   * Format is ISO date string (YYYY-MM-DD).
   */
  date: string;

  /**
   * The availability for this specific date, overriding the default
   * from the weekly schedule.
   */
  availability: DayCapacity;
}