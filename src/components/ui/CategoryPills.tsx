'use client';

import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Box, Chip, IconButton } from '@mui/material';
import { useRef } from 'react';

interface CategoryPillsProps {
  categories: { label: string; value: string; icon?: React.ReactNode }[];
  selected: string;
  onChange: (value: string) => void;
}

export default function CategoryPills({ categories, selected, onChange }: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <IconButton
        onClick={() => scroll('left')}
        size="small"
        sx={{
          position: 'absolute',
          left: -4,
          zIndex: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          width: 28,
          height: 28,
          '&:hover': { bgcolor: 'background.paper' },
        }}
      >
        <ChevronLeft sx={{ fontSize: 18 }} />
      </IconButton>

      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          px: 4,
          py: 1,
          width: '100%',
        }}
      >
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            icon={cat.icon as React.ReactElement | undefined}
            onClick={() => onChange(cat.value)}
            variant={selected === cat.value ? 'filled' : 'outlined'}
            sx={{
              flexShrink: 0,
              fontWeight: 500,
              borderRadius: '20px',
              px: 1,
              ...(selected === cat.value
                ? {
                    bgcolor: '#F6475F',
                    color: '#fff',
                    borderColor: '#F6475F',
                    '&:hover': { bgcolor: '#D93A50' },
                  }
                : {
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' },
                  }),
            }}
          />
        ))}
      </Box>

      <IconButton
        onClick={() => scroll('right')}
        size="small"
        sx={{
          position: 'absolute',
          right: -4,
          zIndex: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          width: 28,
          height: 28,
          '&:hover': { bgcolor: 'background.paper' },
        }}
      >
        <ChevronRight sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}
