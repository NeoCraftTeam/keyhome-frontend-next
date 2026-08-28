import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import PrivateOwnerNoteFields, {
  EMPTY_PRIVATE_OWNER_NOTE,
} from '@/components/owner/PrivateOwnerNoteFields';
import type { PrivateOwnerNote } from '@/services/owner/owner-ads.service';
import { lightTheme } from '@/theme/theme';

function renderFields(ui: React.ReactElement) {
  return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
}

/** Stateful wrapper so a real toggle re-renders the conditional fields. */
function Harness({ initial }: { initial: PrivateOwnerNote }) {
  const [value, setValue] = useState<PrivateOwnerNote>(initial);
  return <PrivateOwnerNoteFields value={value} onChange={setValue} />;
}

const DELEGATED_NOTE: PrivateOwnerNote = {
  ...EMPTY_PRIVATE_OWNER_NOTE,
  is_property_owner: false,
  owner_name: 'Jean Propriétaire',
};

describe('PrivateOwnerNoteFields', () => {
  it('hides the owner fields while the advertiser is the real owner', () => {
    renderFields(
      <PrivateOwnerNoteFields
        value={EMPTY_PRIVATE_OWNER_NOTE}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByLabelText('Je suis le propriétaire réel de ce bien')
    ).toBeChecked();
    expect(
      screen.queryByLabelText(/Nom du propriétaire réel/)
    ).not.toBeInTheDocument();
  });

  it('reveals the owner fields once the advertiser is not the owner', () => {
    renderFields(
      <PrivateOwnerNoteFields value={DELEGATED_NOTE} onChange={vi.fn()} />
    );

    expect(screen.getByLabelText(/Nom du propriétaire réel/)).toBeRequired();
    expect(screen.getByLabelText('Adresse')).toBeInTheDocument();
    expect(screen.getByLabelText('Téléphone')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute(
      'type',
      'email'
    );
    expect(screen.getByLabelText('Notes personnelles')).toBeInTheDocument();
  });

  it('flips is_property_owner off when the switch is toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderFields(
      <PrivateOwnerNoteFields
        value={EMPTY_PRIVATE_OWNER_NOTE}
        onChange={onChange}
      />
    );

    await user.click(
      screen.getByLabelText('Je suis le propriétaire réel de ce bien')
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ is_property_owner: false })
    );
  });

  it('surfaces the owner fields after a real toggle and captures the name', async () => {
    const user = userEvent.setup();
    renderFields(<Harness initial={EMPTY_PRIVATE_OWNER_NOTE} />);

    await user.click(
      screen.getByLabelText('Je suis le propriétaire réel de ce bien')
    );

    const nameField = screen.getByLabelText(/Nom du propriétaire réel/);
    await user.type(nameField, 'Awa Diop');
    expect(nameField).toHaveValue('Awa Diop');
  });

  it('shows the privacy hint only when requested', () => {
    const hint = /Visible uniquement par vous/;

    const { unmount } = renderFields(
      <PrivateOwnerNoteFields
        value={EMPTY_PRIVATE_OWNER_NOTE}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByText(hint)).not.toBeInTheDocument();
    unmount();

    renderFields(
      <PrivateOwnerNoteFields
        value={EMPTY_PRIVATE_OWNER_NOTE}
        onChange={vi.fn()}
        showPrivacyHint
      />
    );
    expect(screen.getByText(hint)).toBeInTheDocument();
  });
});
