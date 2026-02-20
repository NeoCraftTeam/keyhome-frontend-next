'use client';

import {
  ArrowBack,
  Block,
  CreditCard,
  Description,
  Email,
  Gavel,
  Home,
  Person,
  Security,
  VerifiedUser,
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

export default function TermsOfUsePage() {
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
            <Image src="/images/logo.png" alt="KeyHome" width={32} height={32} />
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
            Conditions Générales d&apos;Utilisation
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
            En utilisant KeyHome, vous acceptez les présentes conditions. Veuillez
            les lire attentivement avant d&apos;utiliser notre service.
          </Typography>

          <Divider sx={{ mb: 5 }} />

          <Section icon={<Home />} title="Description du service">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              KeyHome est une plateforme de mise en relation entre propriétaires
              immobiliers, agents et personnes à la recherche de biens au Bénin.
              Notre service permet de :
            </Typography>
            <List dense>
              {[
                'Publier et consulter des annonces immobilières',
                'Rechercher des biens selon différents critères',
                'Contacter les propriétaires ou agents',
                'Gérer ses annonces et favoris',
                'Recevoir des recommandations personnalisées',
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

          <Section icon={<Person />} title="Compte utilisateur">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Pour utiliser certaines fonctionnalités, vous devez créer un compte
              et vous engagez à :
            </Typography>
            <List dense>
              {[
                'Fournir des informations exactes et à jour',
                'Maintenir la confidentialité de vos identifiants',
                'Ne pas partager votre compte avec des tiers',
                "Nous informer de toute utilisation non autorisée",
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

          <Section icon={<Description />} title="Règles de publication">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Les utilisateurs publiant des annonces s&apos;engagent à :
            </Typography>
            <List dense>
              {[
                'Publier uniquement des biens dont ils sont propriétaires ou mandataires',
                'Fournir des informations exactes et complètes',
                'Utiliser des photos réelles et récentes du bien',
                'Mettre à jour ou supprimer les annonces obsolètes',
                'Ne pas publier de contenu frauduleux ou illégal',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'warning.main',
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

          <Section icon={<Block />} title="Comportements interdits">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Il est strictement interdit de :
            </Typography>
            <List dense>
              {[
                'Utiliser le service à des fins illégales ou frauduleuses',
                'Harceler, menacer ou nuire aux autres utilisateurs',
                'Publier du contenu haineux, discriminatoire ou offensant',
                'Collecter des données personnelles sans consentement',
                'Interférer avec le fonctionnement de la plateforme',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
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

          <Section icon={<CreditCard />} title="Services payants">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Certaines fonctionnalités sont payantes :
            </Typography>
            <List dense>
              {[
                "Déblocage d'annonces : accès aux coordonnées complètes",
                "Boost d'annonces : mise en avant dans les résultats",
                'Abonnements : forfaits pour les professionnels',
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
              Les paiements sont traités de manière sécurisée via FedaPay. Les
              achats ne sont généralement pas remboursables une fois activés.
            </Typography>
          </Section>

          <Section icon={<VerifiedUser />} title="Propriété intellectuelle">
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Le contenu de l&apos;application (logos, design, code) est protégé par
              les droits de propriété intellectuelle. Les utilisateurs conservent
              leurs droits sur le contenu publié mais accordent à KeyHome une
              licence pour l&apos;afficher sur la plateforme.
            </Typography>
          </Section>

          <Section icon={<Security />} title="Limitation de responsabilité">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              KeyHome agit en tant qu&apos;intermédiaire et ne peut être tenu
              responsable :
            </Typography>
            <List dense>
              {[
                "De l'exactitude des informations publiées par les utilisateurs",
                'Des transactions effectuées entre utilisateurs',
                'Des litiges entre propriétaires et locataires',
                'Des interruptions de service dues à des causes externes',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'grey.500',
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

          <Section icon={<Gavel />} title="Résiliation et droit applicable">
            <Typography paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Vous pouvez supprimer votre compte à tout moment. KeyHome se
              réserve le droit de suspendre tout compte violant ces conditions.
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Les présentes conditions sont régies par le droit béninois. Tout
              litige sera soumis aux tribunaux compétents de Cotonou, Bénin.
            </Typography>
          </Section>

          <Divider sx={{ my: 5 }} />

          <Section icon={<Email />} title="Contact">
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Pour toute question concernant ces conditions :
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
              <Typography color="text.secondary">support@keyhome.app</Typography>


            </Box>
          </Section>
        </Paper>

        {/* Footer links */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4 }}>
          <Link
            href="/confidentialite"
            style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
          >
            Politique de confidentialité
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
