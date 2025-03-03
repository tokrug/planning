# Firebase Cloud Firestore Setup

This document describes the Firebase Cloud Firestore setup for the Planning Next application.

## Installation

Required library:
- `firebase`: Client-side Firebase SDK

Installed via:
```bash
npm install firebase
```

## Configuration

### Client-side Setup

1. Create a `.env.local` file in the project root with the following Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Usage

### Client-side Initialization

Create a file `src/lib/firebase/clientApp.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
```

### Example Usage in Components

```typescript
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

// Read data
const fetchTasks = async () => {
  const tasksCollection = collection(db, 'tasks');
  const taskSnapshot = await getDocs(tasksCollection);
  const taskList = taskSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return taskList;
};

// Add data
const addTask = async (task) => {
  const tasksCollection = collection(db, 'tasks');
  return await addDoc(tasksCollection, task);
};

// Update data
const updateTask = async (id, updatedData) => {
  const taskDoc = doc(db, 'tasks', id);
  return await updateDoc(taskDoc, updatedData);
};

// Delete data
const deleteTask = async (id) => {
  const taskDoc = doc(db, 'tasks', id);
  return await deleteDoc(taskDoc);
};
```

## Security Rules

Set up Firestore security rules to protect your data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps

1. Set up authentication if needed
2. Define your data model
3. Create data access layer for Firestore operations