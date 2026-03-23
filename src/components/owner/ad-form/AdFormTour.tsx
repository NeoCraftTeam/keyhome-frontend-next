import {
  AddPhotoAlternate as Add360Icon,
  Delete as DeleteIcon,
  ExpandMore as ExpandIcon,
  Lightbulb as LightbulbIcon,
  ViewInAr as TourIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import type { Ad, TourHotspot } from '@/types';
import type { TourScene } from './types';

const AdTourHotspotEditor = dynamic(() => import('../AdTourHotspotEditor'), {
  ssr: false,
  loading: () => null,
});

interface AdFormTourProps {
  tourScenes: TourScene[];
  ad?: Ad | null;
  errors: Record<string, string>;
  onAddScene: () => void;
  onUpdateScene: (index: number, field: keyof TourScene, value: TourScene[keyof TourScene]) => void;
  onRemoveScene: (index: number) => void;
}

export default function AdFormTour({
  tourScenes,
  ad,
  errors,
  onAddScene,
  onUpdateScene,
  onRemoveScene,
}: AdFormTourProps) {
  return (
    <Accordion
      defaultExpanded={!!(ad?.has_3d_tour)}
      sx={{
        borderRadius: '12px !important',
        border: '1px solid',
        borderColor: 'divider',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary expandIcon={<ExpandIcon />}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TourIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          Visite Virtuelle 3D
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Offrez à vos locataires une immersion complète dans votre bien.
        </Typography>

        {/* Guide collapsible */}
        <Accordion
          sx={{
            mb: 2.5,
            borderRadius: '8px !important',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Typography variant="body2" fontWeight={600}>
              📱 Comment prendre vos photos 360° ?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  🤖 Android — Google Camera (Recommandé)
                </Typography>
                <Typography variant="body2" component="ol" sx={{ pl: 2, m: 0 }}>
                  <li>Téléchargez <strong>Google Camera</strong> depuis le Play Store</li>
                  <li>Appuyez sur <strong>Plus</strong> → <strong>Photo Sphere</strong></li>
                  <li>Placez-vous <strong>au centre exact</strong> de la pièce</li>
                  <li>Suivez les cercles blancs en tournant <strong>lentement</strong> à 360°</li>
                </Typography>
              </Alert>

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LightbulbIcon sx={{ fontSize: 18 }} /> iPhone (iOS 14+)
                </Typography>
                <Typography variant="body2" component="ol" sx={{ pl: 2, m: 0 }}>
                  <li>App <strong>Appareil Photo</strong> → mode <strong>Panorama</strong></li>
                  <li>Faites un panorama <strong>complet à 360°</strong></li>
                  <li>Alternative : app <strong>Panorama 360</strong> sur l&apos;App Store</li>
                </Typography>
              </Alert>

              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LightbulbIcon sx={{ fontSize: 18 }} />
                  Conseils
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>Prenez vos photos en <strong>pleine lumière</strong></li>
                  <li>Placez-vous au <strong>centre exact</strong> de chaque pièce</li>
                  <li>Faites <strong>une photo par pièce</strong></li>
                  <li>Format : <strong>JPG ou WEBP</strong>, max <strong>30 Mo</strong></li>
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Existing tour indicator */}
        {ad?.has_3d_tour && tourScenes.length === 0 && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Ce bien possède déjà un tour 3D avec {ad.tour_scenes_count ?? '?'} scènes.
            Ajoutez de nouvelles scènes ci-dessous pour les ajouter au tour existant.
          </Alert>
        )}

        {/* Scene list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          {tourScenes.map((scene, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: errors[`tour_scene_${i}_title`] || errors[`tour_scene_${i}_file`] ? 'error.main' : 'divider',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                alignItems: { sm: 'center' },
              }}
            >
              {/* Preview */}
              <Box
                sx={{
                  width: { xs: '100%', sm: 120 },
                  minHeight: 80,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {scene.previewUrl ? (
                  <img
                    src={scene.previewUrl}
                    alt={scene.title || `Scène ${i + 1}`}
                    style={{ width: '100%', height: 80, objectFit: 'cover' }}
                  />
                ) : (
                  <Button
                    variant="text"
                    component="label"
                    size="small"
                    sx={{ textTransform: 'none', color: 'text.secondary', flexDirection: 'column', gap: 0.5 }}
                  >
                    <Add360Icon sx={{ fontSize: 28 }} />
                    <Typography variant="caption">Photo 360°</Typography>
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUpdateScene(i, 'file', f);
                      }}
                    />
                  </Button>
                )}
              </Box>

              {/* Fields */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  size="small"
                  label="Nom de la pièce"
                  placeholder="Ex: Salon, Chambre parentale..."
                  value={scene.title}
                  onChange={(e) => onUpdateScene(i, 'title', e.target.value)}
                  error={!!errors[`tour_scene_${i}_title`]}
                  helperText={errors[`tour_scene_${i}_title`]}
                  fullWidth
                />
                {scene.previewUrl && (
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    sx={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: 1.5 }}
                  >
                    Changer la photo
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUpdateScene(i, 'file', f);
                      }}
                    />
                  </Button>
                )}
                {errors[`tour_scene_${i}_file`] && (
                  <Typography variant="caption" color="error">{errors[`tour_scene_${i}_file`]}</Typography>
                )}

                {/* Hotspots Editor */}
                <AdTourHotspotEditor
                  scene={scene}
                  allScenes={tourScenes}
                  onUpdateHotspots={(hotspots: TourHotspot[]) => onUpdateScene(i, 'hotspots', hotspots)}
                />
              </Box>

              {/* Delete */}
              <IconButton
                onClick={() => onRemoveScene(i)}
                size="small"
                sx={{ color: 'text.secondary', alignSelf: { xs: 'flex-end', sm: 'center' } }}
              >
                <DeleteIcon />
              </IconButton>
            </Paper>
          ))}
        </Box>

        <Button
          variant="outlined"
          startIcon={<Add360Icon />}
          onClick={onAddScene}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            borderStyle: 'dashed',
            fontWeight: 600,
          }}
        >
          Ajouter une pièce
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}
