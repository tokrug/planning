/**
 * DayCapacity represents the capacity of a single person for a single day.
 */
export interface DayCapacity {
  /**
   * Unique identifier for the day capacity type.
   */
  id: string;
  
  /**
   * Human-readable name of the day capacity type.
   */
  name: string;
  
  /**
   * Decimal number from 0 to 1 representing the fraction of the day when the person is available.
   * 0 means no availability (day off, sick leave, etc.)
   * 1 means full availability (full work day)
   * Values between 0 and 1 represent partial availability (e.g., 0.5 for half day)
   */
  availability: number;
}