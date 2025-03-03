import { 
  collection,
  doc,
  getDocs,
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase/clientApp';
import { Workspace } from '@/types/Workspace';

const COLLECTION_NAME = 'workspaces';

/**
 * Get all workspaces from the database
 */
export const getAllWorkspaces = async (): Promise<Workspace[]> => {
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
    })) as Workspace[];
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    throw error;
  }
};

/**
 * Get a workspace by ID
 */
export const getWorkspaceById = async (id: string): Promise<Workspace | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      return {
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as Workspace;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching workspace with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new workspace
 * @param workspace Workspace data without ID
 * @returns The created workspace with ID
 */
export const createWorkspace = async (workspace: Omit<Workspace, 'id'>): Promise<Workspace> => {
  try {
    // Generate a new UUID for the workspace
    const newId = uuidv4();
    
    // Reference the document with the generated ID
    const docRef = doc(db, COLLECTION_NAME, newId);
    
    // Create the workspace document
    await setDoc(docRef, {
      name: workspace.name
    });
    
    // Return the workspace with the generated ID
    return {
      id: newId,
      name: workspace.name
    };
  } catch (error) {
    console.error('Error creating workspace:', error);
    throw error;
  }
};

/**
 * Update an existing workspace
 * @param id Workspace ID
 * @param workspace Partial workspace data to update
 */
export const updateWorkspace = async (id: string, workspace: Partial<Omit<Workspace, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Prepare data for update
    const updateData: Record<string, any> = {};
    
    if (workspace.name !== undefined) {
      updateData.name = workspace.name;
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating workspace with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a workspace
 * @param id Workspace ID
 */
export const deleteWorkspace = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting workspace with ID ${id}:`, error);
    throw error;
  }
}; 