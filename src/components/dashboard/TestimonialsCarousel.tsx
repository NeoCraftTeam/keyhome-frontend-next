'use client';

import FormatQuote from '@mui/icons-material/FormatQuote';
import Star from '@mui/icons-material/Star';
import {
  Avatar,
  Box,
  Container,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { brand, semantic } from '@/theme/tokens';

interface Testimonial {
  name: string;
  city: string;
  role: string;
  text: string;
  rating: number;
  initials: string;
  color: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Marie-Claire N.',
    city: 'Yaoundé',
    role: 'Locataire',
    text: "J'ai trouvé mon appartement à Bastos en moins d'une semaine. Les coordonnées vérifiées m'ont évité les arnaques. Je recommande à 100% !",
    rating: 5,
    initials: 'MC',
    color: brand.primary,
  },
  {
    name: 'Thierry K.',
    city: 'Douala',
    role: 'Propriétaire',
    text: 'En tant que bailleur, je reçois des demandes sérieuses uniquement. Le tableau de bord me donne une visibilité parfaite sur mes annonces.',
    rating: 5,
    initials: 'TK',
    color: semantic.purple,
  },
  {
    name: 'Amina B.',
    city: 'Bafoussam',
    role: 'Locataire',
    text: "La recherche par IA est bluffante — j'ai tapé « studio calme avec parking » et elle m'a trouvé exactement ça. Gain de temps énorme.",
    rating: 5,
    initials: 'AB',
    color: semantic.successBright,
  },
  {
    name: 'Patrick E.',
    city: 'Yaoundé',
    role: 'Agent immobilier',
    text: "La plateforme attire des clients qualifiés. Depuis que je publie sur KeyHome, mes biens se louent 2× plus vite qu'avant.",
    rating: 5,
    initials: 'PE',
    color: semantic.info,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.25 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          sx={{
            fontSize: 14,
            color: i < rating ? '#FFB800' : 'text.disabled',
          }}
        />
      ))}
    </Box>
  );
}

export default function TestimonialsCarousel() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  /** Auto-advance every 5 s — pause on interaction */
  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 5000);
  }, [next]);

  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval]);

  const testimonial = TESTIMONIALS[active];

  return (
    <Box
      component="section"
      aria-label="Témoignages clients"
      sx={{
        py: { xs: 4, md: 5 },
        bgcolor: isDark ? 'background.default' : '#FFF8F9',
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h6"
          fontWeight={700}
          textAlign="center"
          sx={{ mb: { xs: 3, md: 4 }, color: 'text.primary' }}
        >
          Ce que disent nos utilisateurs
        </Typography>

        <Box
          sx={{
            position: 'relative',
            bgcolor: isDark ? 'background.paper' : '#fff',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            boxShadow: isDark
              ? '0 2px 24px rgba(0,0,0,0.3)'
              : '0 4px 32px rgba(246,71,95,0.08)',
            border: '1px solid',
            borderColor: isDark ? 'divider' : 'rgba(246,71,95,0.12)',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Quote icon */}
          <FormatQuote
            sx={{
              fontSize: 48,
              color: testimonial.color,
              opacity: 0.15,
              position: 'absolute',
              top: 16,
              right: 20,
              transform: 'scaleX(-1)',
            }}
          />

          {/* Stars */}
          <StarRating rating={testimonial.rating} />

          {/* Text */}
          <Typography
            variant="body1"
            color="text.primary"
            sx={{
              fontStyle: 'italic',
              lineHeight: 1.7,
              fontSize: { xs: '0.9rem', md: '1rem' },
              flex: 1,
            }}
          >
            &ldquo;{testimonial.text}&rdquo;
          </Typography>

          {/* Author */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: testimonial.color,
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {testimonial.initials}
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ lineHeight: 1.2 }}
              >
                {testimonial.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {testimonial.role} · {testimonial.city}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Controls */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1.5,
            mt: 2.5,
          }}
        >
          <IconButton
            size="small"
            onClick={() => {
              prev();
              resetInterval();
            }}
            aria-label="Témoignage précédent"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            ←
          </IconButton>

          {/* Dots */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {TESTIMONIALS.map((_, idx) => (
              <Box
                key={idx}
                component="button"
                onClick={() => {
                  setActive(idx);
                  resetInterval();
                }}
                aria-label={`Témoignage ${idx + 1}`}
                sx={{
                  width: idx === active ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  bgcolor: idx === active ? 'primary.main' : 'divider',
                  p: 0,
                }}
              />
            ))}
          </Box>

          <IconButton
            size="small"
            onClick={() => {
              next();
              resetInterval();
            }}
            aria-label="Témoignage suivant"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            →
          </IconButton>
        </Box>
      </Container>
    </Box>
  );
}
