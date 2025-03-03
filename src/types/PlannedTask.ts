import { Task } from './Task';

/**
 * Result of plan calculation. Task placed on the timeline with information 
 * on which days how many mandays will be spent on it.
 */
export interface DailyEffort {
  /**
   * Date in ISO format (YYYY-MM-DD)
   */
  date: string;
  
  /**
   * Effort in mandays
   */
  effort: number;
}

/**
 * Represents a task that has been placed on a timeline with daily effort allocations
 */
export interface PlannedTask {
  /**
   * The task being planned
   */
  task: Task;
  
  /**
   * Array of daily effort allocations for this task
   */
  dailyEfforts: DailyEffort[];
} 