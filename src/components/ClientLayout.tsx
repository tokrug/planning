'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Box, CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a theme instance
const theme = createTheme({
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: false, // Make containers full width by default
      },
    },
  },
});

// Drawer width values must match those in Navigation component
const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 60;

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  // State to track drawer collapsed status
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);

  // Function to handle drawer state changes from Navigation component
  const handleDrawerStateChange = (collapsed: boolean) => {
    setIsDrawerCollapsed(collapsed);
  };

  // Current drawer width based on state
  const currentDrawerWidth = isDrawerCollapsed ? collapsedDrawerWidth : expandedDrawerWidth;

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Reset CSS */}
        
        {/* Top Navigation - Fixed at the top */}
        <Navigation onDrawerStateChange={handleDrawerStateChange} />
        
        {/* Main Content Area - Positioned to the right of the sidebar with dynamic width */}
        <Box
          component="main"
          sx={{
            position: 'absolute',
            left: `${currentDrawerWidth}px`,
            top: '64px', // AppBar height
            right: 0,
            bottom: 0,
            padding: 2,
            overflow: 'auto',
            boxSizing: 'border-box',
            backgroundColor: '#f5f5f5',
            transition: 'left 0.2s ease-in-out',
            width: `calc(100% - ${currentDrawerWidth}px)`, // Ensure full width minus drawer
          }}
        >
          {children}
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};

export default ClientLayout;