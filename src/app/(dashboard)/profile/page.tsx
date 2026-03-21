'use client';

import AdCard from '@/components/ads/AdCard';
import PaymentHistoryTable from '@/components/payment/PaymentHistoryTable';
import FadeIn from '@/components/ui/FadeIn';
import PhoneField from '@/components/ui/PhoneField';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { normalizePhoneLikeBackend, shouldSendPhoneNumberForUserUpdate } from '@/lib/profile-phone';
import { useAuth } from '@/providers/AuthProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { surveysService } from '@/services/surveys.service';
import { unlockedAdsService, usersService } from '@/services/users.service';
import { City } from '@/types';
import {
    Assignment as AssignmentIcon,
    Cancel as CancelIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    Edit as EditIcon,
    Favorite as FavoriteIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
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
    CircularProgress,
    Container,
    Grid,
    IconButton,
    InputAdornment,
    LinearProgress,
    Paper,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) { score += 25; }
  if (/[A-Z]/.test(password)) { score += 25; }
  if (/[0-9]/.test(password)) { score += 25; }
  if (/[^A-Za-z0-9]/.test(password)) { score += 25; }
  if (score <= 25) { return { score, label: 'Faible', color: '#d32f2f' }; }
  if (score <= 50) { return { score, label: 'Moyen', color: '#ed6c02' }; }
  if (score <= 75) { return { score, label: 'Bon', color: '#2e7d32' }; }
  return { score, label: 'Excellent', color: '#1b5e20' };
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth();
  const { favorites } = useFavorites();
  const [tab, setTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    phone_number: user?.phone_number || '',
  });
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState(user?.city_name || '');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Connected OAuth accounts (Clerk)
  const [linkedAccountsLoading, setLinkedAccountsLoading] = useState<string | null>(null);

  // Cities for autocomplete — server-side search
  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const router = useRouter();
  const { slotProps: citySlotProps, renderOption: renderCityOption, inputSx: cityInputSx } = useCityAutocompleteConfig();

  // Active survey + has-answered check
  const { data: activeSurvey, isLoading: isSurveyLoading } = useQuery({
    queryKey: ['active-survey'],
    queryFn: () => surveysService.getActive(),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const { data: surveyAnsweredData, isLoading: isSurveyAnsweredLoading } = useQuery({
    queryKey: ['survey-has-answered', activeSurvey?.id],
    queryFn: () => surveysService.hasAnswered(activeSurvey!.id),
    enabled: !!activeSurvey?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: unlockedAds = [] } = useQuery({
    queryKey: ['unlocked-ads'],
    queryFn: () => unlockedAdsService.list(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });


  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) { return; }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setSnackbar({ message: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.', severity: 'error' });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ message: 'L\'image ne doit pas dépasser 5 Mo.', severity: 'error' });
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const updated = await usersService.update(user.id, formData);
      setUser({ ...user, ...updated });
      await refreshUser();
      setSnackbar({ message: 'Avatar mis à jour', severity: 'success' });
    } catch {
      setSnackbar({ message: 'Erreur lors de la mise à jour de l\'avatar', severity: 'error' });
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstname', editForm.firstname);
      formData.append('lastname', editForm.lastname);
      if (shouldSendPhoneNumberForUserUpdate(editForm.phone_number)) {
        formData.append('phone_number', normalizePhoneLikeBackend(editForm.phone_number));
      }
      if (selectedCity) {
        formData.append('city_id', selectedCity.id);
      }

      const updated = await usersService.update(user!.id, formData);
      // Merge city_name from selected city as fallback if the API doesn't return it loaded
      const cityName = selectedCity?.name ?? updated.city_name ?? user!.city_name;
      setUser({ ...user!, ...updated, city_name: cityName });
      if (selectedCity) {
        setCityInput(selectedCity.name);
      }
      await refreshUser();
      setSnackbar({ message: 'Profil mis à jour avec succès.', severity: 'success' });
      setIsEditing(false);
    } catch (err) {
      setSnackbar({ message: getSafeErrorMessage(err, 'Erreur lors de la mise à jour.'), severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      const res = await authService.updatePassword(passwordForm);
      setSnackbar({ message: res.message || 'Mot de passe modifié avec succès.', severity: 'success' });
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      setSnackbar({ message: getSafeErrorMessage(err, 'Erreur lors du changement de mot de passe.'), severity: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  const cities = citiesData?.data || [];

  // Sync city state when user loads (e.g. after refresh) so "Ville" displays correctly
  useEffect(() => {
    if (!user) return;
    if (user.city_name) {
      setCityInput(user.city_name);
    }
    if (user.city_id && user.city_name && !isEditing) {
      setSelectedCity({ id: user.city_id, name: user.city_name });
    }
  }, [user?.id, user?.city_id, user?.city_name, isEditing]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Profile header */}
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
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user.avatar || undefined}
              sx={{ width: { xs: 64, md: 80 }, height: { xs: 64, md: 80 }, fontSize: '2rem' }}
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
            <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              {user.firstname} {user.lastname}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
           {/*  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {user.role && (
                <Chip
                  label={
                    user.role === UserRole.ADMIN
                      ? 'Administrateur'
                      : user.role === UserRole.AGENT
                        ? 'Agent'
                        : 'Client'
                  }
                  size="small"
                  color={user.role === UserRole.ADMIN ? 'error' : 'primary'}
                  variant="outlined"
                />
              )}
              {user.city_name && <Chip label={user.city_name} size="small" variant="outlined" />}
            </Box> */}
          </Box>
          {!isEditing && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                setCityInput(user.city_name || '');
                setEditForm({
                  firstname: user.firstname,
                  lastname: user.lastname,
                  phone_number: user.phone_number || '',
                });
                setSelectedCity(
                  user.city_id && user.city_name
                    ? { id: user.city_id, name: user.city_name }
                    : null
                );
                setIsEditing(true);
              }}
              sx={{ textTransform: 'none' }}
              size="medium"
            >
              Modifier
            </Button>
          )}
        </Box>
      </Paper>
      </FadeIn>

      {/* Tabs */}
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
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minHeight: 48 },
          '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
        }}
      >
        <Tab icon={<EditIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Informations" />
        <Tab icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Favoris (${favorites.length})`} />
        <Tab icon={<LockOpenIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Déverrouillées (${unlockedAds.length})`} />
        <Tab icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Paiements" />
        <Tab icon={<LockIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Sécurité" />
        <Tab icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Sondage" />
      </Tabs>
      </FadeIn>

      {/* Tab 0: Profile info */}
      <TabPanel value={tab} index={0}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Prénom"
              value={isEditing ? editForm.firstname : user.firstname}
              onChange={(e) => setEditForm((prev) => ({ ...prev, firstname: e.target.value }))}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nom"
              value={isEditing ? editForm.lastname : user.lastname}
              onChange={(e) => setEditForm((prev) => ({ ...prev, lastname: e.target.value }))}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Email" value={user.email} disabled helperText="L'email ne peut pas être modifié" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PhoneField
              value={isEditing ? editForm.phone_number : user.phone_number || ''}
              onChange={(val) => setEditForm((prev) => ({ ...prev, phone_number: val }))}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {isEditing ? (
              <Autocomplete
                options={cities}
                getOptionLabel={(opt) => opt.name}
                value={selectedCity}
                onChange={(_, val) => { setSelectedCity(val); setCityDropdownOpen(false); }}
                inputValue={cityInput}
                onInputChange={(_, val, reason) => { if (reason !== 'reset') { setCityInput(val); setCityDropdownOpen(val.length >= 1); } }}
                onClose={() => setCityDropdownOpen(false)}
                open={cityDropdownOpen && cityInput.length >= 1 && !isCitiesLoading && cities.length > 0}
                filterOptions={(x) => x}
                loading={isCitiesLoading}
                noOptionsText="Aucune ville trouvée"
                slotProps={citySlotProps}
                renderOption={(props, option) => renderCityOption(props, option)}
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
                            {isCitiesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            ) : (
              <TextField fullWidth label="Ville" value={user.city_name || 'Non définie'} disabled />
            )}
          </Grid>
        </Grid>

        {isEditing && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSaveProfile}
              disabled={isSaving}
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(to right, #F6475F, #D93A50)',
                '&:active': { transform: 'scale(0.97)' },
              }}
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
                });
                setCityInput(user.city_name || '');
                setSelectedCity(null);
              }}
              sx={{ textTransform: 'none' }}
            >
              Annuler
            </Button>
          </Box>
        )}
      </TabPanel>

      {/* Tab 1: Favorites */}
      <TabPanel value={tab} index={1}>
        {favorites.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <FavoriteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Aucun favori
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Ajoutez des annonces en favoris en cliquant sur le coeur
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {favorites.map((ad) => (
              <Grid key={ad.id} size={{ xs: 6, sm: 6, md: 4 }}>
                <AdCard ad={ad} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Tab 2: Unlocked Ads */}
      <TabPanel value={tab} index={2}>
        {unlockedAds.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <LockOpenIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Aucune annonce déverrouillée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Les annonces que vous déverrouillez apparaîtront ici
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {unlockedAds.map((ad) => (
              <Grid key={ad.id} size={{ xs: 6, sm: 6, md: 4 }}>
                <AdCard ad={ad} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Tab 3: Payment History */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Historique des paiements
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Retrouvez ici toutes vos transactions de crédits.
        </Typography>
        <PaymentHistoryTable perPage={10} />
      </TabPanel>

      {/* Tab 4: Security (password) */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Changer le mot de passe
        </Typography>

        <Box sx={{ maxWidth: 420 }}>
          <TextField
            fullWidth
            label="Mot de passe actuel"
            type={showCurrentPassword ? 'text' : 'password'}
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" size="small" aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
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
            onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
            helperText="Minimum 8 caractères"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small" aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: passwordForm.new_password ? 1 : 2 }}
          />
          {passwordForm.new_password.length > 0 && (() => {
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
                <Typography variant="caption" sx={{ color: strength.color, fontWeight: 600, mt: 0.5, display: 'block' }}>
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
            onChange={(e) => setPasswordForm((p) => ({ ...p, new_password_confirmation: e.target.value }))}
            error={
              passwordForm.new_password_confirmation.length > 0 &&
              passwordForm.new_password !== passwordForm.new_password_confirmation
            }
            helperText={
              passwordForm.new_password_confirmation.length > 0 &&
              passwordForm.new_password !== passwordForm.new_password_confirmation
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
              passwordForm.new_password !== passwordForm.new_password_confirmation
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(to right, #F6475F, #D93A50)',
              '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
              '&:active': { transform: 'scale(0.97)' },
            }}
          >
            {isChangingPassword ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Modifier le mot de passe'}
          </Button>
        </Box>
      </TabPanel>

      {/* Tab 5: Sondage */}
      <TabPanel value={tab} index={5}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Sondage de satisfaction
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Partagez votre expérience KeyHome en répondant à notre sondage.
        </Typography>

        {(isSurveyLoading || isSurveyAnsweredLoading) ? (
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
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main' }} />
            <Typography variant="h6" fontWeight={700} color="success.dark">
              Merci pour votre participation&nbsp;!
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={420}>
              Vous avez déjà répondu au sondage <strong>«&nbsp;{activeSurvey.title}&nbsp;»</strong>.
              Votre avis contribue à améliorer notre service.
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
              sx={{ textTransform: 'none', fontWeight: 700 }}
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
