/**
 * Atomic UI component barrel.
 * Import everything from '@/components/ui' — never from deep paths.
 *
 * Atoms   → Button, Input, GradientButton, Typography
 * Surfaces → Card
 * Feedback → AppLoader, PageLoader, QueryError, EmptyState
 * Layout   → FadeIn, ScrollReveal, PageTransition, SkipLink
 */

export { Button } from './forms/Button';
export { Card } from './layout/Card';
export { GradientButton } from './forms/GradientButton';
export type { GradientButtonProps } from './forms/GradientButton';
export { Input } from './forms/Input';
export type { InputProps } from './forms/Input';
export { TextField } from './forms/TextField';
export { Typography } from './typography/Typography';

export { default as AppLoader } from './feedback/AppLoader';
export { default as EmptyState } from './feedback/EmptyState';
export { default as FadeIn } from './layout/FadeIn';
export { default as PageBreadcrumbs } from './layout/PageBreadcrumbs';
export { default as PageLoader } from './feedback/PageLoader';
export { default as PageTransition } from './layout/PageTransition';
export { default as PhoneField } from './forms/PhoneField';
export { default as QueryError } from './feedback/QueryError';
export { default as RouteProgressBar } from './navigation/RouteProgressBar';
export { default as ScrollReveal } from './layout/ScrollReveal';
export { default as SkipLink } from './navigation/SkipLink';
