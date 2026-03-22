import type { Meta, StoryObj } from '@storybook/react';
import HostBadge from '@/components/ui/HostBadge';
import { Box } from '@mui/material';

const meta: Meta<typeof HostBadge> = {
  title: 'UI/HostBadge',
  component: HostBadge,
  argTypes: {
    variant: { control: 'select', options: ['gold', 'indigo'] },
    size: { control: 'select', options: ['small', 'medium'] },
    label: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Trust-signal pill for verified owners (gold) and agencies (indigo). Shows a tooltip with verification context.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HostBadge>;

export const VerifiedOwner: Story = {
  args: { variant: 'gold', size: 'small' },
};

export const VerifiedAgency: Story = {
  args: { variant: 'indigo', size: 'small' },
};

export const MediumSize: Story = {
  args: { variant: 'gold', size: 'medium' },
};

export const CustomLabel: Story = {
  args: { variant: 'indigo', size: 'medium', label: 'Super Agent' },
};

export const AllVariants: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <HostBadge variant="gold" size="small" />
        <HostBadge variant="gold" size="medium" />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <HostBadge variant="indigo" size="small" />
        <HostBadge variant="indigo" size="medium" />
      </Box>
    </Box>
  ),
};
