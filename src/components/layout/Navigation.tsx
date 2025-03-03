import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, IconButton, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { usePathname } from '../../hooks/usePathname';
import { BusinessIcon, DashboardIcon, GroupsIcon, PersonIcon, AssignmentIcon, CalendarTodayIcon } from '@mui/icons-material';
import { theme } from '../../theme';

// Define the navigation items
const getNavigationItems = (workspaceId?: string) => {
  const baseItems = [
    {
      text: 'Workspaces',
      icon: <BusinessIcon />,
      href: '/workspaces'
    }
  ];

  // If we have a workspace ID, add workspace-specific routes
  if (workspaceId) {
    return [
      ...baseItems,
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        href: `/workspaces/${workspaceId}`
      },
      {
        text: 'Teams',
        icon: <GroupsIcon />,
        href: `/workspaces/${workspaceId}/teams`
      },
      {
        text: 'People',
        icon: <PersonIcon />,
        href: `/workspaces/${workspaceId}/people`
      },
      {
        text: 'Tasks',
        icon: <AssignmentIcon />,
        href: `/workspaces/${workspaceId}/tasks`
      },
      {
        text: 'Day Capacities',
        icon: <CalendarTodayIcon />,
        href: `/workspaces/${workspaceId}/day-capacity`
      }
    ];
  }

  return baseItems;
};

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  
  // Extract workspace ID from the URL if present
  const workspaceId = pathname.match(/\/workspaces\/([^\/]+)/)?.[1];
  
  // Get navigation items based on whether we have a workspace ID
  const navigationItems = getNavigationItems(workspaceId);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          whiteSpace: 'nowrap',
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          ...(!open && {
            width: theme.spacing(7),
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }),
        },
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
        }}
      >
        <IconButton onClick={toggleDrawer}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List component="nav">
        {navigationItems.map((item) => (
          <ListItem 
            key={item.text} 
            disablePadding 
            sx={{ display: 'block' }}
          >
            <ListItemButton
              component={Link}
              href={item.href}
              selected={pathname === item.href}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ opacity: open ? 1 : 0 }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}; 