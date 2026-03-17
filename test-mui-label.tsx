import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { TextField, InputAdornment, Box } from '@mui/material';
import { Email } from '@mui/icons-material';

function App() {
  return (
    <Box p={4}>
      <TextField label="Standard" InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
      <TextField label="SlotProps" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email /></InputAdornment> } }} />
    </Box>
  );
}
// just checking types
