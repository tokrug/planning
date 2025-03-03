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
import { Task } from '@/types/Task';

/**
 * Get tasks collection reference for a specific workspace
 */
const getTasksCollectionRef = (workspaceId: string) => {
  return collection(db, 'workspaces', workspaceId, 'tasks');
};

/**
 * Get task document reference for a specific workspace
 */
const getTaskDocRef = (workspaceId: string, taskId: string) => {
  return doc(db, 'workspaces', workspaceId, 'tasks', taskId);
};

/**
 * Type representing a task with ID references instead of nested objects
 * This is the format used for storage in Firestore
 */
interface TaskWithReferences {
  id: string;
  title: string;
  description: string;
  estimate: number;
  subtaskIds: string[];
  blockedByIds: string[];
}

/**
 * Convert a Task with nested objects to a TaskWithReferences for storage
 */
const taskToTaskWithReferences = (task: Task): Omit<TaskWithReferences, 'id'> => {
  return {
    title: task.title,
    description: task.description,
    estimate: task.estimate,
    subtaskIds: task.subtasks?.map(subtask => subtask.id) || [],
    blockedByIds: task.blockedBy?.map(blocker => blocker.id) || []
  };
};

/**
 * Get all tasks from the database for a specific workspace
 */
export const getAllTasks = async (workspaceId: string): Promise<Task[]> => {
  try {
    const querySnapshot = await getDocs(
      query(
        getTasksCollectionRef(workspaceId),
        orderBy('title')
      )
    );
    
    const tasksWithReferences = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure these fields always exist with default values
      subtaskIds: doc.data().subtaskIds || [],
      blockedByIds: doc.data().blockedByIds || []
    } as unknown as TaskWithReferences));

    // Build a map of all task IDs to tasks for efficient hydration
    const taskMap = new Map<string, Task>();
    
    // First create basic tasks without relationships
    for (const taskRef of tasksWithReferences) {
      taskMap.set(taskRef.id, {
        id: taskRef.id,
        title: taskRef.title,
        description: taskRef.description,
        estimate: taskRef.estimate,
        subtasks: [],
        blockedBy: []
      });
    }
    
    // Then populate relationships
    for (const taskRef of tasksWithReferences) {
      const task = taskMap.get(taskRef.id);
      if (task) {
        // Add subtasks - ensure we're using safe arrays and filtering null values
        if (Array.isArray(taskRef.subtaskIds)) {
          task.subtasks = taskRef.subtaskIds
            .map(id => taskMap.get(id))
            .filter((subtask): subtask is Task => !!subtask);
        }
        
        // Add blockers - ensure we're using safe arrays and filtering null values
        if (Array.isArray(taskRef.blockedByIds)) {
          task.blockedBy = taskRef.blockedByIds
            .map(id => taskMap.get(id))
            .filter((blocker): blocker is Task => !!blocker);
        }
      }
    }
    
    // Find top-level tasks (those that are not subtasks of any other task)
    const allTasks = Array.from(taskMap.values());
    
    // Everything is working correctly with task relationships, logging for debugging
    console.log("All tasks loaded:", allTasks.length);
    allTasks.forEach(task => {
      const subtasks = task.subtasks || [];
      if (subtasks.length > 0) {
        console.log(`Task ${task.id} (${task.title}) has ${subtasks.length} subtasks:`, 
          subtasks.map(st => `${st.id} (${st.title})`));
      }
    });
    
    return allTasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

/**
 * Get a task by ID from a specific workspace
 */
export const getTaskById = async (workspaceId: string, id: string): Promise<Task | null> => {
  try {
    // We need to get all tasks to properly hydrate the relationships
    const allTasks = await getAllTasks(workspaceId);
    return allTasks.find(task => task.id === id) || null;
  } catch (error) {
    console.error(`Error fetching task with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new task in a specific workspace
 */
export const createTask = async (workspaceId: string, task: Omit<Task, 'id'>): Promise<Task> => {
  try {
    // Generate a new UUID
    const newId = uuidv4();
    
    // Convert to references
    const taskWithRefs = {
      ...taskToTaskWithReferences(task as Task),
    };
    
    // Reference the document with the generated ID
    const docRef = getTaskDocRef(workspaceId, newId);
    
    // Create the task document
    await setDoc(docRef, taskWithRefs);
    
    // Return the task with the generated ID
    return {
      id: newId,
      title: task.title,
      description: task.description,
      estimate: task.estimate,
      subtasks: task.subtasks || [],
      blockedBy: task.blockedBy || []
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Update an existing task in a specific workspace
 */
export const updateTask = async (workspaceId: string, id: string, task: Partial<Omit<Task, 'id'>>): Promise<void> => {
  try {
    const docRef = getTaskDocRef(workspaceId, id);
    
    // Prepare data for update
    const updateData: Record<string, any> = {};
    
    if (task.title !== undefined) {
      updateData.title = task.title;
    }
    
    if (task.description !== undefined) {
      updateData.description = task.description;
    }
    
    if (task.estimate !== undefined) {
      updateData.estimate = task.estimate;
    }
    
    if (task.subtasks !== undefined) {
      // Ensure subtasks is an array before mapping
      if (Array.isArray(task.subtasks)) {
        updateData.subtaskIds = task.subtasks.map(subtask => subtask.id);
      } else {
        // If subtasks is not an array, set it to an empty array
        console.warn(`Subtasks for task ${id} is not an array:`, task.subtasks);
        updateData.subtaskIds = [];
      }
    }
    
    if (task.blockedBy !== undefined) {
      // Ensure blockedBy is an array before mapping
      if (Array.isArray(task.blockedBy)) {
        updateData.blockedByIds = task.blockedBy.map(blocker => blocker.id);
      } else {
        // If blockedBy is not an array, set it to an empty array
        console.warn(`BlockedBy for task ${id} is not an array:`, task.blockedBy);
        updateData.blockedByIds = [];
      }
    }
    
    console.log(`Updating task ${id} with data:`, updateData);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating task with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a task from a specific workspace
 */
export const deleteTask = async (workspaceId: string, id: string): Promise<void> => {
  try {
    // Get all tasks to check for relationships
    const allTasks = await getAllTasks(workspaceId);
    
    // Find tasks that reference this task
    for (const task of allTasks) {
      let updated = false;
      
      // Check if this task is a subtask
      if (task.subtasks && task.subtasks.some(subtask => subtask.id === id)) {
        task.subtasks = task.subtasks.filter(subtask => subtask.id !== id);
        updated = true;
      }
      
      // Check if this task is a blocker
      if (task.blockedBy && task.blockedBy.some(blocker => blocker.id === id)) {
        task.blockedBy = task.blockedBy.filter(blocker => blocker.id !== id);
        updated = true;
      }
      
      // Update the task if needed
      if (updated) {
        await updateTask(workspaceId, task.id, task);
      }
    }
    
    // Delete the task
    const docRef = getTaskDocRef(workspaceId, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting task with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Add a subtask to a task in a specific workspace
 */
export const addSubtask = async (workspaceId: string, parentId: string, subtask: Task): Promise<void> => {
  try {
    // Get the parent task
    const parentTask = await getTaskById(workspaceId, parentId);
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found`);
    }
    
    // Check if the subtask is already a subtask of the parent
    if (parentTask.subtasks?.some(task => task.id === subtask.id)) {
      return; // Subtask is already added
    }
    
    // Add the subtask
    const updatedSubtasks = [...(parentTask.subtasks || []), subtask];
    
    // Update the parent task
    await updateTask(workspaceId, parentId, { subtasks: updatedSubtasks });
  } catch (error) {
    console.error(`Error adding subtask to task ${parentId}:`, error);
    throw error;
  }
};

/**
 * Remove a subtask from a task in a specific workspace
 */
export const removeSubtask = async (workspaceId: string, parentId: string, subtaskId: string): Promise<void> => {
  try {
    // Get the parent task
    const parentTask = await getTaskById(workspaceId, parentId);
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found`);
    }
    
    // Check if the subtask is actually a subtask of the parent
    if (!parentTask.subtasks?.some(task => task.id === subtaskId)) {
      return; // Subtask is not a subtask of the parent
    }
    
    // Remove the subtask
    const updatedSubtasks = parentTask.subtasks.filter(task => task.id !== subtaskId);
    
    // Update the parent task
    await updateTask(workspaceId, parentId, { subtasks: updatedSubtasks });
  } catch (error) {
    console.error(`Error removing subtask ${subtaskId} from task ${parentId}:`, error);
    throw error;
  }
};

/**
 * Add a blocker to a task in a specific workspace
 */
export const addBlocker = async (workspaceId: string, taskId: string, blockerId: string): Promise<void> => {
  try {
    // Get the task
    const task = await getTaskById(workspaceId, taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    // Get the blocker
    const blocker = await getTaskById(workspaceId, blockerId);
    if (!blocker) {
      throw new Error(`Blocker task with ID ${blockerId} not found`);
    }
    
    // Check if the blocker is already blocking the task
    if (task.blockedBy?.some(t => t.id === blockerId)) {
      return; // Blocker is already blocking
    }
    
    // Add the blocker
    const updatedBlockers = [...(task.blockedBy || []), blocker];
    
    // Update the task
    await updateTask(workspaceId, taskId, { blockedBy: updatedBlockers });
  } catch (error) {
    console.error(`Error adding blocker ${blockerId} to task ${taskId}:`, error);
    throw error;
  }
};

/**
 * Remove a blocker from a task in a specific workspace
 */
export const removeBlocker = async (workspaceId: string, taskId: string, blockerId: string): Promise<void> => {
  try {
    // Get the task
    const task = await getTaskById(workspaceId, taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    // Check if the blocker is actually blocking the task
    if (!task.blockedBy?.some(t => t.id === blockerId)) {
      return; // Blocker is not blocking the task
    }
    
    // Remove the blocker
    const updatedBlockers = task.blockedBy.filter(t => t.id !== blockerId);
    
    // Update the task
    await updateTask(workspaceId, taskId, { blockedBy: updatedBlockers });
  } catch (error) {
    console.error(`Error removing blocker ${blockerId} from task ${taskId}:`, error);
    throw error;
  }
};