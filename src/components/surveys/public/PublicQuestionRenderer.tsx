'use client';

import { SurveyQuestion } from '@/types';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Rating,
  TextField,
  Typography,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface PublicQuestionRendererProps {
  question: SurveyQuestion;
  value: string | string[] | number | null;
  onChange: (value: string | string[] | number) => void;
}

const STAR_LABELS: Record<number, string> = {
  1: 'Très mauvais',
  2: 'Mauvais',
  3: 'Acceptable',
  4: 'Bien',
  5: 'Excellent',
};

export default function PublicQuestionRenderer({
  question,
  value,
  onChange,
}: PublicQuestionRendererProps) {
  const renderInput = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              sx={{ gap: 1 }}
            >
              {question.options?.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={
                    <Radio
                      sx={{
                        color: 'divider',
                        '&.Mui-checked': { color: 'primary.main' },
                      }}
                    />
                  }
                  label={option}
                  sx={{
                    m: 0,
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    border: '1.5px solid',
                    borderColor: value === option ? 'primary.main' : 'divider',
                    bgcolor:
                      value === option
                        ? 'rgba(246,71,95,0.04)'
                        : 'background.paper',
                    transition: 'all 0.18s ease',
                    '& .MuiFormControlLabel-label': {
                      fontWeight: value === option ? 600 : 400,
                      fontSize: '0.95rem',
                    },
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: 'rgba(246,71,95,0.03)',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'checkbox': {
        const currentValues = Array.isArray(value) ? value : [];
        const handleCheckboxChange = (option: string, checked: boolean) => {
          if (checked) {
            onChange([...currentValues, option]);
          } else {
            onChange(currentValues.filter((v) => v !== option));
          }
        };
        return (
          <FormGroup sx={{ gap: 1, width: '100%' }}>
            {question.options?.map((option) => {
              const checked = currentValues.includes(option);
              return (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={(e) =>
                        handleCheckboxChange(option, e.target.checked)
                      }
                      sx={{
                        color: 'divider',
                        '&.Mui-checked': { color: 'primary.main' },
                      }}
                    />
                  }
                  label={option}
                  sx={{
                    m: 0,
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    border: '1.5px solid',
                    borderColor: checked ? 'primary.main' : 'divider',
                    bgcolor: checked
                      ? 'rgba(246,71,95,0.04)'
                      : 'background.paper',
                    transition: 'all 0.18s ease',
                    '& .MuiFormControlLabel-label': {
                      fontWeight: checked ? 600 : 400,
                      fontSize: '0.95rem',
                    },
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: 'rgba(246,71,95,0.03)',
                    },
                  }}
                />
              );
            })}
          </FormGroup>
        );
      }

      case 'rating': {
        const numVal = Number(value) || 0;
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Rating
                size="large"
                value={numVal}
                onChange={(_, newValue) => onChange(newValue ?? 0)}
                icon={<StarIcon sx={{ fontSize: 40, color: '#F59E0B' }} />}
                emptyIcon={
                  <StarBorderIcon sx={{ fontSize: 40, color: '#E5E7EB' }} />
                }
              />
              {numVal > 0 && (
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: '#F59E0B', minWidth: 24 }}
                >
                  {numVal}/5
                </Typography>
              )}
            </Box>
            {numVal > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                {STAR_LABELS[numVal]}
              </Typography>
            )}
          </Box>
        );
      }

      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Votre réponse..."
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.95rem',
                transition: 'box-shadow 0.2s ease',
                '&.Mui-focused': {
                  boxShadow: '0 0 0 3px rgba(246, 71, 95, 0.12)',
                },
              },
            }}
          />
        );

      default:
        return null;
    }
  };

  return <Box sx={{ width: '100%' }}>{renderInput()}</Box>;
}
