import { Task } from './Task';
import { Team } from './Team';

/**
 * Represents all information required to calculate the final plan.
 * Contains backlog which is the ordered list of tasks. The order of tasks defines tasks priority.
 * It also contains the list of teams for which the planning takes place.
 */
export interface PlanningInput {
  /**
   * Start date of the planning period in ISO format (YYYY-MM-DD)
   */
  startDate?: string;
  
  /**
   * The ordered list of tasks. Their order defines their priorities.
   */
  backlog: Task[];
  
  /**
   * The list of teams that should be taken into account when planning the work
   */
  teams: Team[];
} 