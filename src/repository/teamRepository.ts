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
import { Team } from '@/types/Team';
import { Person } from '@/types/Person';
import { getPersonById } from './personRepository';

/**
 * Get teams collection reference for a specific workspace
 */
const getTeamsCollectionRef = (workspaceId: string) => {
  return collection(db, 'workspaces', workspaceId, 'teams');
};

/**
 * Get team document reference for a specific workspace
 */
const getTeamDocRef = (workspaceId: string, teamId: string) => {
  return doc(db, 'workspaces', workspaceId, 'teams', teamId);
};

/**
 * Get all teams from the database for a specific workspace
 */
export const getAllTeams = async (workspaceId: string): Promise<Team[]> => {
  try {
    const querySnapshot = await getDocs(
      query(
        getTeamsCollectionRef(workspaceId),
        orderBy('name')
      )
    );
    
    const teams = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[];

    // Teams from Firestore will have person references (IDs) rather than full person objects
    // We need to hydrate these references
    return await Promise.all(
      teams.map(async (team) => {
        // The people array from Firestore will be an array of string IDs
        const personIds = team.people as unknown as string[];
        
        // Fetch each person by ID (from workspace)
        const peoplePromises = personIds.map(id => getPersonById(workspaceId, id));
        const peopleResults = await Promise.all(peoplePromises);
        
        // Filter out any null results (in case a person was deleted)
        const people = peopleResults.filter((person): person is Person => person !== null);
        
        // Return the team with hydrated person objects
        return {
          ...team,
          people
        };
      })
    );
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

/**
 * Get a team by ID from a specific workspace
 */
export const getTeamById = async (workspaceId: string, id: string): Promise<Team | null> => {
  try {
    const docRef = getTeamDocRef(workspaceId, id);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      const teamData = {
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as Team & { people: string[] };
      
      // Hydrate person references
      const personIds = teamData.people;
      const peoplePromises = personIds.map(id => getPersonById(workspaceId, id));
      const peopleResults = await Promise.all(peoplePromises);
      
      // Filter out any null results
      const people = peopleResults.filter((person): person is Person => person !== null);
      
      return {
        id: teamData.id,
        name: teamData.name,
        people
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching team with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new team in a specific workspace
 * @param workspaceId Workspace ID
 * @param team Team data without ID
 * @returns The created team with ID
 */
export const createTeam = async (workspaceId: string, team: Omit<Team, 'id'>): Promise<Team> => {
  try {
    // Generate a new UUID for the team
    const newId = uuidv4();
    
    // Extract person IDs for storage
    const personIds = team.people.map(person => person.id);
    
    // Reference the document with the generated ID
    const docRef = getTeamDocRef(workspaceId, newId);
    
    // Create the team document with person references
    await setDoc(docRef, {
      name: team.name,
      people: personIds
    });
    
    // Return the team with the generated ID
    return {
      id: newId,
      name: team.name,
      people: team.people
    };
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

/**
 * Update an existing team in a specific workspace
 * @param workspaceId Workspace ID
 * @param id Team ID
 * @param team Partial team data to update
 */
export const updateTeam = async (workspaceId: string, id: string, team: Partial<Omit<Team, 'id'>>): Promise<void> => {
  try {
    const docRef = getTeamDocRef(workspaceId, id);
    
    // Prepare data for update
    const updateData: Record<string, any> = {};
    
    if (team.name !== undefined) {
      updateData.name = team.name;
    }
    
    if (team.people !== undefined) {
      // Extract person IDs for storage
      updateData.people = team.people.map(person => person.id);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating team with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a team from a specific workspace
 * @param workspaceId Workspace ID
 * @param id Team ID
 */
export const deleteTeam = async (workspaceId: string, id: string): Promise<void> => {
  try {
    const docRef = getTeamDocRef(workspaceId, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting team with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Add a person to a team in a specific workspace
 * @param workspaceId Workspace ID
 * @param teamId Team ID
 * @param person Person to add
 */
export const addPersonToTeam = async (workspaceId: string, teamId: string, person: Person): Promise<void> => {
  try {
    const team = await getTeamById(workspaceId, teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    
    // Check if person is already in the team
    if (team.people.some(p => p.id === person.id)) {
      return; // Person is already in the team, no need to add
    }
    
    // Add person to the team
    const updatedPeople = [...team.people, person];
    
    // Update the team
    await updateTeam(workspaceId, teamId, { people: updatedPeople });
  } catch (error) {
    console.error(`Error adding person to team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Remove a person from a team in a specific workspace
 * @param workspaceId Workspace ID
 * @param teamId Team ID
 * @param personId Person ID
 */
export const removePersonFromTeam = async (workspaceId: string, teamId: string, personId: string): Promise<void> => {
  try {
    const team = await getTeamById(workspaceId, teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    
    // Filter out the person to remove
    const updatedPeople = team.people.filter(p => p.id !== personId);
    
    // If the people array didn't change, the person wasn't in the team
    if (updatedPeople.length === team.people.length) {
      return; // Person is not in the team, no need to update
    }
    
    // Update the team
    await updateTeam(workspaceId, teamId, { people: updatedPeople });
  } catch (error) {
    console.error(`Error removing person from team ${teamId}:`, error);
    throw error;
  }
};