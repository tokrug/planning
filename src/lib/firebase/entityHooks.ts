import { useState, useEffect } from 'react';
import { 
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  setDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from './clientApp';

/**
 * Hook to subscribe to a collection of entities and manage them with real-time updates
 * @param workspaceId The ID of the workspace to use
 * @param entityType The entity type (collection name) - e.g., 'teams', 'tasks', 'people', etc.
 * @param conditions Optional query conditions 
 * @param sortBy Optional sort configuration
 * @param transform Optional function to transform the entity after fetching (e.g., for hydrating references)
 * @returns An object with entity data and CRUD functions
 */
export function useEntityCollection<T = DocumentData>(
  workspaceId: string,
  entityType: string,
  conditions: {
    field: string;
    operator: "<" | "<=" | "==" | "!=" | ">=" | ">" | "array-contains" | "in" | "array-contains-any" | "not-in";
    value: any;
  }[] = [],
  sortBy: { field: string; direction: 'asc' | 'desc' }[] = [],
  transform?: (entities: (T & { id: string })[], workspaceId: string) => Promise<(T & { id: string })[]>
) {
  const [entities, setEntities] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setEntities([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    
    // Get collection reference
    const collectionRef = collection(db, 'workspaces', workspaceId, entityType);
    
    // Build the query
    let queryRef = query(collectionRef);
    
    // Add conditions if specified
    if (conditions.length > 0) {
      conditions.forEach(condition => {
        queryRef = query(queryRef, where(condition.field, condition.operator, condition.value));
      });
    }
    
    // Add sorting if specified
    if (sortBy.length > 0) {
      sortBy.forEach(sort => {
        queryRef = query(queryRef, orderBy(sort.field, sort.direction));
      });
    }
    
    // Subscribe to query
    const unsubscribe = onSnapshot(
      queryRef,
      async (snapshot) => {
        try {
          let results = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          })) as (T & { id: string })[];
          
          // Apply transformation if provided
          if (transform) {
            results = await transform(results, workspaceId);
          }
          
          setEntities(results);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error(`Error transforming ${entityType}:`, err);
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        console.error(`Error fetching ${entityType}:`, err);
        setError(err as Error);
        setLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [workspaceId, entityType, JSON.stringify(conditions), JSON.stringify(sortBy)]);

  // Function to create entity with auto-generated ID
  const createEntity = async (data: Omit<T, 'id'>) => {
    try {
      const newId = uuidv4();
      const docRef = doc(db, 'workspaces', workspaceId, entityType, newId);
      await setDoc(docRef, data);
      return { id: newId, ...data } as T & { id: string };
    } catch (err) {
      console.error(`Error creating ${entityType}:`, err);
      throw err;
    }
  };

  // Function to update entity
  const updateEntity = async (id: string, data: Partial<T>) => {
    try {
      const docRef = doc(db, 'workspaces', workspaceId, entityType, id);
      await updateDoc(docRef, data as DocumentData);
    } catch (err) {
      console.error(`Error updating ${entityType} with ID ${id}:`, err);
      throw err;
    }
  };

  // Function to delete entity
  const deleteEntity = async (id: string) => {
    try {
      const docRef = doc(db, 'workspaces', workspaceId, entityType, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`Error deleting ${entityType} with ID ${id}:`, err);
      throw err;
    }
  };

  return { 
    entities, 
    loading, 
    error, 
    createEntity, 
    updateEntity, 
    deleteEntity 
  };
}

/**
 * Hook to subscribe to a single entity document and manage it with real-time updates
 * @param workspaceId The ID of the workspace to use
 * @param entityType The entity type (collection name)
 * @param entityId The ID of the entity document
 * @param transform Optional function to transform the entity after fetching
 * @returns An object with entity data and CRUD functions
 */
export function useEntityDocument<T = DocumentData>(
  workspaceId: string,
  entityType: string,
  entityId: string | null | undefined,
  transform?: (entity: T & { id: string }, workspaceId: string) => Promise<T & { id: string }>
) {
  const [entity, setEntity] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!workspaceId || !entityId) {
      setEntity(null);
      setLoading(false);
      return () => {};
    }
    
    setLoading(true);
    
    const docRef = doc(db, 'workspaces', workspaceId, entityType, entityId);
    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        try {
          if (snapshot.exists()) {
            let data = {
              ...snapshot.data(),
              id: snapshot.id,
            } as T & { id: string };
            
            // Apply transformation if provided
            if (transform) {
              data = await transform(data, workspaceId);
            }
            
            setEntity(data);
          } else {
            setEntity(null);
          }
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error(`Error transforming ${entityType}:`, err);
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        console.error(`Error fetching ${entityType}:`, err);
        setError(err as Error);
        setLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [workspaceId, entityType, entityId]);

  // Function to update entity
  const updateEntity = async (data: Partial<T>) => {
    if (!entityId) return;
    
    try {
      const docRef = doc(db, 'workspaces', workspaceId, entityType, entityId);
      await updateDoc(docRef, data as DocumentData);
    } catch (err) {
      console.error(`Error updating ${entityType} with ID ${entityId}:`, err);
      throw err;
    }
  };

  // Function to delete entity
  const deleteEntity = async () => {
    if (!entityId) return;
    
    try {
      const docRef = doc(db, 'workspaces', workspaceId, entityType, entityId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`Error deleting ${entityType} with ID ${entityId}:`, err);
      throw err;
    }
  };

  return { 
    entity, 
    loading, 
    error, 
    updateEntity, 
    deleteEntity 
  };
} 