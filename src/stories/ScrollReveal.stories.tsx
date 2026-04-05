import type { Meta, StoryObj } from '@storybook/react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Box, Typography } from '@mui/material';

const meta: Meta<typeof ScrollReveal> = {
  title: 'UI/ScrollReveal',
  component: ScrollReveal,
  argTypes: {
    delay: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    yOffset: { control: { type: 'range', min: 0, max: 60, step: 4 } },
    once: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Scroll-linked fade + slide-up reveal using Framer Motion `useInView`. Respects `prefers-reduced-motion`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollReveal>;

export const Default: Story = {
  args: {
    delay: 0,
    yOffset: 24,
    once: true,
    children: (
      <Box
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6">Scroll to reveal</Typography>
        <Typography variant="body2" color="text.secondary">
          This content fades in as you scroll down.
        </Typography>
      </Box>
    ),
  },
};

export const StaggeredList: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 40 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        ↓ Scroll down to see the cards reveal
      </Typography>
      {[0, 1, 2, 3, 4].map((i) => (
        <ScrollReveal key={i} delay={i * 0.1}>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography>Item {i + 1}</Typography>
          </Box>
        </ScrollReveal>
      ))}
    </Box>
  ),
};
