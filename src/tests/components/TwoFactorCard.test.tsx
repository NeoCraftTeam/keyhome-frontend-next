import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/mfa.service', () => ({
  mfaService: {
    status: vi.fn(),
    startTotp: vi.fn(),
    confirmTotp: vi.fn(),
    disableTotp: vi.fn(),
    regenerateRecoveryCodes: vi.fn(),
  },
}));

import TwoFactorCard from '@/components/settings/TwoFactorCard';
import { mfaService } from '@/services/mfa.service';
import { lightTheme } from '@/theme/theme';

const mocked = vi.mocked(mfaService);

const DISABLED_STATUS = {
  mfa_required: false,
  mfa_configured: false,
  mfa_verified: false,
  methods: [] as never[],
  recovery_codes_remaining: 0,
};

const ENABLED_STATUS = {
  mfa_required: false,
  mfa_configured: true,
  mfa_verified: true,
  methods: ['totp' as const],
  recovery_codes_remaining: 8,
};

const SETUP = {
  secret: 'JBSWY3DPEHPK3PXP',
  otpauth_url: 'otpauth://totp/KeyHome:jane%40example.com',
  qr_code: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
  holder: 'jane@example.com',
  company: 'KeyHome',
  expires_in_minutes: 10,
};

function renderCard() {
  return render(
    <ThemeProvider theme={lightTheme}>
      <TwoFactorCard />
    </ThemeProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TwoFactorCard — enrolment', () => {
  it('offers to enable the authenticator app when no factor is configured', async () => {
    mocked.status.mockResolvedValue(DISABLED_STATUS);

    renderCard();

    expect(
      await screen.findByRole('button', { name: 'Activer' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Désactiver' })
    ).not.toBeInTheDocument();
    // No recovery-code row before there is anything to recover.
    expect(screen.queryByText('Codes de secours')).not.toBeInTheDocument();
  });

  it('shows the QR code and the manual key once the setup starts', async () => {
    mocked.status.mockResolvedValue(DISABLED_STATUS);
    mocked.startTotp.mockResolvedValue(SETUP);

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Activer' })
    );

    expect(mocked.startTotp).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByAltText(
        "QR code à scanner avec votre application d'authentification"
      )
    ).toHaveAttribute('src', SETUP.qr_code);
    expect(screen.getByText(SETUP.secret)).toBeInTheDocument();
  });

  // BUG CATCH: the QR render is server-side and may fail. Falling back to the
  // manual key is the only way the user can still enrol.
  it('falls back to the manual key when the QR render failed', async () => {
    mocked.status.mockResolvedValue(DISABLED_STATUS);
    mocked.startTotp.mockResolvedValue({ ...SETUP, qr_code: null });

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Activer' })
    );

    expect(
      await screen.findByText(
        'QR code indisponible : saisissez la clé ci-dessous à la main.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(SETUP.secret)).toBeInTheDocument();
  });
});

describe('TwoFactorCard — confirmation', () => {
  it('keeps Confirmer disabled until six digits are typed', async () => {
    mocked.status.mockResolvedValue(DISABLED_STATUS);
    mocked.startTotp.mockResolvedValue(SETUP);

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Activer' })
    );

    const confirm = await screen.findByRole('button', { name: 'Confirmer' });
    expect(confirm).toBeDisabled();

    const field = screen.getByLabelText('Code à 6 chiffres');
    await userEvent.type(field, '12345');
    expect(confirm).toBeDisabled();

    await userEvent.type(field, '6');
    expect(confirm).toBeEnabled();
  });

  // BUG CATCH: a letter typed (or pasted) into the code field would be sent to
  // the API and burn an attempt for nothing.
  it('strips everything that is not a digit', async () => {
    mocked.status.mockResolvedValue(DISABLED_STATUS);
    mocked.startTotp.mockResolvedValue(SETUP);

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Activer' })
    );

    const field = await screen.findByLabelText('Code à 6 chiffres');
    await userEvent.type(field, '12ab34-56');

    expect(field).toHaveValue('123456');
  });

  it('reveals the recovery codes exactly once and flips the row to Désactiver', async () => {
    mocked.status
      .mockResolvedValueOnce(DISABLED_STATUS)
      .mockResolvedValue(ENABLED_STATUS);
    mocked.startTotp.mockResolvedValue(SETUP);
    mocked.confirmTotp.mockResolvedValue({
      message: 'Vérification en deux étapes activée.',
      mfa_method: 'totp',
      recovery_codes: ['ABCDE-FGHJK', 'MNPQR-STUVW'],
    });

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Activer' })
    );
    await userEvent.type(
      await screen.findByLabelText('Code à 6 chiffres'),
      '123456'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(mocked.confirmTotp).toHaveBeenCalledWith('123456');
    expect(await screen.findByText('ABCDE-FGHJK')).toBeInTheDocument();
    expect(screen.getByText('MNPQR-STUVW')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Notez ces codes maintenant : ils ne seront plus jamais affichés.'
      )
    ).toBeInTheDocument();

    // The status is refetched, so the row now offers to turn the factor off.
    expect(
      await screen.findByRole('button', { name: 'Désactiver' })
    ).toBeInTheDocument();
    expect(screen.getByText('8 codes encore utilisables')).toBeInTheDocument();

    // Acknowledging hides them for good — nothing keeps a copy in the DOM.
    await userEvent.click(
      screen.getByRole('button', { name: "J'ai enregistré mes codes" })
    );
    expect(screen.queryByText('ABCDE-FGHJK')).not.toBeInTheDocument();
  });

  it('shows safe French copy when the submitted code is refused', async () => {
    mocked.status.mockResolvedValue(DISABLED_STATUS);
    mocked.startTotp.mockResolvedValue(SETUP);

    const refused = new AxiosError('Request failed');
    refused.response = {
      status: 422,
      statusText: '',
      data: {
        message: 'MfaService::verify failed',
        code: 'MFA_TOTP_INVALID_CODE',
      },
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    };
    mocked.confirmTotp.mockRejectedValue(refused);

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Activer' })
    );
    await userEvent.type(
      await screen.findByLabelText('Code à 6 chiffres'),
      '000000'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(
      await screen.findByText(
        'Code incorrect. Vérifiez le code affiché dans votre application puis réessayez.'
      )
    ).toBeInTheDocument();
    // The backend string never reaches the UI.
    expect(screen.queryByText(/MfaService/)).not.toBeInTheDocument();
    // The field is cleared so the next code can be typed straight away.
    expect(screen.getByLabelText('Code à 6 chiffres')).toHaveValue('');
  });
});

describe('TwoFactorCard — actions sensibles', () => {
  /** The dialog duplicates the row label, so every assertion is scoped to it. */
  function dialog() {
    return within(screen.getByRole('dialog'));
  }

  it('turns the factor off only after a fresh code, and accepts a recovery one', async () => {
    mocked.status
      .mockResolvedValueOnce(ENABLED_STATUS)
      .mockResolvedValue(DISABLED_STATUS);
    mocked.disableTotp.mockResolvedValue({
      message: 'Vérification en deux étapes désactivée.',
      mfa_method: 'totp',
      disabled: true,
    });

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Désactiver' })
    );

    expect(
      screen.getByText('Désactiver la vérification en deux étapes ?')
    ).toBeInTheDocument();

    const submit = dialog().getByRole('button', { name: 'Désactiver' });
    expect(submit).toBeDisabled();

    // Lower case in, upper case out: a recovery code is read from paper.
    const field = dialog().getByLabelText(
      "Code de l'application ou code de secours"
    );
    await userEvent.type(field, 'abcde-fghjk');
    expect(field).toHaveValue('ABCDE-FGHJK');
    expect(submit).toBeEnabled();

    await userEvent.click(submit);

    expect(mocked.disableTotp).toHaveBeenCalledWith('ABCDE-FGHJK');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(
      screen.getByText('Vérification en deux étapes désactivée.')
    ).toBeInTheDocument();
    // The refetched status has no factor left, so the row offers to enable one.
    expect(
      await screen.findByRole('button', { name: 'Activer' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Codes de secours')).not.toBeInTheDocument();
  });

  // BUG CATCH: a code shorter than six characters cannot be valid, and sending
  // it would spend one of the account's few attempts.
  it('never calls the API with a too-short code', async () => {
    mocked.status.mockResolvedValue(ENABLED_STATUS);

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Désactiver' })
    );
    await userEvent.type(
      dialog().getByLabelText("Code de l'application ou code de secours"),
      '12345{Enter}'
    );

    expect(mocked.disableTotp).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('replaces the recovery codes and shows the new ones once', async () => {
    mocked.status.mockResolvedValue(ENABLED_STATUS);
    mocked.regenerateRecoveryCodes.mockResolvedValue({
      message: 'Nouveaux codes.',
      mfa_method: 'totp',
      recovery_codes: ['11111-22222', '33333-44444'],
    });

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Régénérer' })
    );
    await userEvent.type(
      dialog().getByLabelText("Code de l'application ou code de secours"),
      '654321'
    );
    await userEvent.click(dialog().getByRole('button', { name: 'Régénérer' }));

    expect(mocked.regenerateRecoveryCodes).toHaveBeenCalledWith('654321');
    expect(await screen.findByText('11111-22222')).toBeInTheDocument();
    expect(screen.getByText('33333-44444')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Nouveaux codes de secours générés. Les anciens ne fonctionnent plus.'
      )
    ).toBeInTheDocument();
  });

  it('keeps the dialog open with safe copy when the code is refused', async () => {
    mocked.status.mockResolvedValue(ENABLED_STATUS);

    const refused = new AxiosError('Request failed');
    refused.response = {
      status: 422,
      statusText: '',
      data: {
        message: 'App\\Services\\Auth\\MfaService::assertRecoveryCode failed',
        code: 'MFA_INVALID_CODE',
      },
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    };
    mocked.disableTotp.mockRejectedValue(refused);

    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Désactiver' })
    );
    await userEvent.type(
      dialog().getByLabelText("Code de l'application ou code de secours"),
      '000000'
    );
    await userEvent.click(dialog().getByRole('button', { name: 'Désactiver' }));

    expect(
      await screen.findByText(
        'Code incorrect. Vérifiez le code puis réessayez.'
      )
    ).toBeInTheDocument();
    // Still open, and no backend internals on screen.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/MfaService/)).not.toBeInTheDocument();
  });
});
