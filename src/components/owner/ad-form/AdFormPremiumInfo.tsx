import DeleteIcon from '@mui/icons-material/Delete';
import ExpandIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
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
import type { AdFormValues, UpdateFn } from './types';

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
            <TextField
              fullWidth
              size="small"
              label="Autres charges"
              placeholder="Ex: Gardiennage: 5 000 FCFA/mois, Ordures: 2 000 FCFA/mois"
              multiline
              rows={2}
              value={values.charges_autres}
              onChange={(e) => update('charges_autres', e.target.value)}
            />
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
            <IconButton size="small" onClick={() => onPdfChange(null)}>
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
