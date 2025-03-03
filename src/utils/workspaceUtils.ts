import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

/**
 * Gets the ID of the default workspace
 * This function fetches the first workspace in the collection and returns its ID
 * In a more complex implementation, this could be based on user preferences
 */
export const getDefaultWorkspaceId = async (): Promise<string | null> => {
  try {
    // Query the first workspace in the collection
    const workspacesCollection = collection(db, 'workspaces');
    const workspacesQuery = query(workspacesCollection, limit(1));
    const querySnapshot = await getDocs(workspacesQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the ID of the first workspace
    return querySnapshot.docs[0].id;
  } catch (error) {
    console.error('Error getting default workspace:', error);
    throw error;
  }
};

/**
 * Gets the default workspace information, including ID and name
 */
export const getDefaultWorkspace = async (): Promise<{ id: string; name: string } | null> => {
  try {
    // Query the first workspace in the collection
    const workspacesCollection = collection(db, 'workspaces');
    const workspacesQuery = query(workspacesCollection, limit(1));
    const querySnapshot = await getDocs(workspacesQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      name: doc.data().name || 'Default Workspace'
    };
  } catch (error) {
    console.error('Error getting default workspace:', error);
    throw error;
  }
}; 