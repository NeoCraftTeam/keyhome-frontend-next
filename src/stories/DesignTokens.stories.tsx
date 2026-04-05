import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography } from '@mui/material';
import {
  brand,
  gradient,
  semantic,
  light,
  dark,
  neutral,
} from '@/theme/tokens';

function ColorSwatch({ name, value }: { name: string; value: string }) {
  const isGradient =
    value.startsWith('linear-gradient') || value.startsWith('radial-gradient');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          border: '1px solid rgba(0,0,0,0.1)',
          background: value,
          flexShrink: 0,
        }}
      />
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: 'monospace' }}
        >
          {isGradient ? 'gradient' : value}
        </Typography>
      </Box>
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function DesignTokens() {
  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>
      <Typography variant="h4" gutterBottom>
        KeyHome Design Tokens
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Centralized color and gradient tokens used across the application.
        Import from <code>@/theme/tokens</code>.
      </Typography>

      <Section title="Brand Colors">
        {Object.entries(brand).map(([k, v]) => (
          <ColorSwatch key={k} name={`brand.${k}`} value={v} />
        ))}
      </Section>

      <Section title="Gradients">
        {Object.entries(gradient).map(([k, v]) => (
          <ColorSwatch key={k} name={`gradient.${k}`} value={v} />
        ))}
      </Section>

      <Section title="Semantic Colors">
        {Object.entries(semantic).map(([k, v]) => (
          <ColorSwatch key={k} name={`semantic.${k}`} value={v} />
        ))}
      </Section>

      <Section title="Light Theme">
        {Object.entries(light)
          .filter(([, v]) => typeof v === 'string')
          .map(([k, v]) => (
            <ColorSwatch key={k} name={`light.${k}`} value={v as string} />
          ))}
      </Section>

      <Section title="Dark Theme">
        {Object.entries(dark)
          .filter(([, v]) => typeof v === 'string')
          .map(([k, v]) => (
            <ColorSwatch key={k} name={`dark.${k}`} value={v as string} />
          ))}
      </Section>

      <Section title="Neutral">
        {Object.entries(neutral).map(([k, v]) => (
          <ColorSwatch key={k} name={`neutral.${k}`} value={v} />
        ))}
      </Section>
    </Box>
  );
}

const meta: Meta = {
  title: 'Foundation/Design Tokens',
  component: DesignTokens,
  parameters: {
    docs: {
      description: {
        component:
          'All design tokens from `@/theme/tokens.ts`. These are the source of truth for colors, gradients, and semantic values.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AllTokens: Story = {};
