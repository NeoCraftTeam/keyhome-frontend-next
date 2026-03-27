'use client';

import PaymentHistoryTable from '@/components/payment/PaymentHistoryTable';
import FadeIn from '@/components/ui/FadeIn';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import PhoneField from '@/components/ui/PhoneField';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  normalizePhoneLikeBackend,
  shouldSendPhoneNumberForUserUpdate,
} from '@/lib/profile-phone';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { surveysService } from '@/services/surveys.service';
import { usersService } from '@/services/users.service';
import { City } from '@/types';
import {
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  OpenInNew as OpenInNewIcon,
  PhotoCamera,
  ReceiptLong as ReceiptLongIcon,
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) {
    score += 25;
  }
  if (/[A-Z]/.test(password)) {
    score += 25;
  }
  if (/[0-9]/.test(password)) {
    score += 25;
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 25;
  }
  if (score <= 25) {
    return { score, label: 'Faible', color: '#d32f2f' };
  }
  if (score <= 50) {
    return { score, label: 'Moyen', color: '#ed6c02' };
  }
  if (score <= 75) {
    return { score, label: 'Bon', color: '#2e7d32' };
  }
  return { score, label: 'Excellent', color: '#1b5e20' };
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/** Boutons principaux : dégradé teal (thème bailleur) */
const primaryGradientSx = {
  textTransform: 'none' as const,
  fontWeight: 600,
  background: 'linear-gradient(to right, #0d9488, #0f766e)',
  '&:hover': { background: 'linear-gradient(to right, #0f766e, #115e59)' },
  '&:active': { transform: 'scale(0.97)' },
};

export default function OwnerProfilePage() {
  const { user, setUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstname: user?.firstname ?? '',
    lastname: user?.lastname ?? '',
    phone_number: user?.phone_number ?? '',
    phone_is_whatsapp: user?.phone_is_whatsapp ?? false,
    bio: user?.bio ?? '',
  });
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState(user?.city_name ?? '');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['owner-profile-cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();

  const { data: activeSurvey, isLoading: isSurveyLoading } = useQuery({
    queryKey: ['active-survey'],
    queryFn: () => surveysService.getActive(),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const { data: surveyAnsweredData, isLoading: isSurveyAnsweredLoading } =
    useQuery({
      queryKey: ['survey-has-answered', activeSurvey?.id],
      queryFn: () => surveysService.hasAnswered(activeSurvey!.id),
      enabled: !!activeSurvey?.id,
      staleTime: 5 * 60 * 1000,
    });

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.city_name) {
      setCityInput(user.city_name);
    }
    if (user.city_id && user.city_name && !isEditing) {
      setSelectedCity({ id: user.city_id, name: user.city_name });
    }
    if (!isEditing) {
      setEditForm({
        firstname: user.firstname ?? '',
        lastname: user.lastname ?? '',
        phone_number: user.phone_number ?? '',
        phone_is_whatsapp: user.phone_is_whatsapp ?? false,
        bio: user.bio ?? '',
      });
    }
  }, [
    user?.id,
    user?.phone_is_whatsapp,
    user?.firstname,
    user?.lastname,
    user?.phone_number,
    user?.bio,
    user?.city_id,
    user?.city_name,
    isEditing,
  ]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setSnackbar({
        message: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.',
        severity: 'error',
      });
      e.target.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setSnackbar({
        message: "L'image ne doit pas dépasser 20 Mo.",
        severity: 'error',
      });
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const updated = await usersService.update(user.id, formData);
      setUser({ ...user, ...updated });
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setSnackbar({
        message: 'Photo de profil mise à jour',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        message: getSafeErrorMessage(
          err,
          'Erreur lors de la mise à jour de la photo'
        ),
        severity: 'error',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstname', editForm.firstname);
      formData.append('lastname', editForm.lastname);
      if (shouldSendPhoneNumberForUserUpdate(editForm.phone_number)) {
        formData.append(
          'phone_number',
          normalizePhoneLikeBackend(editForm.phone_number)
        );
      }
      formData.append(
        'phone_is_whatsapp',
        editForm.phone_is_whatsapp ? '1' : '0'
      );
      formData.append('bio', editForm.bio);
      if (selectedCity) {
        formData.append('city_id', selectedCity.id);
      }

      const updated = await usersService.update(user.id, formData);
      const cityName =
        selectedCity?.name ?? updated.city_name ?? user.city_name;
      setUser({ ...user, ...updated, city_name: cityName });
      if (selectedCity) {
        setCityInput(selectedCity.name);
      }
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setSnackbar({
        message: 'Profil mis à jour avec succès.',
        severity: 'success',
      });
      setIsEditing(false);
    } catch (err) {
      setSnackbar({
        message: getSafeErrorMessage(err, 'Erreur lors de la mise à jour.'),
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      const res = await authService.updatePassword(passwordForm);
      setSnackbar({
        message: res.message || 'Mot de passe modifié avec succès.',
        severity: 'success',
      });
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err) {
      setSnackbar({
        message: getSafeErrorMessage(
          err,
          'Erreur lors du changement de mot de passe.'
        ),
        severity: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  const cities = citiesData?.data ?? [];

  const profileSteps = [
    { label: 'Photo de profil', done: !!user.avatar },
    { label: 'Prénom & Nom', done: !!(user.firstname && user.lastname) },
    {
      label: 'Bio / Présentation',
      done: !!(user.bio && user.bio.trim().length > 10),
    },
    { label: 'Numéro de téléphone', done: !!user.phone_number },
    { label: 'Ville', done: !!user.city_id },
  ];
  const profileScore = Math.round(
    (profileSteps.filter((s) => s.done).length / profileSteps.length) * 100
  );
  const profileColor =
    profileScore < 40
      ? 'error.main'
      : profileScore < 80
        ? 'warning.main'
        : 'success.main';

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/owner/dashboard' },
          { label: 'Mon profil' },
        ]}
      />

      {/* ── Header ── */}
      <FadeIn delay={0.1} direction="up">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 2, md: 3 },
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={user.avatar || undefined}
                sx={{
                  width: { xs: 64, md: 80 },
                  height: { xs: 64, md: 80 },
                  fontSize: '2rem',
                }}
              >
                {user.firstname?.[0]}
              </Avatar>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleAvatarUpload}
              />
              <IconButton
                size="small"
                aria-label="Changer la photo de profil"
                onClick={() => avatarInputRef.current?.click()}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <PhotoCamera sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
              >
                {user.firstname} {user.lastname}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              {user.username && (
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<OpenInNewIcon />}
                  href={`/bailleurs/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Voir mon profil public
                </Button>
              )}
              {!isEditing && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  size="medium"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                  onClick={() => {
                    setCityInput(user.city_name || '');
                    setEditForm({
                      firstname: user.firstname,
                      lastname: user.lastname,
                      phone_number: user.phone_number || '',
                      phone_is_whatsapp: user.phone_is_whatsapp ?? false,
                      bio: user.bio ?? '',
                    });
                    setSelectedCity(
                      user.city_id && user.city_name
                        ? { id: user.city_id, name: user.city_name }
                        : null
                    );
                    setIsEditing(true);
                  }}
                >
                  Modifier
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </FadeIn>

      {/* ── Profile Completion Card ── */}
      {profileScore < 100 && (
        <FadeIn delay={0.15} direction="up">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Complétude du profil public
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Un profil complet inspire plus de confiance aux locataires.
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 56 }}>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ color: profileColor, lineHeight: 1 }}
                >
                  {profileScore}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  complété
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={profileScore}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'action.selected',
                mb: 2,
                '& .MuiLinearProgress-bar': {
                  bgcolor: profileColor,
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {profileSteps.map((step) => (
                <Tooltip
                  key={step.label}
                  title={
                    step.done
                      ? 'Complété'
                      : 'À compléter — cliquez sur Modifier'
                  }
                  arrow
                >
                  <Chip
                    label={step.label}
                    size="small"
                    variant={step.done ? 'filled' : 'outlined'}
                    color={step.done ? 'success' : 'default'}
                    sx={{
                      borderRadius: '20px',
                      fontWeight: step.done ? 600 : 400,
                      opacity: step.done ? 1 : 0.7,
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Paper>
        </FadeIn>
      )}

      {/* ── Tabs ── */}
      <FadeIn delay={0.2} direction="up">
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 48,
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 48,
            },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab
            icon={<EditIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Informations"
          />
          <Tab
            icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Paiements"
          />
          <Tab
            icon={<LockIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Sécurité"
          />
          <Tab
            icon={<AssignmentIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Sondage"
          />
        </Tabs>
      </FadeIn>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Prénom"
              value={isEditing ? editForm.firstname : user.firstname}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, firstname: e.target.value }))
              }
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nom"
              value={isEditing ? editForm.lastname : user.lastname}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, lastname: e.target.value }))
              }
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              value={user.email}
              disabled
              helperText="L'email ne peut pas être modifié"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PhoneField
              value={
                isEditing ? editForm.phone_number : user.phone_number || ''
              }
              onChange={(val) =>
                setEditForm((prev) => ({ ...prev, phone_number: val }))
              }
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {isEditing ? (
              <Autocomplete
                options={cities}
                getOptionLabel={(opt) => opt.name}
                value={selectedCity}
                onChange={(_, val) => {
                  setSelectedCity(val);
                  setCityDropdownOpen(false);
                }}
                inputValue={cityInput}
                onInputChange={(_, val, reason) => {
                  if (reason !== 'reset') {
                    setCityInput(val);
                    setCityDropdownOpen(val.length >= 1);
                  }
                }}
                onClose={() => setCityDropdownOpen(false)}
                open={
                  cityDropdownOpen &&
                  cityInput.length >= 1 &&
                  !isCitiesLoading &&
                  cities.length > 0
                }
                filterOptions={(x) => x}
                loading={isCitiesLoading}
                noOptionsText="Aucune ville trouvée"
                slotProps={citySlotProps}
                renderOption={(props, option) =>
                  renderCityOption(props, option)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ville"
                    placeholder="Rechercher une ville..."
                    sx={cityInputSx}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isCitiesLoading ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            ) : (
              <TextField
                fullWidth
                label="Ville"
                value={user.city_name || 'Non définie'}
                disabled
              />
            )}
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Bio / Présentation"
              multiline
              rows={3}
              value={isEditing ? editForm.bio : user.bio || ''}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, bio: e.target.value }))
              }
              disabled={!isEditing}
              placeholder="Décrivez-vous en quelques mots : votre expérience, vos logements, votre zone géographique..."
              helperText={
                isEditing ? `${editForm.bio.length}/500 caractères` : ''
              }
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
          </Grid>
          {isEditing && (
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editForm.phone_is_whatsapp}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        phone_is_whatsapp: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Ce numéro est disponible sur WhatsApp
                  </Typography>
                }
              />
            </Grid>
          )}
        </Grid>

        {isEditing && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={
                isSaving ? (
                  <CircularProgress size={16} sx={{ color: '#fff' }} />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={handleSaveProfile}
              disabled={isSaving}
              sx={primaryGradientSx}
            >
              Sauvegarder
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => {
                setIsEditing(false);
                setEditForm({
                  firstname: user.firstname,
                  lastname: user.lastname,
                  phone_number: user.phone_number || '',
                  phone_is_whatsapp: user.phone_is_whatsapp ?? false,
                  bio: user.bio ?? '',
                });
                setCityInput(user.city_name || '');
                setSelectedCity(
                  user.city_id && user.city_name
                    ? { id: user.city_id, name: user.city_name }
                    : null
                );
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Annuler
            </Button>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Historique des paiements
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Retrouvez ici toutes vos transactions de crédits.
        </Typography>
        <PaymentHistoryTable perPage={10} />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Changer le mot de passe
        </Typography>
        <Box sx={{ maxWidth: 420 }}>
          <TextField
            fullWidth
            label="Mot de passe actuel"
            type={showCurrentPassword ? 'text' : 'password'}
            value={passwordForm.current_password}
            onChange={(e) =>
              setPasswordForm((p) => ({
                ...p,
                current_password: e.target.value,
              }))
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      edge="end"
                      size="small"
                      aria-label={
                        showCurrentPassword
                          ? 'Masquer le mot de passe'
                          : 'Afficher le mot de passe'
                      }
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Nouveau mot de passe"
            type={showNewPassword ? 'text' : 'password'}
            value={passwordForm.new_password}
            onChange={(e) =>
              setPasswordForm((p) => ({ ...p, new_password: e.target.value }))
            }
            helperText="Minimum 8 caractères"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      size="small"
                      aria-label={
                        showNewPassword
                          ? 'Masquer le mot de passe'
                          : 'Afficher le mot de passe'
                      }
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: passwordForm.new_password ? 1 : 2 }}
          />
          {passwordForm.new_password.length > 0 &&
            (() => {
              const strength = getPasswordStrength(passwordForm.new_password);
              return (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={strength.score}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: strength.color,
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: strength.color,
                      fontWeight: 600,
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    Force : {strength.label}
                  </Typography>
                </Box>
              );
            })()}
          <TextField
            fullWidth
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={passwordForm.new_password_confirmation}
            onChange={(e) =>
              setPasswordForm((p) => ({
                ...p,
                new_password_confirmation: e.target.value,
              }))
            }
            error={
              passwordForm.new_password_confirmation.length > 0 &&
              passwordForm.new_password !==
                passwordForm.new_password_confirmation
            }
            helperText={
              passwordForm.new_password_confirmation.length > 0 &&
              passwordForm.new_password !==
                passwordForm.new_password_confirmation
                ? 'Les mots de passe ne correspondent pas'
                : ''
            }
            sx={{ mb: 3 }}
          />
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={
              isChangingPassword ||
              !passwordForm.current_password ||
              passwordForm.new_password.length < 8 ||
              passwordForm.new_password !==
                passwordForm.new_password_confirmation
            }
            sx={primaryGradientSx}
          >
            {isChangingPassword ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : (
              'Modifier le mot de passe'
            )}
          </Button>
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Sondage de satisfaction
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Partagez votre expérience KeyHome en répondant à notre sondage.
        </Typography>

        {isSurveyLoading || isSurveyAnsweredLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !activeSurvey ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Aucun sondage en cours pour le moment. Revenez bientôt&nbsp;!
          </Alert>
        ) : surveyAnsweredData?.has_answered ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              gap: 2,
              bgcolor: 'success.50',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'success.200',
            }}
          >
            <CheckCircleOutlineIcon
              sx={{ fontSize: 56, color: 'success.main' }}
            />
            <Typography variant="h6" fontWeight={700} color="success.dark">
              Merci pour votre participation&nbsp;!
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              maxWidth={420}
            >
              Vous avez déjà répondu au sondage{' '}
              <strong>«&nbsp;{activeSurvey.title}&nbsp;»</strong>.
            </Typography>
          </Box>
        ) : (
          <Paper
            variant="outlined"
            sx={{ p: 3, borderRadius: 3, maxWidth: 520 }}
          >
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {activeSurvey.title}
            </Typography>
            {activeSurvey.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {activeSurvey.description}
              </Typography>
            )}
            <Button
              variant="contained"
              size="large"
              startIcon={<AssignmentIcon />}
              onClick={() => router.push(`/sondage/${activeSurvey.id}`)}
              sx={{ ...primaryGradientSx, fontWeight: 700 }}
            >
              Répondre au sondage
            </Button>
          </Paper>
        )}
      </TabPanel>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3500}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert
            onClose={() => setSnackbar(null)}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
