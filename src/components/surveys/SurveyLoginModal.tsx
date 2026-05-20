'use client';

import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import { Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

interface SurveyLoginModalProps {
  open: boolean;
  surveyId: string;
  surveySlug?: string;
  title: string;
  description: string;
  /**
   * Called when the user clicks "Plus tard".
   * The caller must persist nothing — this is purely session-scoped state so
   * the modal reappears on the next login/page load until the survey is answered.
   */
  onDismiss: () => void;
}

/**
 * Modal displayed once per login session when an active unanswered survey exists.
 *
 * Behaviour:
 *  - "Répondre au sondage" → navigates to /surveys/{slug} then closes.
 *  - "Plus tard"           → closes for this session only (no localStorage, no API).
 *  - Answered survey       → `has_answered === true` from backend → modal never shown.
 *
 * The parent layout is responsible for resetting `surveyDismissed` to false when
 * `isAuthenticated` transitions from false → true so the modal re-appears on login.
 */
export default function SurveyLoginModal({
  open,
  surveySlug,
  surveyId,
  title,
  description,
  onDismiss,
}: SurveyLoginModalProps) {
  const router = useRouter();
  const theme = useTheme();

  const handleParticiper = () => {
    onDismiss();
    router.push(`/surveys/${surveySlug ?? surveyId}`);
  };

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ height: 4, bgcolor: 'primary.main' }} />
      <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
            }}
          >
            <AssignmentOutlined sx={{ fontSize: 28 }} />
          </Box>

          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ fontSize: '1.1rem', mb: 0.75 }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.65 }}
            >
              {description}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
              width: '100%',
              mt: 0.5,
            }}
          >
            <Button
              type="button"
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleParticiper}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                py: 1.25,
              }}
            >
              Répondre au sondage
            </Button>
            <Button
              type="button"
              variant="text"
              fullWidth
              onClick={onDismiss}
              startIcon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: 'none',
                color: 'text.disabled',
                fontWeight: 500,
                borderRadius: 2,
              }}
            >
              Plus tard
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
