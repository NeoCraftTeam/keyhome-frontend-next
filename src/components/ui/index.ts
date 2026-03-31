/**
 * Atomic UI component barrel.
 * Import everything from '@/components/ui' — never from deep paths.
 *
 * Atoms   → Button, Input, GradientButton, Typography
 * Surfaces → Card
 * Feedback → AppLoader, PageLoader, QueryError, EmptyState
 * Layout   → FadeIn, ScrollReveal, PageTransition, SkipLink
 */

export { Button } from './Button';
export { Card } from './Card';
export { GradientButton } from './GradientButton';
export type { GradientButtonProps } from './GradientButton';
export { Input } from './Input';
export type { InputProps } from './Input';
export { TextField } from './TextField';
export { Typography } from './Typography';

export { default as AppLoader } from './AppLoader';
export { default as EmptyState } from './EmptyState';
export { default as FadeIn } from './FadeIn';
export { default as PageBreadcrumbs } from './PageBreadcrumbs';
export { default as PageLoader } from './PageLoader';
export { default as PageTransition } from './PageTransition';
export { default as PhoneField } from './PhoneField';
export { default as QueryError } from './QueryError';
export { default as RouteProgressBar } from './RouteProgressBar';
export { default as ScrollReveal } from './ScrollReveal';
export { default as SkipLink } from './SkipLink';
