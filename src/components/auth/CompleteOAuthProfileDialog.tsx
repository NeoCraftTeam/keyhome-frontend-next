'use client';

import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { User, UserRole } from '@/types';
import PhoneIcon from '@mui/icons-material/Phone';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { brand } from '@/theme/tokens';

interface City {
  id: string;
  name: string;
}

interface Prefill {
  firstname: string;
  lastname: string;
  email: string | null;
  avatar: string | null;
}

interface Props {
  open: boolean;
  prefill: Prefill;
  onComplete: (token: string, user: User) => void;
}

export default function CompleteOAuthProfileDialog({
  open,
  prefill,
  onComplete,
}: Props) {
  const muiTheme = useTheme();
  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput }),
    enabled: cityInput.length >= 1,
  });

  const cities: City[] = (citiesData?.data ?? []) as City[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) {
      setError('Le numéro de téléphone est obligatoire.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.completeClerkProfile({
        phone_number: phoneNumber.trim(),
        city_id: selectedCity?.id ?? null,
      });

      const { token, user, panel_sso_url } = result;

      // Filament SSO is for platform admins only; agents use the Next.js owner shell.
      if (panel_sso_url && user.role === UserRole.ADMIN) {
        if (!redirectToTrustedUrl(panel_sso_url)) {
          setError('Redirection refusée pour des raisons de sécurité.');
        }
        return;
      }

      onComplete(token, user);
    } catch (err: unknown) {
      setError(getSafeErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName =
    [prefill.firstname, prefill.lastname].filter(Boolean).join(' ') ||
    'Utilisateur';

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, p: 1 } }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            pt: 1,
          }}
        >
          <Avatar
            src={prefill.avatar ?? undefined}
            sx={{
              width: 64,
              height: 64,
              fontSize: 24,
              bgcolor: 'primary.main',
            }}
          >
            {displayName[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              Bienvenue, {prefill.firstname} !
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Complétez votre profil pour continuer
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {/* Phone number */}
          <TextField
            label="Numéro de téléphone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            type="tel"
            required
            autoFocus
            fullWidth
            placeholder="+225 07 00 00 00 00"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {/* City — optional */}
          <Autocomplete
            options={cities}
            getOptionLabel={(c) => c.name}
            value={selectedCity}
            onChange={(_, val) => setSelectedCity(val)}
            inputValue={cityInput}
            onInputChange={(_, val) => setCityInput(val)}
            open={
              cityDropdownOpen &&
              cityInput.length >= 1 &&
              !isCitiesLoading &&
              cities.length > 0
            }
            onOpen={() => setCityDropdownOpen(true)}
            onClose={() => setCityDropdownOpen(false)}
            loading={isCitiesLoading}
            noOptionsText="Aucune ville trouvée"
            slotProps={citySlotProps}
            renderOption={(props, option) => renderCityOption(props, option)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Ville (optionnel)"
                sx={cityInputSx}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isCitiesLoading ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{
              mt: 1,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              background: brand.primary,
              '&:hover': { background: brand.primaryHover },
            }}
          >
            {isSubmitting ? <ButtonSpinner size={22} /> : 'Créer mon compte'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
