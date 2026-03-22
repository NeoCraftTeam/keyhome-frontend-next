import type { Meta, StoryObj } from '@storybook/react';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { Box } from '@mui/material';

const meta: Meta<typeof SkeletonCard> = {
  title: 'UI/SkeletonCard',
  component: SkeletonCard,
  parameters: {
    docs: {
      description: {
        component: 'Loading placeholder that mirrors the exact shape of AdCard for zero-CLS loading states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonCard>;

export const Default: Story = {};

export const Grid: Story = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 900 }}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </Box>
  ),
};
