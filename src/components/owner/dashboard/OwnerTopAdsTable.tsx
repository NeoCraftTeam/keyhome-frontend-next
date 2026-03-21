'use client';

import {
  Favorite as FavoriteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

export type TopAdRow = {
  ad_id: string;
  title: string;
  status?: string;
  views: number;
  favorites: number;
};

export default function OwnerTopAdsTable({
  rows,
  onRowClick,
  periodLabel,
}: {
  rows: TopAdRow[];
  onRowClick: (adId: string) => void;
  periodLabel: string;
}) {
  const [query, setQuery] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? rows.filter((r) => r.title.toLowerCase().includes(q)) : [...rows];
    list.sort((a, b) => (sortDesc ? b.views - a.views : a.views - b.views));
    return list;
  }, [rows, query, sortDesc]);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          p: 2.5,
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Top annonces
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Performances sur la période sélectionnée ({periodLabel})
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Rechercher"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <TableContainer sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
        <Table
          size="medium"
          sx={{
            minWidth: 400,
            '& .MuiTableCell-root': { py: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2.5 } },
          }}
        >
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                Annonce
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  width: 110,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => setSortDesc((s) => !s)}
              >
                Vues {sortDesc ? '↓' : '↑'}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', width: 110 }}
              >
                Favoris
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  Aucune annonce ne correspond à votre recherche.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={row.ad_id}
                  hover
                  onClick={() => onRowClick(row.ad_id)}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Typography fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                      {row.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                      {row.views.toLocaleString('fr-FR')}
                      <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                      {row.favorites.toLocaleString('fr-FR')}
                      <FavoriteIcon sx={{ fontSize: 16, color: 'error.light' }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
