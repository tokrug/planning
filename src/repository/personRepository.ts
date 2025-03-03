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
      email: person.email,
      weeklySchedule: person.weeklySchedule,
      dailyCapacity: person.dailyCapacity,
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
 * Create an empty weekly schedule
 */
export const createEmptyWeeklySchedule = async (): Promise<WeeklySchedule> => {
  const emptyWeeklySchedule: WeeklySchedule = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0
  };
  
  return emptyWeeklySchedule;
};

/**
 * Create a standard weekly schedule (8 hours on weekdays)
 */
export const createStandardWeeklySchedule = async (): Promise<WeeklySchedule> => {
  const standardWeeklySchedule: WeeklySchedule = {
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0
  };
  
  return standardWeeklySchedule;
};