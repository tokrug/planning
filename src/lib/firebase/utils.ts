import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  limit,
  DocumentData
} from 'firebase/firestore';
import { db } from './clientApp';

// Generic function to fetch all documents from a collection
export const getCollection = async <T = DocumentData>(collectionName: string): Promise<(T & { id: string })[]> => {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (T & { id: string })[];
};

// Generic function to add a document to a collection
export const addDocument = async <T>(collectionName: string, data: T) => {
  const collectionRef = collection(db, collectionName);
  return await addDoc(collectionRef, data);
};

// Generic function to update a document
export const updateDocument = async <T>(collectionName: string, id: string, data: Partial<T>) => {
  const docRef = doc(db, collectionName, id);
  return await updateDoc(docRef, data as DocumentData);
};

// Generic function to delete a document
export const deleteDocument = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  return await deleteDoc(docRef);
};

// Generic function to query documents with conditions
export const queryDocuments = async <T = DocumentData>(
  collectionName: string,
  conditions: {
    field: string;
    operator: "<" | "<=" | "==" | "!=" | ">=" | ">" | "array-contains" | "in" | "array-contains-any" | "not-in";
    value: any;
  }[],
  sortBy?: { field: string; direction: 'asc' | 'desc' }[],
  limitTo?: number
): Promise<(T & { id: string })[]> => {
  const collectionRef = collection(db, collectionName);
  
  // Build query with conditions
  let q = query(
    collectionRef,
    ...conditions.map(condition => where(condition.field, condition.operator, condition.value))
  );
  
  // Add sorting if specified
  if (sortBy && sortBy.length > 0) {
    q = query(
      q,
      ...sortBy.map(sort => orderBy(sort.field, sort.direction))
    );
  }
  
  // Add limit if specified
  if (limitTo) {
    q = query(q, limit(limitTo));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (T & { id: string })[];
};