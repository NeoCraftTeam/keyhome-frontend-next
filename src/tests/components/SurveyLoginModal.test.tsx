import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';
import SurveyLoginModal from '@/components/surveys/SurveyLoginModal';
import { ownerLightTheme } from '@/theme/ownerTheme';
import { brand, brandAgent } from '@/theme/tokens';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('SurveyLoginModal', () => {
  it('uses owner teal palette when wrapped in owner theme', () => {
    render(
      <ThemeProvider theme={ownerLightTheme}>
        <SurveyLoginModal
          open
          surveyId="survey-1"
          title="Votre avis compte !"
          description="Aidez-nous à améliorer KeyHome."
          onDismiss={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(ownerLightTheme.palette.primary.main).toBe(brandAgent.primary);
    expect(ownerLightTheme.palette.primary.main).not.toBe(brand.primary);

    const cta = screen.getByRole('button', { name: /répondre au sondage/i });
    expect(cta.className).toMatch(/MuiButton-containedPrimary/);
    expect(ownerLightTheme.palette.gradient?.primary).toBe(brandAgent.primary);
    expect(ownerLightTheme.palette.gradient?.primary).not.toContain(
      'linear-gradient'
    );
  });
});
