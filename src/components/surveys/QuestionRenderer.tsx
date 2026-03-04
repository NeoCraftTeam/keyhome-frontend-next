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

interface QuestionRendererProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
}

export default function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const renderInput = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
            >
              {question.options?.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'checkbox':
        const currentValues = Array.isArray(value) ? value : [];
        const handleCheckboxChange = (option: string, checked: boolean) => {
          if (checked) {
            onChange([...currentValues, option]);
          } else {
            onChange(currentValues.filter((v) => v !== option));
          }
        };
        return (
          <FormGroup>
            {question.options?.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    checked={currentValues.includes(option)}
                    onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                  />
                }
                label={option}
              />
            ))}
          </FormGroup>
        );

      case 'rating':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Rating
              size="large"
              value={Number(value) || 0}
              onChange={(_, newValue) => onChange(newValue)}
              sx={{ color: 'warning.main' }}
            />
            {value > 0 && (
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {value}/5
              </Typography>
            )}
          </Box>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Votre réponse..."
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {question.text}
      </Typography>
      <Box sx={{ mt: 1 }}>
        {renderInput()}
      </Box>
    </Box>
  );
}
