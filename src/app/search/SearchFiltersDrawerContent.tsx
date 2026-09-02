'use client';

import type { SearchFiltersReturn } from '@/hooks/useSearchFilters';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { quartersService } from '@/services/cities.service';
import { brand } from '@/theme/tokens';
import type { City, Quarter } from '@/types';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { useQuery } from '@tanstack/react-query';
import { memo, useEffect, useState } from 'react';

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
    option: City,
    trailingContent?: React.ReactNode
  ) => React.ReactNode;
  renderQuarterOption: (
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
    option: Quarter
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
  renderQuarterOption,
}: Props) {
  const {
    cities,
    isCitiesLoading,
    selectedCity,
    setSelectedCity,
    cityInput,
    setCityInput,
    selectedQuarter,
    setSelectedQuarter,
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

  const [quarterInput, setQuarterInput] = useState(selectedQuarter);
  useEffect(() => setQuarterInput(selectedQuarter), [selectedQuarter]);

  const { data: quartersData, isFetching: isQuartersLoading } = useQuery({
    queryKey: ['search-filter-quarters', selectedCity?.id, quarterInput],
    queryFn: ({ signal }) =>
      quartersService.list(
        { city_id: selectedCity?.id, q: quarterInput, per_page: 30 },
        { signal }
      ),
    enabled: !!selectedCity?.id,
    staleTime: 5 * 60 * 1000,
  });

  const quarters = quartersData?.data ?? [];
  const selectedQuarterOption =
    quarters.find((quarter) => quarter.name === selectedQuarter) ?? null;

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
          setSelectedQuarter('');
          setQuarterInput('');
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
          return renderCityOption(
            { key, ...restProps },
            option,
            cityFacet ? (
              <Typography
                component="span"
                sx={{
                  ml: 'auto',
                  pl: 1,
                  fontSize: 12,
                  color: 'text.secondary',
                }}
              >
                {cityFacet.count}
              </Typography>
            ) : undefined
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

      <Autocomplete<Quarter>
        size="small"
        disablePortal
        options={quarters}
        forcePopupIcon={false}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selectedQuarterOption}
        inputValue={quarterInput}
        onInputChange={(_, value, reason) => {
          if (reason !== 'reset') setQuarterInput(value);
        }}
        onChange={(_, value) => {
          setSelectedQuarter(value?.name ?? '');
          setQuarterInput(value?.name ?? '');
          setPage(1);
        }}
        filterOptions={(options) => options}
        loading={isQuartersLoading}
        disabled={!selectedCity}
        noOptionsText={
          selectedCity
            ? 'Aucun quartier trouvé'
            : "Sélectionnez d'abord une ville"
        }
        slotProps={citySlotProps}
        renderOption={renderQuarterOption}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Quartier"
            placeholder={
              selectedCity
                ? 'Rechercher un quartier…'
                : "Sélectionnez d'abord une ville"
            }
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isQuartersLoading ? (
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
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
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
              onClick={() => {
                setBedrooms(val);
                setPage(1);
              }}
              variant={bedrooms === val ? 'filled' : 'outlined'}
              sx={{
                height: 40,
                fontSize: '0.8125rem',
                ...(bedrooms === val
                  ? { bgcolor: 'primary.main', color: '#fff' }
                  : {}),
              }}
            />
          );
        })}
      </Box>

      {/* Bathrooms */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Salles de bain
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
        {[undefined, 1, 2, 3, 4].map((val) => (
          <Chip
            key={val ?? 'all'}
            label={val === undefined ? 'Tous' : `${val}+`}
            onClick={() => {
              setBathrooms(val);
              setPage(1);
            }}
            variant={bathrooms === val ? 'filled' : 'outlined'}
            sx={{
              height: 40,
              fontSize: '0.8125rem',
              ...(bathrooms === val
                ? { bgcolor: 'primary.main', color: '#fff' }
                : {}),
            }}
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

      {/* Property attribute groups — collapsible accordions to reduce cognitive load */}
      {propertyAttributes?.grouped && propertyAttributes.grouped.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Équipements
          </Typography>
          {propertyAttributes.grouped.map((group) => {
            const activeCount = group.attributes.filter((attr) =>
              selectedAmenities.includes(attr.value)
            ).length;
            return (
              <Accordion
                key={group.slug}
                disableGutters
                elevation={0}
                sx={{
                  '&:before': { display: 'none' },
                  bgcolor: 'transparent',
                  border: '1px solid',
                  borderColor: activeCount > 0 ? 'primary.main' : 'divider',
                  borderRadius: '8px !important',
                  mb: 1,
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 44,
                    px: 1.5,
                    '& .MuiAccordionSummary-content': { my: 0.75 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      width: '100%',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {group.name}
                    </Typography>
                    {activeCount > 0 && (
                      <Chip
                        label={activeCount}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: 'primary.main',
                          color: '#fff',
                        }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {group.attributes.map((attr) => {
                      const active = selectedAmenities.includes(attr.value);
                      return (
                        <Chip
                          key={attr.value}
                          label={attr.label}
                          onClick={() => {
                            setSelectedAmenities((prev) =>
                              prev.includes(attr.value)
                                ? prev.filter((v) => v !== attr.value)
                                : [...prev, attr.value]
                            );
                            setPage(1);
                          }}
                          variant={active ? 'filled' : 'outlined'}
                          sx={{
                            height: 36,
                            ...(active
                              ? {
                                  bgcolor: 'primary.main',
                                  color: '#fff',
                                  fontWeight: 600,
                                }
                              : {}),
                          }}
                        />
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
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
            background: brand.primary,
          }}
        >
          Voir {total} résultats
        </Button>
      </Box>
    </Box>
  );
});

export default SearchFiltersDrawerContent;
