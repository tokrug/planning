import { 
  collection,
  doc,
  getDocs,
  getDoc, 
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  DocumentData
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase/clientApp';
import { Person } from '@/types/Person';
import { DayCapacity } from '@/types/DayCapacity';
import { WeeklySchedule } from '@/types/WeeklySchedule';
import { ScheduleException } from '@/types/ScheduleException';
import { getDayCapacityById } from './dayCapacityRepository';

/**
 * Get persons collection reference for a specific workspace
 */
const getPersonsCollectionRef = (workspaceId: string) => {
  return collection(db, 'workspaces', workspaceId, 'persons');
};

/**
 * Get person document reference for a specific workspace
 */
const getPersonDocRef = (workspaceId: string, personId: string) => {
  return doc(db, 'workspaces', workspaceId, 'persons', personId);
};

/**
 * Get all persons from the database for a specific workspace
 */
export const getAllPersons = async (workspaceId: string): Promise<Person[]> => {
  try {
    const querySnapshot = await getDocs(
      query(
        getPersonsCollectionRef(workspaceId),
        orderBy('name')
      )
    );
    
    const persons = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Person[];

    return persons;
  } catch (error) {
    console.error('Error fetching persons:', error);
    throw error;
  }
};

/**
 * Get a person by ID from a specific workspace
 */
export const getPersonById = async (workspaceId: string, id: string): Promise<Person | null> => {
  try {
    const docRef = getPersonDocRef(workspaceId, id);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      return {
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as Person;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching person with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new person in a specific workspace
 * @param workspaceId Workspace ID
 * @param person Person data without ID
 * @returns The created person with ID
 */
export const createPerson = async (workspaceId: string, person: Omit<Person, 'id'>): Promise<Person> => {
  try {
    // Generate a new UUID for the person
    const newId = uuidv4();
    
    // Reference the document with the generated ID
    const docRef = getPersonDocRef(workspaceId, newId);
    
    // Create the person document
    await setDoc(docRef, {
      name: person.name,
      skills: person.skills,
      weeklySchedule: person.weeklySchedule,
      scheduleExceptions: person.scheduleExceptions || []
    });
    
    // Return the person with the generated ID
    return {
      id: newId,
      ...person
    };
  } catch (error) {
    console.error('Error creating person:', error);
    throw error;
  }
};

/**
 * Update an existing person in a specific workspace
 * @param workspaceId Workspace ID
 * @param id Person ID
 * @param person Partial person data to update
 */
export const updatePerson = async (workspaceId: string, id: string, person: Partial<Omit<Person, 'id'>>): Promise<void> => {
  try {
    const docRef = getPersonDocRef(workspaceId, id);
    await updateDoc(docRef, { ...person });
  } catch (error) {
    console.error(`Error updating person with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a person from a specific workspace
 * @param workspaceId Workspace ID
 * @param id Person ID
 */
export const deletePerson = async (workspaceId: string, id: string): Promise<void> => {
  try {
    const docRef = getPersonDocRef(workspaceId, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting person with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create an empty weekly schedule for a specific workspace
 * @param workspaceId Workspace ID
 */
export const createEmptyWeeklySchedule = async (workspaceId: string): Promise<WeeklySchedule> => {
  try {
    // Get the "day-off" day capacity
    const dayOff = await getDayCapacityById(workspaceId, 'day-off');
    
    if (!dayOff) {
      throw new Error('Day-off capacity not found. Please make sure day capacities are seeded.');
    }
    
    return {
      monday: dayOff,
      tuesday: dayOff,
      wednesday: dayOff,
      thursday: dayOff,
      friday: dayOff,
      saturday: dayOff,
      sunday: dayOff
    };
  } catch (error) {
    console.error('Error creating empty weekly schedule:', error);
    throw error;
  }
};

/**
 * Create a standard weekly schedule (8 hours on weekdays) for a specific workspace
 * @param workspaceId Workspace ID
 */
export const createStandardWeeklySchedule = async (workspaceId: string): Promise<WeeklySchedule> => {
  try {
    // Get the day capacities
    const dayOff = await getDayCapacityById(workspaceId, 'day-off');
    const workDay = await getDayCapacityById(workspaceId, 'full');
    
    if (!dayOff || !workDay) {
      throw new Error('Required day capacities not found. Please make sure day capacities are seeded.');
    }
    
    return {
      monday: workDay,
      tuesday: workDay,
      wednesday: workDay,
      thursday: workDay,
      friday: workDay,
      saturday: dayOff,
      sunday: dayOff
    };
  } catch (error) {
    console.error('Error creating standard weekly schedule:', error);
    throw error;
  }
};