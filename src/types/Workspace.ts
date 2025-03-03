/**
 * Workspace represents a container for all other elements in the system.
 * Each workspace has its own set of teams, people, tasks, etc.
 */
export interface Workspace {
  /**
   * Unique identifier for the workspace.
   * UUID format.
   */
  id: string;

  /**
   * The workspace's name.
   */
  name: string;
} 