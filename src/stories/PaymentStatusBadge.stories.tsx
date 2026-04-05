import type { Meta, StoryObj } from '@storybook/react';
import PaymentStatusBadge from '@/components/payment/PaymentStatusBadge';
import { Box } from '@mui/material';

const meta: Meta<typeof PaymentStatusBadge> = {
  title: 'Payment/PaymentStatusBadge',
  component: PaymentStatusBadge,
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'pending', 'failed', 'cancelled'],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Status chip for payment transactions. Maps status strings to French labels and semantic colors.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentStatusBadge>;

export const Success: Story = { args: { status: 'success' } };
export const Pending: Story = { args: { status: 'pending' } };
export const Failed: Story = { args: { status: 'failed' } };
export const Cancelled: Story = { args: { status: 'cancelled' } };

export const AllStatuses: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <PaymentStatusBadge status="success" />
      <PaymentStatusBadge status="pending" />
      <PaymentStatusBadge status="failed" />
      <PaymentStatusBadge status="cancelled" />
    </Box>
  ),
};
