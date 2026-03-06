'use client';

import {
    AccessTime as AccessTimeIcon,
    CheckCircle as CheckCircleIcon,
    ChevronLeft as ChevronLeftIcon,
    EmailOutlined as EmailOutlinedIcon,
    PhoneOutlined as PhoneOutlinedIcon,
    Send as SendIcon,
    SupportAgent as SupportAgentIcon,
    WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Container,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SUBJECTS = [
    'Question générale',
    'Problème technique',
    'Signaler une annonce',
    'Proposition de partenariat',
    'Demande de remboursement',
    'Autre',
];

const STEPS = [
    { title: 'Vos coordonnées', subtitle: 'Pour qu\'on puisse vous répondre' },
    { title: 'Sujet', subtitle: 'De quoi s\'agit-il ?' },
    { title: 'Votre message', subtitle: 'Dites-nous tout' },
];

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '237657507909';
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@keyhome.app';
const CONTACT_PHONE = process.env.NEXT_PUBLIC_PHONE_NUMBER || '+237 657 507 909';

export default function ContactPage() {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [success, setSuccess] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const progress = ((step + 1) / STEPS.length) * 100;

    const isStepValid = (): boolean => {
        if (step === 0) { return name.trim().length > 1 && email.includes('@'); }
        if (step === 1) { return subject.length > 0; }
        if (step === 2) { return message.trim().length > 10; }
        return true;
    };

    const goNext = () => {
        if (step < STEPS.length - 1) {
            setDirection(1);
            setStep((s) => s + 1);
        }
    };

    const goBack = () => {
        if (step > 0) {
            setDirection(-1);
            setStep((s) => s - 1);
        } else {
            router.back();
        }
    };

    const waText = encodeURIComponent(
        `Bonjour KeyHome ! 👋\n\nNom: ${name}\nEmail: ${email}\nSujet: ${subject}\n\n${message}`
    );

    const handleSubmit = () => {
        setSuccess(true);
    };

    if (success) {
        return (
            <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
                <motion.div
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}
                >
                    <Box sx={{
                        width: 100, height: 100, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #F6475F, #D93A50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 3,
                        boxShadow: '0 20px 60px rgba(246,71,95,0.3)',
                    }}>
                        <CheckCircleIcon sx={{ fontSize: 52, color: '#fff' }} />
                    </Box>
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Typography variant="h5" fontWeight={900} sx={{ mb: 1, letterSpacing: -0.5 }}>
                            Prêt à envoyer !
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 360, mx: 'auto', lineHeight: 1.7 }}>
                            Cliquez sur le bouton ci-dessous pour envoyer votre message via WhatsApp. Notre équipe répond en moins de 2h.
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 300, mx: 'auto' }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<WhatsAppIcon />}
                                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                                target="_blank"
                                component="a"
                                rel="noopener noreferrer"
                                sx={{
                                    borderRadius: 3, py: 1.5, bgcolor: '#25D366',
                                    fontWeight: 700, fontSize: '0.95rem',
                                    '&:hover': { bgcolor: '#1DA851' },
                                    boxShadow: '0 8px 24px rgba(37,211,102,0.35)',
                                }}
                            >
                                Envoyer via WhatsApp
                            </Button>
                            <Button variant="outlined" size="large" onClick={() => router.push('/home')} sx={{ borderRadius: 3, py: 1.25 }}>
                                Revenir à l&apos;accueil
                            </Button>
                        </Box>
                    </motion.div>
                </motion.div>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* ── Hero header ── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #F6475F 0%, #D93A50 50%, #A01030 100%)',
                pt: { xs: 10, md: 12 }, pb: { xs: 7, md: 9 },
                textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: { xs: 70, md: 76 }, left: { xs: 16, md: 24 }, zIndex: 10 }}>
                    <IconButton onClick={() => router.back()} size="small" aria-label="Retour"
                        sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Box>
                <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
                <Container maxWidth="sm" sx={{ position: 'relative' }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '18px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                        <SupportAgentIcon sx={{ fontSize: 32, color: '#fff' }} />
                    </Box>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#fff', letterSpacing: -1, mb: 1.5, lineHeight: 1.1 }}>
                        Nous contacter
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: 400, mx: 'auto' }}>
                        Une question, un problème ? Notre équipe est là pour vous aider 7j/7.
                    </Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 2.5, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '40px', px: 2, py: 0.75, border: '1px solid rgba(255,255,255,0.2)' }}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: '#fff' }} />
                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.72rem' }}>Temps de réponse : moins de 2h</Typography>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: { xs: -4, md: -5 }, position: 'relative', pb: { xs: 6, md: 10 } }}>
                <Box sx={{ display: 'flex', gap: { md: 4 }, alignItems: 'flex-start' }}>

                    {/* ─── Left: Form card ─── */}
                    <Paper elevation={0} sx={{ flex: 1, minWidth: 0, borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'background.paper' }}>
                        {/* Progress bar */}
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 3,
                                bgcolor: 'divider',
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(to right, #F6475F, #D93A50)',
                                },
                            }}
                        />
                        <Box sx={{ p: { xs: 3, md: 4 } }}>

                        {/* Step heading */}
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={`heading-${step}`}
                                initial={{ opacity: 0, x: direction * 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -40 }}
                                transition={{ duration: 0.22 }}
                            >
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                                    {STEPS[step].title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    {STEPS[step].subtitle}
                                </Typography>
                            </motion.div>
                        </AnimatePresence>

                        {/* Step fields */}
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={`fields-${step}`}
                                initial={{ opacity: 0, x: direction * 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -40 }}
                                transition={{ duration: 0.22 }}
                            >
                                {step === 0 && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                        <TextField
                                            label="Votre nom complet"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            fullWidth
                                            autoFocus
                                            placeholder="Jean Dupont"
                                        />
                                        <TextField
                                            label="Adresse email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            fullWidth
                                            placeholder="jean@example.com"
                                        />
                                    </Box>
                                )}

                                {step === 1 && (
                                    <FormControl fullWidth>
                                        <InputLabel>Sujet de votre message</InputLabel>
                                        <Select
                                            value={subject}
                                            label="Sujet de votre message"
                                            onChange={(e) => setSubject(e.target.value)}
                                            autoFocus
                                        >
                                            {SUBJECTS.map((s) => (
                                                <MenuItem key={s} value={s}>{s}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                {step === 2 && (
                                    <TextField
                                        label="Votre message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={6}
                                        autoFocus
                                        placeholder="Décrivez votre demande en détail…"
                                        helperText={`${message.length} caractères (minimum 10)`}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation buttons */}
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 4 }}>
                            {step > 0 && (
                                <Button variant="outlined" onClick={goBack} startIcon={<ChevronLeftIcon />}
                                    sx={{ borderRadius: 2.5, px: 2.5, borderColor: 'divider' }}>
                                    Retour
                                </Button>
                            )}
                            {step < STEPS.length - 1 ? (
                                <Button variant="contained" onClick={goNext} disabled={!isStepValid()}
                                    fullWidth={step === 0}
                                    sx={{
                                        borderRadius: 2.5, px: 4, py: 1.25, fontWeight: 700,
                                        background: 'linear-gradient(to right, #F6475F, #D93A50)',
                                        flex: step > 0 ? 1 : undefined,
                                        '&:disabled': { opacity: 0.4 },
                                    }}>
                                    Continuer
                                </Button>
                            ) : (
                                <Button variant="contained" onClick={handleSubmit} disabled={!isStepValid()}
                                    startIcon={<SendIcon />}
                                    sx={{
                                        borderRadius: 2.5, px: 4, py: 1.25, fontWeight: 700, flex: 1,
                                        background: 'linear-gradient(to right, #F6475F, #D93A50)',
                                        '&:disabled': { opacity: 0.4 },
                                    }}>
                                    Envoyer le message
                                </Button>
                            )}
                        </Box>
                        </Box>
                    </Paper>

                    {/* ─── Right: Contact info (desktop only) ─── */}
                    {!isMobile && (
                        <Box sx={{ width: 320, flexShrink: 0, position: 'sticky', top: 100 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 3,
                                        background: 'linear-gradient(135deg, #F6475F 0%, #D93A50 100%)',
                                        color: '#fff',
                                    }}
                                >
                                    <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                                        Besoin d&apos;aide rapide ?
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.88 }}>
                                        Notre équipe est disponible 7j/7 pour vous accompagner.
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    {/* WhatsApp */}
                                    <Box
                                        component="a"
                                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour KeyHome ! 👋')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            p: 1.5,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'border-color 0.2s',
                                            '&:hover': { borderColor: '#25D366' },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                bgcolor: 'rgba(37,211,102,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <WhatsAppIcon sx={{ color: '#25D366', fontSize: 20 }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                WhatsApp
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                Chat instantané
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Email */}
                                    <Box
                                        component="a"
                                        href={`mailto:${CONTACT_EMAIL}`}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            p: 1.5,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'border-color 0.2s',
                                            '&:hover': { borderColor: 'primary.main' },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                bgcolor: 'rgba(246,71,95,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <EmailOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Email
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {CONTACT_EMAIL}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Phone */}
                                    <Box
                                        component="a"
                                        href={`tel:${CONTACT_PHONE}`}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            p: 1.5,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'border-color 0.2s',
                                            '&:hover': { borderColor: 'primary.main' },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                bgcolor: 'rgba(246,71,95,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <PhoneOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Téléphone
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {CONTACT_PHONE}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider />

                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                        Temps de réponse moyen : moins de 2h
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    )}
                </Box>

                {/* Mobile contact links */}
                {isMobile && (
                    <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                            Autres moyens de nous joindre
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Button
                                component="a"
                                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                startIcon={<WhatsAppIcon />}
                                size="small"
                                sx={{ borderColor: '#25D366', color: '#25D366', borderRadius: 2 }}
                            >
                                WhatsApp
                            </Button>
                            <Button
                                component="a"
                                href={`mailto:${CONTACT_EMAIL}`}
                                variant="outlined"
                                startIcon={<EmailOutlinedIcon />}
                                size="small"
                                sx={{ borderRadius: 2 }}
                            >
                                Email
                            </Button>
                            <Button
                                component="a"
                                href={`tel:${CONTACT_PHONE}`}
                                variant="outlined"
                                startIcon={<PhoneOutlinedIcon />}
                                size="small"
                                sx={{ borderRadius: 2 }}
                            >
                                Appeler
                            </Button>
                        </Box>
                    </Box>
                )}
            </Container>
        </Box>
    );
}
