/**
 * Task represents a unit of work to be completed.
 * Tasks can have subtasks and dependencies (blockedBy).
 */
export interface Task {
  /**
   * Unique identifier for the task.
   * UUID format.
   */
  id: string;

  /**
   * The title of the task.
   */
  title: string;

  /**
   * Detailed description of the task.
   */
  description: string;

  /**
   * Estimated effort required to complete the task, in man-days.
   * Must be a non-negative number.
   */
  estimate: number;

  /**
   * List of subtasks that are part of this task.
   * Optional, defaults to an empty array.
   */
  subtasks?: Task[];

  /**
   * List of tasks that must be completed before this task can be started.
   * Optional, defaults to an empty array.
   */
  blockedBy?: Task[];
}