import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { AdFormValues, ChargeItem, UpdateFn } from './types';

interface AdFormPremiumInfoProps {
  values: AdFormValues;
  update: UpdateFn;
  defaultExpanded: boolean;
  propertyConditionPdf: File | null;
  onPdfChange: (file: File | null) => void;
  existingPdfUrl?: string;
}

export default function AdFormPremiumInfo({
  values,
  update,
  defaultExpanded,
  propertyConditionPdf,
  onPdfChange,
  existingPdfUrl,
}: AdFormPremiumInfoProps) {
  const [open, setOpen] = useState(defaultExpanded);
  return (
    <Accordion
      expanded={open}
      onChange={(_, v) => setOpen(v)}
      sx={{
        borderRadius: '12px !important',
        border: '1px solid',
        borderColor: 'divider',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary expandIcon={<ExpandIcon />}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <InfoIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          Informations Supplémentaires
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Détails supplémentaires pour votre bien — visibles par les locataires
          après déverrouillage.
        </Typography>

        {/* Conditions du bail */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{
            mb: 1.5,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.7rem',
          }}
        >
          Conditions du bail
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Dépôt de garantie</InputLabel>
              <Select
                value={values.deposit_amount}
                label="Dépôt de garantie"
                onChange={(e) => update('deposit_amount', e.target.value)}
              >
                <MenuItem value="">Non renseigné</MenuItem>
                {['1 mois', '2 mois', '3 mois', '4 mois', '5 mois'].map(
                  (opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Durée minimum du bail</InputLabel>
              <Select
                value={values.minimum_lease_duration}
                label="Durée minimum du bail"
                onChange={(e) =>
                  update('minimum_lease_duration', e.target.value)
                }
              >
                <MenuItem value="">Non renseigné</MenuItem>
                {[
                  '6 mois',
                  '1 an renouvelable',
                  '2 ans renouvelable',
                  '3 ans renouvelable',
                ].map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Charges détaillées */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{
            mb: 1.5,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.7rem',
          }}
        >
          Charges détaillées
        </Typography>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={values.charges_forfaitaires}
                onChange={(e) =>
                  update('charges_forfaitaires', e.target.checked)
                }
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Charges au forfait
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Activez si les charges sont un montant fixe mensuel (eau,
                  électricité incluses)
                </Typography>
              </Box>
            }
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {values.charges_forfaitaires ? (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Montant forfaitaire mensuel"
                placeholder="Ex: 25 000"
                type="number"
                inputProps={{ min: 0, inputMode: 'numeric' }}
                value={values.charges_montant_forfait}
                onChange={(e) =>
                  update('charges_montant_forfait', e.target.value)
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">FCFA</InputAdornment>
                  ),
                }}
              />
            </Grid>
          ) : (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Frais d'eau (mensuel)"
                  placeholder="Ex: 10 000"
                  type="number"
                  inputProps={{ min: 0, inputMode: 'numeric' }}
                  value={values.charges_eau}
                  onChange={(e) => update('charges_eau', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">FCFA</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Frais d'électricité (mensuel)"
                  placeholder="Ex: 15 000"
                  type="number"
                  inputProps={{ min: 0, inputMode: 'numeric' }}
                  value={values.charges_electricite}
                  onChange={(e) =>
                    update('charges_electricite', e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">FCFA</InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 0.5 }}>
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  fontSize: '0.68rem',
                }}
              >
                Autres charges
              </Typography>
            </Box>
            {values.charges_autres_items.length === 0 && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', mb: 1 }}
              >
                Aucune charge supplémentaire ajoutée.
              </Typography>
            )}
            {values.charges_autres_items.map(
              (item: ChargeItem, idx: number) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 1,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <TextField
                    size="small"
                    label="Libellé"
                    placeholder="Ex : Gardiennage"
                    value={item.label}
                    onChange={(e) => {
                      const next = [...values.charges_autres_items];
                      next[idx] = { ...next[idx], label: e.target.value };
                      update('charges_autres_items', next);
                    }}
                    sx={{ flex: '1 1 140px', minWidth: 120 }}
                  />
                  <TextField
                    size="small"
                    label="Montant"
                    type="number"
                    inputProps={{ min: 0, inputMode: 'numeric' }}
                    value={item.amount}
                    onChange={(e) => {
                      const next = [...values.charges_autres_items];
                      next[idx] = { ...next[idx], amount: e.target.value };
                      update('charges_autres_items', next);
                    }}
                    placeholder="5000"
                    sx={{ width: 150 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            FCFA
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={item.period === 'yearly'}
                          onChange={(e) => {
                            const next = [...values.charges_autres_items];
                            next[idx] = {
                              ...next[idx],
                              period: e.target.checked ? 'yearly' : 'monthly',
                            };
                            update('charges_autres_items', next);
                          }}
                          sx={{ p: 0.5 }}
                        />
                      }
                      label={
                        <Chip
                          label={
                            item.period === 'yearly' ? 'Annuel' : 'Mensuel'
                          }
                          size="small"
                          color={
                            item.period === 'yearly' ? 'secondary' : 'default'
                          }
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                          }}
                        />
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <IconButton
                    size="small"
                    aria-label="Supprimer la charge"
                    onClick={() => {
                      update(
                        'charges_autres_items',
                        values.charges_autres_items.filter(
                          (_: ChargeItem, i: number) => i !== idx
                        )
                      );
                    }}
                    sx={{ color: 'error.main', flexShrink: 0 }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              )
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                update('charges_autres_items', [
                  ...values.charges_autres_items,
                  { label: '', amount: '', period: 'monthly' } as ChargeItem,
                ])
              }
              sx={{
                mt: 0.5,
                borderRadius: 2,
                textTransform: 'none',
                borderStyle: 'dashed',
              }}
            >
              Ajouter une charge
            </Button>
          </Grid>
        </Grid>

        {/* État des lieux PDF */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{
            mb: 1.5,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.7rem',
          }}
        >
          État des lieux
        </Typography>
        {/* Existing PDF preview (edit mode) — shown when no new file chosen yet */}
        {existingPdfUrl && !propertyConditionPdf && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1.5,
              p: 1.25,
              borderRadius: 2,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              PDF actuel :
            </Typography>
            <Button
              size="small"
              href={existingPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'primary.main',
                p: 0,
                minWidth: 0,
              }}
            >
              Visualiser
            </Button>
            <Typography variant="caption" color="text.secondary">
              ·
            </Typography>
            <Button
              size="small"
              href={existingPdfUrl}
              download
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'primary.main',
                p: 0,
                minWidth: 0,
              }}
            >
              Télécharger
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            component="label"
            size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {propertyConditionPdf
              ? propertyConditionPdf.name
              : existingPdfUrl
                ? 'Remplacer le PDF'
                : 'Choisir un PDF'}
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={(e) => onPdfChange(e.target.files?.[0] ?? null)}
            />
          </Button>
          {propertyConditionPdf && (
            <IconButton
              size="small"
              aria-label="Supprimer le PDF"
              onClick={() => onPdfChange(null)}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <Typography variant="caption" color="text.secondary">
            PDF, max 10 Mo
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
