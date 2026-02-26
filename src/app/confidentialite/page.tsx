'use client';

import {
  ArrowBack,
  Cookie,
  Email,
  Gavel,
  Lock,
  Person,
  Security,
  Storage,
  Visibility,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: 'primary.50',
            color: 'primary.main',
            display: 'flex',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ pl: { xs: 0, sm: 6 } }}>{children}</Box>
    </Box>
  );
}

export default function PrivacyPolicyPage() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header sticky */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
            <IconButton component={Link} href="/" size="small">
              <ArrowBack />
            </IconButton>
            <Image src="/images/logo.png" alt="KeyHome — Politique de confidentialité" width={32} height={32} />
            <Typography variant="subtitle1" fontWeight={600} color="primary.main">
              KeyHome
            </Typography>
          </Box>
        </Container>
      </Paper>

      {/* Hero */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 6, md: 10 },
          mb: 6,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}
          >
            Politique de Confidentialité
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, opacity: 0.9 }}>
            Dernière mise à jour : 20 février 2026
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ pb: 10 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 5, fontSize: '1.1rem', lineHeight: 1.8 }}
          >
            Chez KeyHome, nous prenons la protection de vos données personnelles
            très au sérieux. Cette politique explique de manière transparente
            comment nous collectons, utilisons et protégeons vos informations.
          </Typography>

          <Divider sx={{ mb: 5 }} />

          <Section icon={<Person />} title="Informations collectées">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Nous collectons uniquement les informations nécessaires au bon
              fonctionnement de notre service :
            </Typography>
            <List dense>
              {[
                'Informations de compte : nom, e-mail, téléphone, photo',
                'Localisation : ville et quartier pour personnaliser les résultats',
                "Données d'utilisation : annonces consultées, recherches, favoris",
                'Informations de paiement : traitées par nos partenaires sécurisés',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Section>

          <Section icon={<Visibility />} title="Utilisation des données">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Vos données sont utilisées exclusivement pour :
            </Typography>
            <List dense>
              {[
                'Fournir et améliorer nos services immobiliers',
                'Personnaliser vos recommandations de biens',
                'Traiter vos transactions en toute sécurité',
                'Vous envoyer des notifications pertinentes',
                'Assurer la sécurité de la plateforme',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Section>

          <Section icon={<Lock />} title="Partage des informations">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              <strong>Nous ne vendons jamais vos données.</strong> Nous pouvons
              les partager uniquement avec :
            </Typography>
            <List dense>
              {[
                'Les propriétaires/agents pour les contacts liés aux annonces',
                'Nos prestataires techniques (hébergement, paiement)',
                'Les autorités si requis par la loi',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Section>

          <Section icon={<Security />} title="Connexion via Google, Facebook, Apple">
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Si vous utilisez la connexion sociale, nous recevons uniquement
              votre nom, e-mail et photo de profil. Nous n&apos;accédons jamais à vos
              contacts, messages ou autres données privées.
            </Typography>
          </Section>

          <Section icon={<Storage />} title="Sécurité et conservation">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Vos données sont protégées par :
            </Typography>
            <List dense>
              {[
                'Chiffrement SSL/TLS pour toutes les communications',
                'Stockage sécurisé des mots de passe (bcrypt)',
                'Accès restreint au personnel autorisé',
                'Audits de sécurité réguliers',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              Vos données sont conservées tant que votre compte est actif. Après
              suppression, certaines données peuvent être gardées pour des
              raisons légales.
            </Typography>
          </Section>

          <Section icon={<Gavel />} title="Vos droits">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Vous pouvez à tout moment :
            </Typography>
            <List dense>
              {[
                'Accéder à vos données personnelles',
                'Rectifier les informations incorrectes',
                'Supprimer votre compte et vos données',
                'Exporter vos données',
                'Retirer votre consentement',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Section>

          <Section icon={<Cookie />} title="Cookies">
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Nous utilisons des cookies essentiels pour le fonctionnement du
              service et des cookies analytiques pour améliorer votre
              expérience. Vous pouvez gérer vos préférences dans les paramètres
              de votre navigateur.
            </Typography>
          </Section>

          <Divider sx={{ my: 5 }} />

          <Section icon={<Email />} title="Contact">
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Pour toute question sur vos données personnelles :
            </Typography>
            <Box
              sx={{
                mt: 2,
                p: 3,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography fontWeight={600}>KeyHome</Typography>
              <Typography color="text.secondary">privacy@keyhome.app</Typography>

            </Box>
          </Section>
        </Paper>

        {/* Footer links */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4 }}>
          <Link
            href="/conditions"
            style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
          >
            Conditions d&apos;utilisation
          </Link>
          <Link
            href="/"
            style={{ color: theme.palette.text.secondary, textDecoration: 'none' }}
          >
            Retour à l&apos;accueil
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
