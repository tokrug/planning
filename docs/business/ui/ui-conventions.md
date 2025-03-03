# UI conventions

## Page layout

The app should make use of the full screen width available. The layout consists of the following main elements:

- Fixed top navigation bar (64px height)
- Collapsible left side navigation bar (240px expanded / 60px collapsed)
- Main content area (rendered to the right of the side navigation)

### Layout structure and dimensions

- **Top navbar**: 64px height, spans the full width of the screen, fixed position
- **Left sidebar**: 
  - Expanded: 240px width
  - Collapsed: 60px width (icon-only mode)
  - Spans from below the top navbar to the bottom of the screen
  - Includes a collapse/expand toggle button at the bottom
- **Main content**: Positioned to the right of the sidebar, starting below the top navbar
  - Width: Dynamically adjusts based on sidebar state
    - When sidebar expanded: `calc(100% - 240px)`
    - When sidebar collapsed: `calc(100% - 60px)`
  - Left position: Matches current sidebar width (240px or 60px)
  - Top margin: 64px (aligns with the top navbar)
  - Smoothly transitions when sidebar state changes

### Component implementation rules

1. **Container components** should:
   - Use `width: '100%'` to fill the available space
   - Avoid additional horizontal margins that reduce the effective width
   - Use `<Box>` components with `width: '100%'` instead of Material UI's `<Container>` 

2. **Paper components** should:
   - Include `width: '100%'` in their styling
   - Use consistent padding (typically p: 3)
   - Use small margins between elements (typically mb: 2)

3. **Tables and Lists** should:
   - Stretch to full available width using `width: '100%'`
   - Set `tableLayout: 'fixed'` for tables to ensure stable column widths

4. **Forms** should:
   - Use the full available width for their container
   - Use standardized spacing between fields

### Example component structure

```tsx
// Example component structure
return (
  <Box sx={{ width: '100%', py: 0 }}>
    <Paper sx={{ p: 3, mb: 2, width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Entity Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Description text
      </Typography>
    </Paper>
    
    {/* Content sections follow */}
    <Paper sx={{ p: 3, width: '100%' }}>
      {/* Entity list, form, or detail content */}
    </Paper>
  </Box>
);
```

## Navigation bars

### Top navigation bar

The top navigation bar should contain only the most basic options like logging in and other critical aspects. It should be fixed at the top of the screen.

### Left side navigation bar

The left side navigation bar should contain all links to views. It should be fixed at the left side of the screen, below the top navbar.

- Use icons with each navigation item
- Highlight the active route with a left border
- Provide a collapse/expand toggle button at the bottom
- When collapsed, show only icons and display tooltips with menu item names
- Items should be centered when the sidebar is collapsed

## CRUD

The listing page for an entity should contain links to that entity instance details page.

On the details page there should be a way to edit each property separately. The change should be stored in the database right away.

### Entity list pages

Entity list pages should:
- Display entities in a table or structured list format
- Make entity titles/names clickable links to their detail pages
- Provide action buttons for operations like edit and delete

### Quick add forms

For lists that support adding new entities:
- Implement a quick add form above the list
- Keep the form visible during the adding process
- Refresh only the list, not the entire view, when a new entity is created

## Forms

For every form no matter if it handles the whole entity at once or only a single property when the Enter key is pressed the form action should take place e.g. persisting the property change in database.

- Forms should use the full available width
- Fields should be arranged logically with consistent spacing
- Provide clear visual feedback during form submission
- Show validation errors inline with the relevant fields