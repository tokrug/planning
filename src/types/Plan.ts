import { PlannedTask } from './PlannedTask';

/**
 * Plan represents the result of planning based on the planning input and teams/people capacity.
 * The plan contains the list of all tasks placed on a timeline.
 */
export interface Plan {
  /**
   * The ordered list of planned tasks on a timeline
   */
  timeline: PlannedTask[];
} 