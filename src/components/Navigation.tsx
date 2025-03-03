'use client';

import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home as HomeIcon,
  CalendarMonth as DayCapacityIcon,
  Person as PersonIcon,
  Group as TeamIcon,
  Assignment as TaskIcon,
  Login as LoginIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

// Drawer width constants
const drawerWidth = 240;
const collapsedDrawerWidth = 60;

interface NavigationProps {
  onDrawerStateChange?: (collapsed: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onDrawerStateChange }) => {
  const pathname = usePathname();
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  
  // Extract workspace ID from the URL if present
  const workspaceIdMatch = pathname.match(/\/workspaces\/([^\/]+)/);
  const workspaceId = workspaceIdMatch ? workspaceIdMatch[1] : null;
  
  const isInWorkspaceContext = !!workspaceId;

  const toggleDrawer = () => {
    const newState = !isDrawerCollapsed;
    setIsDrawerCollapsed(newState);
    
    // Notify parent component about the drawer state change
    if (onDrawerStateChange) {
      onDrawerStateChange(newState);
    }
  };

  // Calculate current drawer width based on collapsed state
  const currentDrawerWidth = isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth;

  // Generate navigation items based on whether we're in workspace context
  const getNavigationItems = () => {
    // Base navigation - always show Workspaces
    const baseItems = [
      { name: 'Workspaces', path: '/workspaces', icon: <BusinessIcon /> },
    ];

    // If we're in a workspace context, add workspace-specific items
    if (isInWorkspaceContext) {
      return [
        ...baseItems,
        { name: 'Dashboard', path: `/workspaces/${workspaceId}`, icon: <DashboardIcon /> },
        { name: 'Teams', path: `/workspaces/${workspaceId}/teams`, icon: <TeamIcon /> },
        { name: 'People', path: `/workspaces/${workspaceId}/people`, icon: <PersonIcon /> },
        { name: 'Tasks', path: `/workspaces/${workspaceId}/tasks`, icon: <TaskIcon /> },
        { name: 'Day Capacities', path: `/workspaces/${workspaceId}/day-capacity`, icon: <DayCapacityIcon /> },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Top Navigation Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, 
          width: '100%'
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1 }}
          >
            Planning Next {isInWorkspaceContext && `| Workspace: ${workspaceId}`}
          </Typography>
          
          {/* Top bar only has critical options like login */}
          <Button 
            color="inherit" 
            startIcon={<LoginIcon />}
          >
            Login
          </Button>
        </Toolbar>
      </AppBar>

      {/* Left Side Navigation - Collapsible */}
      <Drawer
        variant="permanent"
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          position: 'fixed',
          transition: 'width 0.2s ease-in-out',
          whiteSpace: 'nowrap',
          [`& .MuiDrawer-paper`]: { 
            position: 'fixed',
            width: currentDrawerWidth, 
            boxSizing: 'border-box',
            top: '64px', // Below AppBar
            height: 'calc(100vh - 64px)',
            border: 'none',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            overflowX: 'hidden',
            transition: 'width 0.2s ease-in-out',
            zIndex: 1
          },
        }}
      >
        <Box sx={{ 
          overflow: 'auto', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Navigation Items */}
          <List>
            {navigationItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <Tooltip title={isDrawerCollapsed ? item.name : ''} placement="right">
                  <ListItemButton 
                    component={Link} 
                    href={item.path}
                    selected={pathname === item.path}
                    sx={{
                      minHeight: 48,
                      px: isDrawerCollapsed ? 2.5 : 3,
                      justifyContent: isDrawerCollapsed ? 'center' : 'initial',
                      borderLeft: pathname === item.path ? 
                        '4px solid' : '4px solid transparent',
                      borderLeftColor: 'primary.main',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: 0,
                      mr: isDrawerCollapsed ? 0 : 3,
                      justifyContent: 'center',
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.name} 
                      sx={{ 
                        opacity: isDrawerCollapsed ? 0 : 1,
                        transition: 'opacity 0.2s ease-in-out',
                      }} 
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
          
          {/* Collapse/Expand Button at bottom */}
          <Box sx={{ 
            mt: 'auto', 
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            p: 1,
            display: 'flex',
            justifyContent: isDrawerCollapsed ? 'center' : 'flex-end'
          }}>
            <Tooltip title={isDrawerCollapsed ? "Expand" : "Collapse"}>
              <IconButton onClick={toggleDrawer}>
                {isDrawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};