'use client';

import type { SearchFiltersReturn } from '@/hooks/useSearchFilters';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { gradient } from '@/theme/tokens';
import type { City } from '@/types';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Slider,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { memo } from 'react';

interface Props {
  /** Full return value of useSearchFilters() — avoids threading 20+ individual props. */
  filters: SearchFiltersReturn;
  isMobile: boolean;
  /** Total result count — comes from useSearchResults, not from filters. */
  total: number;
  onClose: () => void;
  // Props from useCityAutocompleteConfig() that cannot live inside the hook call here
  // (hook must be called at SearchContent level for shared state).
  citySlotProps: ReturnType<typeof useCityAutocompleteConfig>['slotProps'];
  renderCityOption: (
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
    option: City
  ) => React.ReactNode;
}

/**
 * Content rendered inside the "more filters" Drawer on the search page.
 *
 * Extracted from page.tsx for readability — the parent <Drawer> wrapper and
 * open/close state remain in SearchContent.
 */
const SearchFiltersDrawerContent = memo(function SearchFiltersDrawerContent({
  filters,
  isMobile,
  total,
  onClose,
  citySlotProps,
  renderCityOption,
}: Props) {
  const {
    cities,
    isCitiesLoading,
    selectedCity,
    setSelectedCity,
    cityInput,
    setCityInput,
    adTypes,
    facets,
    selectedType,
    setSelectedType,
    priceRange,
    setPriceRange,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    surfaceRange,
    setSurfaceRange,
    hasParking,
    setHasParking,
    transactionType,
    setTransactionType,
    pricePeriod,
    setPricePeriod,
    has3dTour,
    setHas3dTour,
    propertyAttributes,
    selectedAmenities,
    setSelectedAmenities,
    setPage,
    clearFilters,
  } = filters;

  return (
    <Box sx={{ p: 3, width: isMobile ? '100%' : 380 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
        }}
      >
        <Typography variant="h6" component="h2" fontWeight={700}>
          Tous les filtres
        </Typography>
        <IconButton aria-label="Fermer" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* City */}
      <Autocomplete
        size="small"
        disablePortal
        options={cities}
        forcePopupIcon={false}
        getOptionLabel={(opt) => opt.name}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        value={selectedCity}
        onChange={(_, val) => {
          setSelectedCity(val);
          setCityInput(val?.name || '');
          setPage(1);
        }}
        inputValue={cityInput}
        onInputChange={(_, val, reason) => {
          if (reason !== 'reset') setCityInput(val);
        }}
        filterOptions={(x) => x}
        loading={isCitiesLoading}
        noOptionsText={
          cityInput.length < 1
            ? 'Tapez pour rechercher…'
            : 'Aucune ville trouvée'
        }
        slotProps={citySlotProps}
        renderOption={(props, option) => {
          const { key, ...restProps } = props as typeof props & {
            key?: React.Key;
          };
          const cityFacet = facets?.cities?.find(
            (c) => c.name.toLowerCase() === option.name.toLowerCase()
          );
          return (
            <li key={key ?? option.id} {...restProps}>
              <LocationOnIcon
                sx={{
                  fontSize: 15,
                  color: 'text.disabled',
                  mr: 0.75,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>{option.name}</span>
              {cityFacet && (
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--mui-palette-text-secondary)',
                    marginLeft: 8,
                  }}
                >
                  {cityFacet.count}
                </span>
              )}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Ville"
            placeholder="Rechercher une ville…"
            sx={{ mb: 2 }}
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

      {/* Property type */}
      <Autocomplete
        size="small"
        disablePortal
        options={adTypes || []}
        getOptionLabel={(opt) => opt.name}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        renderOption={(props, opt) => {
          const fc = facets?.types?.find(
            (t) => t.name.toLowerCase() === opt.name.toLowerCase()
          );
          return (
            <li {...props} key={opt.id}>
              <span style={{ flex: 1 }}>{opt.name}</span>
              {fc && (
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--mui-palette-text-secondary)',
                    marginLeft: 8,
                  }}
                >
                  {fc.count}
                </span>
              )}
            </li>
          );
        }}
        value={selectedType}
        onChange={(_, val) => {
          setSelectedType(val);
          setPage(1);
        }}
        noOptionsText="Aucun type"
        renderInput={(params) => (
          <TextField {...params} label="Type de bien" sx={{ mb: 2 }} />
        )}
      />

      {/* Transaction type */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Type de transaction
      </Typography>
      <ToggleButtonGroup
        value={transactionType}
        exclusive
        onChange={(_, val: 'location' | 'vente' | null) => {
          setTransactionType(val);
          setPage(1);
        }}
        size="small"
        color="primary"
        sx={{ mb: 2.5 }}
      >
        <ToggleButton value="location">À louer</ToggleButton>
        <ToggleButton value="vente">À vendre</ToggleButton>
      </ToggleButtonGroup>

      {/* Price */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Prix (FCFA)
      </Typography>
      <Slider
        value={priceRange}
        onChange={(_, val) => setPriceRange(val as [number, number])}
        onChangeCommitted={() => setPage(1)}
        min={0}
        max={5000000}
        step={50000}
        valueLabelDisplay="auto"
        valueLabelFormat={(val) => `${(val / 1000).toFixed(0)}k`}
        sx={{ mb: 0.5 }}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: transactionType === 'location' ? 1.5 : 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          0 FCFA
        </Typography>
        <Typography variant="caption" color="text.secondary">
          5 000 000 FCFA
        </Typography>
      </Box>

      {/* Price period — only relevant for rentals */}
      {transactionType === 'location' && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}
          >
            Période de facturation
          </Typography>
          <ToggleButtonGroup
            value={pricePeriod}
            exclusive
            onChange={(_, val: 'mois' | 'jour' | null) => {
              setPricePeriod(val);
              setPage(1);
            }}
            size="small"
            color="primary"
          >
            <ToggleButton value="mois">Par mois</ToggleButton>
            <ToggleButton value="jour">Par jour</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Bedrooms */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Chambres
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
        {[undefined, 1, 2, 3, 4, 5].map((val) => {
          const fc =
            val !== undefined
              ? facets?.bedrooms?.find((b) => b.value === val)
              : undefined;
          const label =
            val === undefined
              ? 'Tous'
              : fc
                ? `${val}+ (${fc.count})`
                : `${val}+`;
          return (
            <Chip
              key={val ?? 'all'}
              label={label}
              size="small"
              onClick={() => {
                setBedrooms(val);
                setPage(1);
              }}
              variant={bedrooms === val ? 'filled' : 'outlined'}
              sx={
                bedrooms === val
                  ? { bgcolor: 'primary.main', color: '#fff' }
                  : {}
              }
            />
          );
        })}
      </Box>

      {/* Bathrooms */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Salles de bain
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
        {[undefined, 1, 2, 3, 4].map((val) => (
          <Chip
            key={val ?? 'all'}
            label={val === undefined ? 'Tous' : `${val}+`}
            size="small"
            onClick={() => {
              setBathrooms(val);
              setPage(1);
            }}
            variant={bathrooms === val ? 'filled' : 'outlined'}
            sx={
              bathrooms === val
                ? { bgcolor: 'primary.main', color: '#fff' }
                : {}
            }
          />
        ))}
      </Box>

      {/* Surface */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Surface (m²)
      </Typography>
      <Slider
        value={surfaceRange}
        onChange={(_, val) => setSurfaceRange(val as [number, number])}
        onChangeCommitted={() => setPage(1)}
        min={0}
        max={1000}
        step={10}
        valueLabelDisplay="auto"
        sx={{ mb: 2.5 }}
      />

      {/* Switches */}
      <FormControlLabel
        control={
          <Switch
            checked={hasParking}
            onChange={(e) => {
              setHasParking(e.target.checked);
              setPage(1);
            }}
          />
        }
        label={
          facets?.has_parking
            ? `Parking inclus (${facets.has_parking.with_parking})`
            : 'Parking inclus'
        }
        sx={{ mb: 1 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={has3dTour}
            onChange={(e) => {
              setHas3dTour(e.target.checked);
              setPage(1);
            }}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ViewInArIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            Visite 3D disponible
          </Box>
        }
        sx={{ mb: 2 }}
      />

      {/* Property attribute groups */}
      {propertyAttributes?.grouped && propertyAttributes.grouped.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Équipements
          </Typography>
          {propertyAttributes.grouped.map((group) => (
            <Box key={group.slug} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'block',
                  mb: 0.75,
                }}
              >
                {group.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {group.attributes.map((attr) => {
                  const active = selectedAmenities.includes(attr.value);
                  return (
                    <Chip
                      key={attr.value}
                      label={attr.label}
                      size="small"
                      onClick={() => {
                        setSelectedAmenities((prev) =>
                          prev.includes(attr.value)
                            ? prev.filter((v) => v !== attr.value)
                            : [...prev, attr.value]
                        );
                        setPage(1);
                      }}
                      variant={active ? 'filled' : 'outlined'}
                      sx={
                        active
                          ? {
                              bgcolor: 'primary.main',
                              color: '#fff',
                              fontWeight: 600,
                            }
                          : {}
                      }
                    />
                  );
                })}
              </Box>
            </Box>
          ))}
        </>
      )}

      {/* Actions */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button fullWidth variant="outlined" onClick={clearFilters}>
          Réinitialiser
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            background: (t) => t.palette.gradient?.primary ?? gradient.primary,
          }}
        >
          Voir {total} résultats
        </Button>
      </Box>
    </Box>
  );
});

export default SearchFiltersDrawerContent;
