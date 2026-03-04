'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Slider,
  Paper,
  Grid,
  InputAdornment,
  Divider,
} from '@mui/material';
import { formatPrice } from '@/lib/constants';

interface MortgageCalculatorProps {
  initialPrice?: number;
}

export default function MortgageCalculator({ initialPrice = 50000000 }: MortgageCalculatorProps) {
  const [price, setPrice] = useState(initialPrice);
  const [downPayment, setDownPayment] = useState(initialPrice * 0.2);
  const [interestRate, setInterestRate] = useState(5.5);
  const [loanTerm, setLoanTerm] = useState(20);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    const principal = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    if (principal <= 0) {
      setMonthlyPayment(0);
      return;
    }

    if (monthlyRate === 0) {
      setMonthlyPayment(principal / numberOfPayments);
      return;
    }

    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    setMonthlyPayment(payment);
  }, [price, downPayment, interestRate, loanTerm]);

  return (
    <Paper
      elevation={0}
      className="aura-glass"
      sx={{
        p: 3,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Calculateur de prêt immobilier
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Estimez vos mensualités en fonction du prix du bien et de votre apport.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Prix du bien
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
              }}
              sx={{ mb: 1 }}
            />
            <Slider
              value={price}
              min={1000000}
              max={500000000}
              step={1000000}
              onChange={(_, val) => setPrice(val as number)}
              sx={{ color: 'primary.main' }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Apport personnel ({((downPayment / price) * 100).toFixed(0)}%)
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
              }}
              sx={{ mb: 1 }}
            />
            <Slider
              value={downPayment}
              min={0}
              max={price}
              step={500000}
              onChange={(_, val) => setDownPayment(val as number)}
              sx={{ color: 'primary.main' }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Taux d'intérêt annuel
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Slider
                value={interestRate}
                min={1}
                max={15}
                step={0.1}
                onChange={(_, val) => setInterestRate(val as number)}
                sx={{ flex: 1, color: 'primary.main' }}
              />
              <Typography variant="body2" fontWeight={600} sx={{ minWidth: 45 }}>
                {interestRate}%
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Durée du prêt (années)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Slider
                value={loanTerm}
                min={1}
                max={30}
                step={1}
                onChange={(_, val) => setLoanTerm(val as number)}
                sx={{ flex: 1, color: 'primary.main' }}
              />
              <Typography variant="body2" fontWeight={600} sx={{ minWidth: 45 }}>
                {loanTerm} ans
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(246, 71, 95, 0.05)',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Mensualité estimée
            </Typography>
            <Typography variant="h4" fontWeight={800} color="primary.main" className="aura-gradient-text">
              {formatPrice(Math.round(monthlyPayment))}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
