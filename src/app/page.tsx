'use client';

import { Box, Button, Container, Typography, Paper, Grid, Card, CardContent, CardActions } from '@mui/material';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Planning Next
        </Typography>
        <Typography variant="h5" component="h2" color="text.secondary" paragraph>
          A comprehensive project planning and resource management application
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            size="large" 
            component={Link} 
            href="/day-capacity"
          >
            Explore
          </Button>
        </Box>
      </Paper>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }}>
        Resource Management
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Day Capacity
              </Typography>
              <Typography variant="body1" paragraph>
                Manage different types of day capacities for personnel.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small"
                component={Link}
                href="/day-capacity"
              >
                Manage
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                People
              </Typography>
              <Typography variant="body1" paragraph>
                Manage team members, skills, and availability schedules.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small"
                component={Link}
                href="/people"
              >
                Manage
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Teams
              </Typography>
              <Typography variant="body1" paragraph>
                Create and manage teams and team compositions.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small"
                component={Link}
                href="/teams"
              >
                Manage
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Tasks
              </Typography>
              <Typography variant="body1" paragraph>
                Manage tasks with subtasks and dependencies.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small"
                component={Link}
                href="/tasks"
              >
                Manage
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}