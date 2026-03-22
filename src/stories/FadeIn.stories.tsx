import type { Meta, StoryObj } from '@storybook/react';
import FadeIn from '@/components/ui/FadeIn';
import { Box, Typography } from '@mui/material';

const meta: Meta<typeof FadeIn> = {
  title: 'UI/FadeIn',
  component: FadeIn,
  argTypes: {
    direction: {
      control: 'select',
      options: ['up', 'down', 'left', 'right', 'none'],
    },
    delay: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
    duration: { control: { type: 'range', min: 0.1, max: 2, step: 0.1 } },
    distance: { control: { type: 'range', min: 0, max: 100, step: 5 } },
  },
  parameters: {
    docs: {
      description: {
        component: 'CSS keyframe-based fade-in animation with configurable direction, delay, and distance.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FadeIn>;

export const Default: Story = {
  args: {
    direction: 'up',
    delay: 0,
    duration: 0.5,
    distance: 20,
    children: (
      <Box sx={{ p: 3, bgcolor: 'primary.main', borderRadius: 2, color: '#fff' }}>
        <Typography variant="h6">Animated Content</Typography>
        <Typography variant="body2">This card fades in from the specified direction.</Typography>
      </Box>
    ),
  },
};

export const Staggered: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {[0, 0.15, 0.3, 0.45].map((delay, i) => (
        <FadeIn key={i} delay={delay} direction="up">
          <Box sx={{ p: 2, bgcolor: 'grey.200', borderRadius: 2, minWidth: 100, textAlign: 'center' }}>
            <Typography>Card {i + 1}</Typography>
          </Box>
        </FadeIn>
      ))}
    </Box>
  ),
};
