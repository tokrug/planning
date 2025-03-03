import { WeeklySchedule } from './WeeklySchedule';
import { ScheduleException } from './ScheduleException';

/**
 * Person represents a team member.
 * It includes their weekly schedule and any exceptions to that schedule.
 */
export interface Person {
  /**
   * Unique identifier for the person.
   * UUID format.
   */
  id: string;

  /**
   * The person's name.
   */
  name: string;

  /**
   * List of skills the person possesses.
   */
  skills: string[];

  /**
   * The regular weekly schedule for this person.
   * Defines their typical working pattern.
   */
  weeklySchedule: WeeklySchedule;

  /**
   * List of exceptions to the regular schedule.
   * Used for vacation days, sick leaves, etc.
   */
  scheduleExceptions: ScheduleException[];
}