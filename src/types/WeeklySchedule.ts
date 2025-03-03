import { DayCapacity } from './DayCapacity';

/**
 * WeeklySchedule represents the default availability for a person through the week.
 * It defines the standard working pattern that repeats week after week.
 */
export interface WeeklySchedule {
  /**
   * Monday's availability
   */
  monday: DayCapacity;

  /**
   * Tuesday's availability
   */
  tuesday: DayCapacity;

  /**
   * Wednesday's availability
   */
  wednesday: DayCapacity;

  /**
   * Thursday's availability
   */
  thursday: DayCapacity;

  /**
   * Friday's availability
   */
  friday: DayCapacity;

  /**
   * Saturday's availability
   */
  saturday: DayCapacity;

  /**
   * Sunday's availability
   */
  sunday: DayCapacity;
}