'use client';

import PublicBioEditor from '@/components/owner/PublicBioEditor';
import QrCodeDialog from '@/components/owner/QrCodeDialog';
import PaymentHistoryTable from '@/components/payment/PaymentHistoryTable';
import SavedCardsManager from '@/components/payment/SavedCardsManager';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import PasskeyManager from '@/components/security/PasskeyManager';
import FadeIn from '@/components/ui/FadeIn';
import KhSnackbar from '@/components/ui/KhSnackbar';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import PasswordStrengthBar from '@/components/ui/PasswordStrengthBar';
import PhoneField from '@/components/ui/PhoneField';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { markdownLightToHtml } from '@/lib/markdown-light';
import {
  normalizePhoneLikeBackend,
  shouldSendPhoneNumberForUserUpdate,
} from '@/lib/profile-phone';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { surveysService } from '@/services/surveys.service';
import { usersService } from '@/services/users.service';
import { brandAgent, neutral, shadow, transition } from '@/theme/tokens';
import { City } from '@/types';
import {
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  PhotoCamera,
  QrCode2 as QrCodeIcon,
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
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const AvatarCropDialog = dynamic(
  () => import('@/components/ui/AvatarCropDialog'),
  { ssr: false }
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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

const primaryButtonSx = {
  textTransform: 'none' as const,
  fontWeight: 600,
  transition: transition.polish,
  '&:focus-visible': {
    outline: 'none',
    boxShadow: shadow.agentFocusRing,
  },
};

export default function OwnerProfilePage() {
  const { user, setUser, refreshUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [profileQrOpen, setProfileQrOpen] = useState(false);
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
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    queryKey: ['active-survey-owner', isAuthenticated],
    queryFn: () => surveysService.getActive(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: surveyAnsweredData, isLoading: isSurveyAnsweredLoading } =
    useQuery({
      queryKey: [
        'survey-has-answered-owner',
        activeSurvey?.id,
        isAuthenticated,
      ],
      queryFn: () => surveysService.hasAnswered(activeSurvey!.id),
      enabled: isAuthenticated && !!activeSurvey?.id,
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
  }, [user?.id, user?.city_id, user?.city_name, isEditing]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        message: "L'image ne doit pas dépasser 5 Mo.",
        severity: 'error',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!user) return;
    setCropDialogOpen(false);
    setCropImageSrc(null);

    const formData = new FormData();
    formData.append('avatar', blob, `avatar-${Date.now()}.jpg`);

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
    }
  };

  /**
   * Enters edit mode by snapshotting the user's current values into the form
   * state. Used by the "Modifier" button AND by double-click / click on the
   * bio panel in read mode (Notion / Trello-style inline editing).
   */
  const enterEditMode = useCallback(() => {
    if (!user) {
      return;
    }
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
  }, [user]);

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

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/owner/dashboard' },
          { label: 'Mon profil' },
        ]}
      />
      {/* En-tête — aligné sur le profil client */}
      <FadeIn delay={0.1} direction="up">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
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
                  color: neutral.white,
                  width: 28,
                  height: 28,
                  transition: transition.polish,
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&:focus-visible': {
                    outline: 'none',
                    boxShadow: shadow.agentFocusRing,
                  },
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
            {!isEditing && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={enterEditMode}
                sx={{ textTransform: 'none', fontWeight: 600 }}
                size="medium"
              >
                Modifier
              </Button>
            )}
          </Box>
        </Paper>
      </FadeIn>

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
            {isEditing ? (
              <PublicBioEditor
                value={editForm.bio}
                onChange={(next) =>
                  setEditForm((prev) => ({ ...prev, bio: next }))
                }
                helperText="Visible par les locataires sur votre profil public — utilisez le gras / les listes pour structurer."
              />
            ) : (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Bio publique
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic' }}
                  >
                    Double-cliquez pour modifier
                  </Typography>
                </Box>
                {/* Inline editing: clicking (or double-clicking) anywhere on
                    the read-only bio surface enters edit mode. The user
                    expects this Notion / Trello pattern — without it, the
                    only path was the top-right "Modifier" button, which felt
                    disconnected from the bio they wanted to update. */}
                <Box
                  role="button"
                  tabIndex={0}
                  aria-label="Modifier la bio publique"
                  onClick={enterEditMode}
                  onDoubleClick={enterEditMode}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      enterEditMode();
                    }
                  }}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    minHeight: 80,
                    color: user.bio ? 'text.primary' : 'text.disabled',
                    bgcolor: 'background.default',
                    cursor: 'text',
                    transition: transition.polish,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: alpha(brandAgent.primary, 0.03),
                    },
                    '&:focus-visible': {
                      outline: 'none',
                      borderColor: 'primary.main',
                      boxShadow: shadow.agentFocusRing,
                    },
                    '& p': { my: 0.75 },
                    '& h3': { mt: 1, mb: 0.5, fontSize: '1rem' },
                    '& ul, & ol': { my: 0.75, pl: 3 },
                    '& a': { color: 'primary.main' },
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      markdownLightToHtml(user.bio) ||
                      '<p>Aucune bio renseignée. Cliquez ici pour en ajouter une.</p>',
                  }}
                />
              </Box>
            )}
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

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            QR code & carte de visite
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Partagez votre profil public : lien tracké, PNG et PDF prêts à
            imprimer.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={() => setProfileQrOpen(true)}
            sx={primaryButtonSx}
          >
            Ouvrir
          </Button>
        </Paper>

        {isEditing && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={
                isSaving ? (
                  <CircularProgress size={16} sx={{ color: neutral.white }} />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={handleSaveProfile}
              disabled={isSaving}
              sx={primaryButtonSx}
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
        <SavedCardsManager
          accent={brandAgent.primary}
          accentHover={brandAgent.primaryDark}
        />
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Historique des paiements
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Retrouvez ici toutes vos transactions de crédits.
          </Typography>
          <PaymentHistoryTable />
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <PasskeyManager variant="owner" />

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
          <PasswordStrengthBar password={passwordForm.new_password} />
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
            sx={primaryButtonSx}
          >
            {isChangingPassword ? (
              <CircularProgress size={20} sx={{ color: neutral.white }} />
            ) : (
              'Modifier le mot de passe'
            )}
          </Button>
        </Box>

        {/* Danger zone — Delete account */}
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'error.200',
          }}
        >
          <Typography
            variant="subtitle2"
            color="error"
            fontWeight={700}
            sx={{ mb: 0.5 }}
          >
            Zone de danger
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            La suppression de votre compte est définitive. Toutes vos annonces,
            favoris et données seront supprimés.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setShowDeleteModal(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Supprimer mon compte
          </Button>
        </Box>

        <DeleteAccountModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
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
              sx={{ ...primaryButtonSx, fontWeight: 700 }}
            >
              Répondre au sondage
            </Button>
          </Paper>
        )}
      </TabPanel>

      {cropImageSrc && (
        <AvatarCropDialog
          open={cropDialogOpen}
          imageSrc={cropImageSrc}
          onClose={() => {
            setCropDialogOpen(false);
            setCropImageSrc(null);
          }}
          onConfirm={handleCropConfirm}
        />
      )}

      <QrCodeDialog
        open={profileQrOpen}
        onClose={() => setProfileQrOpen(false)}
        variant="profile"
      />

      <KhSnackbar
        open={!!snackbar}
        message={snackbar?.message ?? null}
        severity={snackbar?.severity ?? 'info'}
        onClose={() => setSnackbar(null)}
      />
    </Container>
  );
}
