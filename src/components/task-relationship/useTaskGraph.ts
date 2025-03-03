import { useMemo } from 'react';
import { Node, Edge, MarkerType, NodeProps } from 'reactflow';
import { Task } from '../../types/Task';

// Define interface for group data
interface GroupData {
  task: Task;
  totalEstimate: number;
  subtaskIds: string[];
}

/**
 * Custom hook to convert task data into ReactFlow nodes and edges
 * Handles layout calculations for timeline and grouping
 */
const useTaskGraph = (tasks: Task[]) => {
  return useMemo(() => {
    // Core data structures for graph representation
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const groups: Node<GroupData>[] = []; // Store group nodes
    
    // Maps to store task relationships and node references
    const nodeMap = new Map<string, Node>();
    const subtaskMap = new Map<string, string[]>();
    const blockedByMap = new Map<string, string[]>();
    const blocksMap = new Map<string, string[]>(); // Reverse of blockedBy
    const groupMap = new Map<string, Node<GroupData>>(); // Map task IDs to their group nodes

    // Calculate total estimate for each task (including subtasks)
    const calculateTotalEstimate = (task: Task): number => {
      if (!task.subtasks || task.subtasks.length === 0) {
        return task.estimate;
      }
      
      const subtaskEstimate = task.subtasks.reduce(
        (total, subtask) => total + calculateTotalEstimate(subtask),
        0
      );
      
      return task.estimate + subtaskEstimate;
    };

    // STEP 1: Create nodes for all tasks and build relationship maps
    tasks.forEach(task => {
      // Calculate total estimate for sizing
      const totalEstimate = calculateTotalEstimate(task);
      
      // Check if this is a subtask
      const isSubtask = tasks.some(t => 
        t.subtasks?.some(st => st.id === task.id)
      );
      
      // Check if it's a subtask and doesn't have subtasks of its own
      const isLeafSubtask = isSubtask && (!task.subtasks || task.subtasks.length === 0);
      
      // We create regular nodes only for subtasks that don't have their own subtasks
      if (isLeafSubtask) {
        // Create node for leaf subtask
        const node: Node = {
          id: task.id,
          type: 'taskNode',
          position: { x: 0, y: 0 }, // Will be calculated later
          data: {
            task,
            totalEstimate,
            isSubtask: true,
            parentId: null, // Will be set later
          },
          parentNode: null, // Will be set later
        };
        
        // Store the node in our map
        nodeMap.set(task.id, node);
        nodes.push(node);
      } else {
        // For parent tasks or subtasks with their own subtasks, 
        // we'll still need an entry in the node map for relationships
        nodeMap.set(task.id, {
          id: task.id,
          // This is just a placeholder, not an actual node
          position: { x: 0, y: 0 },
          data: {
            task,
            totalEstimate,
            isSubtask: isSubtask,
          },
          type: 'placeholder'
        } as Node);
      }
      
      // Track subtask relationships
      if (task.subtasks && task.subtasks.length > 0) {
        subtaskMap.set(
          task.id,
          task.subtasks.map(subtask => subtask.id)
        );
      }
      
      // Track blocking relationships
      if (task.blockedBy && task.blockedBy.length > 0) {
        const blockers = task.blockedBy.map(blocker => blocker.id);
        blockedByMap.set(task.id, blockers);
        
        // Also build the reverse map (what tasks a task blocks)
        blockers.forEach(blockerId => {
          if (!blocksMap.has(blockerId)) {
            blocksMap.set(blockerId, []);
          }
          blocksMap.get(blockerId)!.push(task.id);
        });
      }
    });

    // STEP 2: Set parent references for subtasks and create blocking edges
    tasks.forEach(task => {
      // Set parent references for subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, index) => {
          const subtaskNode = nodeMap.get(subtask.id);
          if (subtaskNode) {
            // Get the subtask's group if it exists
            const subtaskGroup = groupMap.get(subtask.id);
            
            // If this is a leaf subtask node (not a parent with its own group)
            if (subtaskNode.type === 'taskNode') {
              // Mark as subtask
              subtaskNode.data = {
                ...subtaskNode.data,
                isSubtask: true,
                parentId: task.id,
              };
              
              // Position subtask within the parent group
              // Static positions based on index for a vertical layout
              subtaskNode.position = { 
                x: 20, // Left margin within group
                y: 120 + (index * 80) // Start below parent header
              };
              
              // Set parent reference for group containment
              subtaskNode.parentNode = `group-${task.id}`;
              subtaskNode.extent = 'parent'; // Keep within bounds of parent
            } 
            // If this is a parent subtask with its own group
            else if (subtaskGroup) {
              // For nested parent-subtasks, we'll position them in the main flow
              // rather than inside their parent groups, as ReactFlow doesn't support nested groups well
              // The connections will still show the relationships correctly
            }
          }
        });
      }
      
      // Create blocks edges
      if (task.blockedBy && task.blockedBy.length > 0) {
        task.blockedBy.forEach(blocker => {
          // Determine if we should connect to/from a group or a direct task node
          const isBlockerParent = !tasks.some(t => 
            t.subtasks?.some(st => st.id === blocker.id)
          );
          
          const isTaskParent = !tasks.some(t => 
            t.subtasks?.some(st => st.id === task.id)
          );
          
          // Source should be group node if blocker is a parent task
          const sourceId = isBlockerParent ? `group-${blocker.id}` : blocker.id;
          
          // Target should be group node if blocked task is a parent task
          const targetId = isTaskParent ? `group-${task.id}` : task.id;
          
          edges.push({
            id: `blocks-${blocker.id}-${task.id}`,
            source: sourceId,         // Blocker (group or task)
            target: targetId,         // Blocked task (group or task)
            sourceHandle: 'blocks-source',
            targetHandle: 'blocked-target',
            type: 'default',
            style: { 
              strokeWidth: 3,         // Slightly thicker by default
              stroke: '#f44336', 
              strokeDasharray: '5 5' 
            },
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#f44336' },
            label: 'blocks',          // Changed label from "blocked by" to "blocks"
            labelStyle: { 
              fill: '#f44336', 
              fontWeight: 700, 
              fontSize: 12,
              background: 'white',
              padding: 4,
              borderRadius: 4,
              border: '1px solid #f44336'
            },
            labelBgStyle: { fill: 'white' },
            labelBgPadding: [4, 2],
            data: {
              selectable: true,
              relationship: 'blocks',
              sourceTaskId: blocker.id,
              targetTaskId: task.id
            }
          });
        });
      }
    });

    // STEP 3: Calculate node dimensions based on task estimates
    const getNodeDimensions = (taskId: string): { width: number; height: number } => {
      const node = nodeMap.get(taskId);
      if (!node) return { width: 150, height: 100 };
      
      const totalEstimate = node.data.totalEstimate;
      const baseWidth = 150;
      const baseHeight = 100;
      const maxScale = 3;
      
      // Scale width based on estimate, keep height constant
      const widthScale = 1 + Math.min(totalEstimate / 10, 1) * maxScale;
      
      return {
        width: baseWidth * widthScale,
        height: baseHeight
      };
    };

    // Find all parent tasks (tasks with subtasks)
    const parentTasks = tasks.filter(task => task.subtasks && task.subtasks.length > 0);
    
    // Find standalone tasks (not subtasks of any other task)
    const standaloneTaskIds = tasks
      .filter(task => !tasks.some(t => t.subtasks?.some(s => s.id === task.id)))
      .map(task => task.id);
    
    // Define rootTasks as standalone tasks (will be used for layout calculation)
    const rootTasks = standaloneTaskIds;
      
    // STEP 3: Create group nodes for parent tasks
    parentTasks.forEach(task => {
      // Get all direct subtasks
      const directSubtaskIds = task.subtasks?.map(st => st.id) || [];
      
      // Create a group node to represent this parent task
      const groupNode: Node<GroupData> = {
        id: `group-${task.id}`,
        type: 'group',
        position: { x: 0, y: 0 }, // Will be calculated later
        style: {
          width: 350, // Default width
          height: 120 + (directSubtaskIds.length * 80), // Base height plus space for subtasks
        },
        draggable: true, // Make the group draggable
        selectable: true, // Make the group selectable
        data: {
          task: task,
          totalEstimate: calculateTotalEstimate(task),
          subtaskIds: directSubtaskIds,
        },
      };
      
      // Store the group
      groups.push(groupNode);
      groupMap.set(task.id, groupNode);
    });

    // STEP 4: Position the nodes using a timeline-based X positioning
    // with subtasks positioned below their parents
    
    // Spacing constants
    const ROW_HEIGHT = 200;             // Vertical space between rows
    const SUBTASK_VERTICAL_OFFSET = 150; // Vertical space between parent and subtask
    const HORIZONTAL_GAP = 150;          // Extra space between nodes horizontally
    
    // Keep track of the right edge of each node for horizontal positioning
    const rightEdges = new Map<string, number>();
    
    // Keep track of bottom-most Y position for each subtree
    const subtreeBottoms = new Map<string, number>();
    
    // Calculate a node's horizontal position based on blockers
    const calculateHorizontalPosition = (taskId: string): number => {
      const blockers = blockedByMap.get(taskId) || [];
      
      if (blockers.length === 0) {
        return 0; // Start at left edge if no blockers
      }
      
      // Find the rightmost edge of all blocker nodes
      let maxRight = 0;
      
      blockers.forEach(blockerId => {
        const rightEdge = rightEdges.get(blockerId) || 0;
        maxRight = Math.max(maxRight, rightEdge);
      });
      
      // Position after rightmost blocker
      return maxRight + HORIZONTAL_GAP;
    };
    
    // Process a task and all its subtasks
    const processTask = (taskId: string, startX: number, startY: number, visited = new Set<string>()): { bottomY: number } => {
      if (visited.has(taskId)) {
        return { bottomY: startY };
      }
      visited.add(taskId);
      
      const node = nodeMap.get(taskId);
      if (!node) {
        return { bottomY: startY };
      }
      
      // Check if this is a parent task with a group node
      const groupNode = groupMap.get(taskId);
      if (groupNode) {
        // Position the group node instead
        groupNode.position = { x: startX, y: startY };
        
        // Calculate group dimensions
        const groupHeight = groupNode.style.height as number;
        const groupWidth = groupNode.style.width as number;
        
        // Store its right edge
        const rightEdge = startX + groupWidth;
        rightEdges.set(taskId, rightEdge);
        
        // Calculate bottom of this subtree
        const bottomY = startY + groupHeight;
        subtreeBottoms.set(taskId, bottomY);
        
        return { bottomY };
      }
      
      // This is a standalone subtask not in a group
      // Position this node
      node.position = { x: startX, y: startY };
      
      // Calculate its dimensions
      const { width, height } = getNodeDimensions(taskId);
      
      // Store its right edge
      const rightEdge = startX + width;
      rightEdges.set(taskId, rightEdge);
      
      // Calculate bottom of this subtree
      const bottomY = startY + height;
      subtreeBottoms.set(taskId, bottomY);
      
      return { bottomY };
    };

    // First position root tasks and their subtasks
    let currentY = 0;
    
    // Process in topological order (dependencies first)
    const processed = new Set<string>();
    
    // Helper function to check if a task's blockers have been processed
    const canProcess = (taskId: string): boolean => {
      const blockers = blockedByMap.get(taskId) || [];
      
      // If no blockers or all blockers have been processed, we can process this task
      return blockers.length === 0 || blockers.every(blockerId => processed.has(blockerId));
    };
    
    // Process tasks in dependency order
    let remainingTasks = [...rootTasks];
    
    while (remainingTasks.length > 0) {
      // Find tasks that can be processed now
      const tasksToProcess = remainingTasks.filter(taskId => canProcess(taskId));
      
      // If we can't process any tasks but still have tasks left, we have a cycle
      if (tasksToProcess.length === 0) {
        // Just process whatever is left as a fallback
        remainingTasks.forEach(taskId => {
          if (processed.has(taskId)) return;
          
          const x = calculateHorizontalPosition(taskId);
          
          // If this is a parent task, position its group node
          const groupNode = groupMap.get(taskId);
          if (groupNode) {
            groupNode.position = { x, y: currentY };
            
            // Position this group node now instead of using processTask
            currentY += groupNode.style.height as number + ROW_HEIGHT;
            processed.add(taskId);
          } else {
            const result = processTask(taskId, x, currentY, new Set());
            processed.add(taskId);
            currentY = result.bottomY + ROW_HEIGHT;
          }
        });
        break;
      }
      
      // Process tasks we can process now
      tasksToProcess.forEach(taskId => {
        if (processed.has(taskId)) return;
        
        const x = calculateHorizontalPosition(taskId);
        
        // If this is a parent task, position its group node
        const groupNode = groupMap.get(taskId);
        if (groupNode) {
          groupNode.position = { x, y: currentY };
          
          // Position this group node now instead of using processTask
          currentY += groupNode.style.height as number + ROW_HEIGHT;
          processed.add(taskId);
        } else {
          const result = processTask(taskId, x, currentY, new Set());
          processed.add(taskId);
          currentY = result.bottomY + ROW_HEIGHT;
        }
      });
      
      // Remove processed tasks from the remaining list
      remainingTasks = remainingTasks.filter(taskId => !processed.has(taskId));
    }
    
    // Final adjustment: Make sure all blocked tasks start after their blockers
    nodes.forEach(node => {
      const taskId = node.id;
      const blockers = blockedByMap.get(taskId) || [];
      
      if (blockers.length > 0) {
        let maxBlockerRight = 0;
        
        blockers.forEach(blockerId => {
          const rightEdge = rightEdges.get(blockerId) || 0;
          maxBlockerRight = Math.max(maxBlockerRight, rightEdge);
        });
        
        // If the node starts before the rightmost blocker, adjust its position
        if (node.position.x < maxBlockerRight + HORIZONTAL_GAP) {
          const xOffset = (maxBlockerRight + HORIZONTAL_GAP) - node.position.x;
          
          // Shift this node and all its subtasks
          const shiftSubtree = (nodeId: string, visited = new Set<string>()) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            
            const currentNode = nodeMap.get(nodeId);
            if (!currentNode) return;
            
            // Shift this node
            currentNode.position.x += xOffset;
            
            // Update right edge
            const { width } = getNodeDimensions(nodeId);
            rightEdges.set(nodeId, currentNode.position.x + width);
            
            // Shift all its subtasks
            const subtasks = subtaskMap.get(nodeId) || [];
            subtasks.forEach(subtaskId => shiftSubtree(subtaskId, visited));
          };
          
          shiftSubtree(taskId);
        }
      }
    });

    // STEP 5: Adjust group sizes and handle special cases
    groups.forEach(groupNode => {
      const taskId = groupNode.data.task.id;
      const subtaskIds = groupNode.data.subtaskIds;
      
      // Default width based on estimate size
      const totalEstimate = groupNode.data.totalEstimate;
      const baseWidth = 300;
      const maxWidthScale = 2;
      const widthScale = 1 + Math.min(totalEstimate / 10, 1) * maxWidthScale;
      const width = Math.max(baseWidth * widthScale, 350); // Minimum width for small tasks
      
      // Set a reasonable width based on task estimate and number of subtasks
      groupNode.style = {
        ...groupNode.style,
        width: width, 
        // Height already set earlier (120 + subtasks * 80)
      };
      
      // Final adjustments for group nodes
      // Update right edge tracking for horizontal positioning
      const rightEdge = groupNode.position.x + (groupNode.style.width as number);
      rightEdges.set(taskId, rightEdge);
    });
    
    // STEP 6: Apply horizontal shift adjustments to groups based on blocking relationships
    // Similar to what we did for regular nodes
    groups.forEach(groupNode => {
      const taskId = groupNode.data.task.id;
      const blockers = blockedByMap.get(taskId) || [];
      
      if (blockers.length > 0) {
        let maxBlockerRight = 0;
        
        blockers.forEach(blockerId => {
          const rightEdge = rightEdges.get(blockerId) || 0;
          maxBlockerRight = Math.max(maxBlockerRight, rightEdge);
        });
        
        // If the group starts before the rightmost blocker, adjust its position
        if (groupNode.position.x < maxBlockerRight + HORIZONTAL_GAP) {
          const xOffset = (maxBlockerRight + HORIZONTAL_GAP) - groupNode.position.x;
          
          // Shift this group
          groupNode.position.x += xOffset;
          
          // Update right edge
          rightEdges.set(taskId, groupNode.position.x + (groupNode.style.width as number));
        }
      }
    });
    
    // Add the group nodes to the nodes array
    // Note: React Flow requires groups to be before their children in the array
    return { 
      nodes: [...groups, ...nodes], 
      edges 
    };
  }, [tasks]);
};

export default useTaskGraph;