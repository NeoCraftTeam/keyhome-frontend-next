'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LockOpen as LockOpenIcon } from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Grid,
  Avatar,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  IconButton,
  InputAdornment,
  Snackbar,
  Autocomplete,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff,
  Favorite as FavoriteIcon,
  Lock as LockIcon,
  PhotoCamera,
} from '@mui/icons-material';
import { useAuth } from '@/providers/AuthProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { authService } from '@/services/auth.service';
import { usersService, unlockedAdsService } from '@/services/users.service';
import { citiesService } from '@/services/cities.service';
import { UserRole, City } from '@/types';
import { getSafeErrorMessage } from '@/lib/error-messages';
import AdCard from '@/components/ads/AdCard';
import FadeIn from '@/components/ui/FadeIn';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Unlocked ads
  const { data: unlockedAds = [], isLoading: isLoadingUnlocked } = useQuery({
    queryKey: ['unlocked-ads'],
    queryFn: () => unlockedAdsService.list(),
    staleTime: 2 * 60 * 1000,
  });

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Cities for autocomplete
  const { data: citiesData } = useQuery({
    queryKey: ['cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput || undefined }),
    staleTime: 5 * 60 * 1000,
  });


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const updated = await usersService.update(user.id, formData);
      setUser({ ...user, ...updated });
      await refreshUser();
      setSnackbar('Avatar mis à jour');
    } catch {
      setSnackbar('Erreur lors de la mise à jour de l\'avatar');
    }
  };

  const handleSaveProfile = async () => {
    setEditError('');
    setEditSuccess('');
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstname', editForm.firstname);
      formData.append('lastname', editForm.lastname);
      formData.append('phone_number', editForm.phone_number);
      if (selectedCity) {
        formData.append('city_id', selectedCity.id);
      }

      const updated = await usersService.update(user!.id, formData);
      setUser({ ...user!, ...updated });
      setEditSuccess('Profil mis à jour avec succès.');
      setIsEditing(false);
    } catch (err) {
      setEditError(getSafeErrorMessage(err, 'Erreur lors de la mise à jour.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);
    try {
      const res = await authService.updatePassword(passwordForm);
      setPasswordSuccess(res.message || 'Mot de passe modifié avec succès.');
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      setPasswordError(getSafeErrorMessage(err, 'Erreur lors du changement de mot de passe.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  const cities = citiesData?.data || [];

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
              accept="image/*"
              hidden
              onChange={handleAvatarUpload}
            />
            <IconButton
              size="small"
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
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
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
            </Box>
          </Box>
          {!isEditing && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
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
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minHeight: 48 },
        }}
      >
        <Tab icon={<EditIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Informations" />
        <Tab icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Favoris (${favorites.length})`} />
        <Tab icon={<LockOpenIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Déverrouillées (${unlockedAds.length})`} />
        <Tab icon={<LockIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Sécurité" />
      </Tabs>
      </FadeIn>

      {/* Tab 0: Profile info */}
      <TabPanel value={tab} index={0}>
        {editError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{editError}</Alert>}
        {editSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{editSuccess}</Alert>}

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
            <TextField
              fullWidth
              label="Téléphone"
              value={isEditing ? editForm.phone_number : user.phone_number || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone_number: e.target.value }))}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {isEditing ? (
              <Autocomplete
                options={cities}
                getOptionLabel={(opt) => opt.name}
                value={selectedCity}
                onChange={(_, val) => setSelectedCity(val)}
                inputValue={cityInput}
                onInputChange={(_, val) => setCityInput(val)}
                noOptionsText="Aucune ville"
                renderInput={(params) => <TextField {...params} label="Ville" />}
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
                borderRadius: 2,
                textTransform: 'none',
                background: 'linear-gradient(to right, #F6475F, #D93A50)',
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
              sx={{ borderRadius: 2, textTransform: 'none' }}
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

      {/* Tab 2: Unlocked ads */}
      <TabPanel value={tab} index={2}>
        {isLoadingUnlocked ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : unlockedAds.length === 0 ? (
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

      {/* Tab 3: Security (password) */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Changer le mot de passe
        </Typography>

        {passwordError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{passwordError}</Alert>}
        {passwordSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{passwordSuccess}</Alert>}

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
                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" size="small">
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
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />
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
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(to right, #F6475F, #D93A50)',
              '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
            }}
          >
            {isChangingPassword ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Modifier le mot de passe'}
          </Button>
        </Box>
      </TabPanel>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2500}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
