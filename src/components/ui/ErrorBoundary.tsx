'use client';

import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI — if omitted, a generic friendly error card is shown */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * React class ErrorBoundary — catches rendering errors in the subtree and shows
 * a friendly fallback. Use around page content or complex widget trees.
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset(): void {
    this.setState({ hasError: false, error: undefined });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 8,
            px: 2,
            minHeight: '40vh',
          }}
        >
          <ErrorIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Oups, quelque chose s&apos;est mal passé
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
            Une erreur inattendue est survenue. Réessayez ou rechargez la page.
          </Typography>
          <Button
            variant="contained"
            onClick={() => this.handleReset()}
            sx={{ borderRadius: 2 }}
          >
            Réessayer
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
