import { useState, useEffect } from 'react';
import { 
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  DocumentData
} from 'firebase/firestore';
import { db } from './clientApp';

// Hook to subscribe to a collection
export function useCollection<T = DocumentData>(
  collectionName: string,
  conditions: {
    field: string;
    operator: "<" | "<=" | "==" | "!=" | ">=" | ">" | "array-contains" | "in" | "array-contains-any" | "not-in";
    value: any;
  }[] = [],
  sortBy: { field: string; direction: 'asc' | 'desc' }[] = [],
  limitTo?: number
) {
  const [documents, setDocuments] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Build the query
    const collectionRef = collection(db, collectionName);
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
    
    // Add limit if specified
    if (limitTo) {
      queryRef = query(queryRef, limit(limitTo));
    }
    
    // Subscribe to query
    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as (T & { id: string })[];
        
        setDocuments(results);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching collection:', err);
        setError(err as Error);
        setLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [collectionName, JSON.stringify(conditions), JSON.stringify(sortBy), limitTo]);
  
  return { documents, loading, error };
}

// Hook to subscribe to a single document
export function useDocument<T = DocumentData>(collectionName: string, documentId: string | null | undefined) {
  const [document, setDocument] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      setLoading(false);
      return () => {};
    }
    
    setLoading(true);
    
    const docRef = doc(db, collectionName, documentId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setDocument({
            ...snapshot.data(),
            id: snapshot.id,
          } as T & { id: string });
        } else {
          setDocument(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching document:', err);
        setError(err as Error);
        setLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [collectionName, documentId]);
  
  return { document, loading, error };
}