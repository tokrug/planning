import { Person } from './Person';

/**
 * Team represents a group of people working together.
 */
export interface Team {
  /**
   * Unique identifier for the team.
   * UUID format.
   */
  id: string;

  /**
   * The team's name.
   */
  name: string;

  /**
   * List of people who are part of this team.
   */
  people: Person[];
}