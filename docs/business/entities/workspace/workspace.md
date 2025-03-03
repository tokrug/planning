# Workspace

Workspace works like a folder or a container for all other elements in the system.

There can be multiple workspaces in the system and each one with its own set of people, teams, schedules, tasks and so on.

## Database representation

In the database workspace should be represented like a normal entity. However all other entities that are workspace-scoped should be stored in subcollections under a corresponding workspace.

## Implementation Details

### Data Structure

The Workspace entity has the following properties:
- `id`: A unique identifier (UUID format)
- `name`: The name of the workspace

### Repository Pattern

The workspace implementation follows the repository pattern, with the following key functions:
- `getAllWorkspaces()`: Retrieves all workspaces
- `getWorkspaceById(id)`: Retrieves a specific workspace by ID
- `createWorkspace(workspace)`: Creates a new workspace
- `updateWorkspace(id, workspace)`: Updates an existing workspace
- `deleteWorkspace(id)`: Deletes a workspace

### Workspace-Scoped Entities

All other entities in the system are scoped to a workspace:
- Teams
- People
- Tasks
- Day Capacities
- Schedules

Each of these entities is stored in a subcollection under the workspace document in Firestore. For example:
- `/workspaces/{workspaceId}/teams/{teamId}`
- `/workspaces/{workspaceId}/persons/{personId}`

### URL Structure

The application uses the following URL structure to reflect the workspace hierarchy:
- `/workspaces`: List of all workspaces
- `/workspaces/{workspaceId}`: Workspace dashboard
- `/workspaces/{workspaceId}/teams`: Teams in the workspace
- `/workspaces/{workspaceId}/teams/{teamId}`: Team details
- `/workspaces/{workspaceId}/people`: People in the workspace
- `/workspaces/{workspaceId}/tasks`: Tasks in the workspace

### Repository Updates

All repository functions for workspace-scoped entities have been updated to include the `workspaceId` parameter, ensuring that operations only affect data within the specified workspace.

## Navigation

The application's navigation has been updated to be workspace-aware. When a user is viewing a workspace or any of its sub-resources, the navigation sidebar will display links to all workspace-scoped resources:

- Dashboard (`/workspaces/{workspaceId}`)
- Teams (`/workspaces/{workspaceId}/teams`)
- People (`/workspaces/{workspaceId}/people`)
- Tasks (`/workspaces/{workspaceId}/tasks`)
- Day Capacities (`/workspaces/{workspaceId}/day-capacity`)

The navigation automatically extracts the workspace ID from the current URL and displays the appropriate links.

## Migration

The application now redirects from the root path (`/`) to the workspaces list (`/workspaces`). The old non-workspace-scoped routes (e.g., `/teams`, `/people`, etc.) have been replaced with workspace-scoped routes.
