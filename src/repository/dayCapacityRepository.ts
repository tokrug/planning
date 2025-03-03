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
import { db } from '@/lib/firebase/clientApp';
import { DayCapacity } from '@/types/DayCapacity';

const COLLECTION_NAME = 'dayCapacities';

/**
 * Get all day capacity entries from the database
 */
export const getAllDayCapacities = async (): Promise<DayCapacity[]> => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        orderBy('name')
      )
    );
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DayCapacity));
  } catch (error) {
    console.error('Error fetching day capacities:', error);
    throw error;
  }
};

/**
 * Get a day capacity by its ID
 */
export const getDayCapacityById = async (id: string): Promise<DayCapacity | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      return {
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as DayCapacity;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching day capacity with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new day capacity entry with auto-generated ID
 */
export const createDayCapacity = async (dayCapacity: Omit<DayCapacity, 'id'>): Promise<DayCapacity> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: dayCapacity.name,
      availability: dayCapacity.availability
    });
    
    return {
      id: docRef.id,
      ...dayCapacity
    };
  } catch (error) {
    console.error('Error creating day capacity:', error);
    throw error;
  }
};

/**
 * Create a new day capacity entry with a specific ID
 */
export const createDayCapacityWithId = async (id: string, dayCapacity: Omit<DayCapacity, 'id'>): Promise<DayCapacity> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Use setDoc instead of updateDoc because it will create the document if it doesn't exist
    await setDoc(docRef, {
      name: dayCapacity.name,
      availability: dayCapacity.availability
    });
    
    return {
      id,
      ...dayCapacity
    };
  } catch (error) {
    console.error(`Error creating day capacity with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Update an existing day capacity entry
 */
export const updateDayCapacity = async (id: string, dayCapacity: Partial<Omit<DayCapacity, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, dayCapacity as DocumentData);
  } catch (error) {
    console.error(`Error updating day capacity with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a day capacity entry
 */
export const deleteDayCapacity = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting day capacity with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Seed predefined day capacity entries
 * This function can be used to initialize the database with default values
 */
export const seedDefaultDayCapacities = async (): Promise<void> => {
  const defaults: DayCapacity[] = [
    {
      id: 'day-off',
      name: 'Day off',
      availability: 0
    },
    {
      id: 'personal-day',
      name: 'Personal day',
      availability: 0
    },
    {
      id: 'sick-leave',
      name: 'Sick leave',
      availability: 0
    },
    {
      id: 'full',
      name: 'Work day',
      availability: 1
    },
    {
      id: '1-2',
      name: 'Work day (1/2)',
      availability: 0.5
    },
    {
      id: '3-4',
      name: 'Work day (3/4)',
      availability: 0.75
    }
  ];

  try {
    for (const dayCapacity of defaults) {
      const docRef = doc(db, COLLECTION_NAME, dayCapacity.id);
      await setDoc(docRef, {
        name: dayCapacity.name,
        availability: dayCapacity.availability
      });
    }
    console.log('Default day capacities seeded successfully');
  } catch (error) {
    console.error('Error seeding default day capacities:', error);
    throw error;
  }
};