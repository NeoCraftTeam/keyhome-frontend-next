import Image from 'next/image';
import Link from 'next/link';
import styles from './legal.module.css';

const sections = [
  { id: 'collecte', title: 'Informations collectées' },
  { id: 'utilisation', title: 'Utilisation des données' },
  { id: 'partage', title: 'Partage des informations' },
  { id: 'connexion-sociale', title: 'Connexion sociale' },
  { id: 'score-confiance', title: 'Score de Confiance' },
  { id: 'securite', title: 'Sécurité et conservation' },
  { id: 'droits', title: 'Vos droits' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'contact', title: 'Contact' },
];

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link
            href="/"
            className={styles.backLink}
            aria-label="Retour à l'accueil"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <Image src="/images/logo.png" alt="KeyHome" width={32} height={32} />
          <span className={styles.brand}>KeyHome</span>
          <div className={styles.headerSpacer} />
          <span className={styles.headerDocType}>Document légal</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowDot} />
            KeyHome · Confidentialité
          </p>
          <h1 className={styles.heroTitle}>Politique de Confidentialité</h1>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeIcon}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            Dernière mise à jour : 20 février 2026
          </div>
          <p className={styles.heroDescription}>
            Votre confiance est notre priorité. Découvrez comment nous
            protégeons et utilisons vos données personnelles.
          </p>
        </div>
      </section>

      {/* ── Layout: ToC + Content ── */}
      <div className={styles.layout}>
        {/* Table of Contents */}
        <nav className={styles.toc} aria-label="Sommaire">
          <span className={styles.tocLabel}>Sommaire</span>
          {sections.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={styles.tocItem}>
              <span className={styles.tocNumber}>{i + 1}</span>
              {s.title}
            </a>
          ))}
        </nav>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.card}>
            <p className={styles.intro}>
              Chez <span className={styles.introHighlight}>KeyHome</span>, nous
              prenons la protection de vos données personnelles très au sérieux.
              Cette politique explique de manière transparente comment nous
              collectons, utilisons et protégeons vos informations sur notre
              plateforme immobilière.
            </p>

            <hr className={styles.divider} />

            {/* §1 — Informations collectées */}
            <section id="collecte" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  1. Informations collectées
                </h2>
              </div>
              <p>
                Nous collectons uniquement les informations nécessaires au bon
                fonctionnement de notre service :
              </p>
              <ul className={styles.list}>
                <li>
                  <span className={styles.strong}>
                    Informations de compte :
                  </span>{' '}
                  nom, adresse e-mail, numéro de téléphone, photo de profil
                </li>
                <li>
                  <span className={styles.strong}>Localisation :</span> ville et
                  quartier pour personnaliser vos résultats de recherche
                </li>
                <li>
                  <span className={styles.strong}>
                    Données d&apos;utilisation :
                  </span>{' '}
                  annonces consultées, recherches effectuées, favoris
                  enregistrés
                </li>
                <li>
                  <span className={styles.strong}>
                    Informations de paiement :
                  </span>{' '}
                  traitées exclusivement par nos partenaires de paiement
                  sécurisés (Flutterwave). Nous ne stockons jamais vos données
                  bancaires
                </li>
              </ul>
            </section>

            {/* §2 — Utilisation des données */}
            <section id="utilisation" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 20V10" />
                    <path d="M12 20V4" />
                    <path d="M6 20v-6" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  2. Utilisation des données
                </h2>
              </div>
              <p>Vos données sont utilisées exclusivement pour :</p>
              <ul className={styles.list}>
                <li>
                  Fournir et améliorer continuellement nos services immobiliers
                </li>
                <li>
                  Personnaliser vos recommandations de biens selon vos
                  préférences
                </li>
                <li>
                  Traiter vos transactions et achats de crédits en toute
                  sécurité
                </li>
                <li>
                  Vous envoyer des notifications pertinentes (alertes de
                  recherche, messages)
                </li>
                <li>
                  Assurer la sécurité de la plateforme et prévenir les fraudes
                </li>
              </ul>
            </section>

            {/* §3 — Partage des informations */}
            <section id="partage" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51l6.83 3.98" />
                    <path d="M15.41 6.51l-6.82 3.98" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  3. Partage des informations
                </h2>
              </div>
              <p>
                <span className={styles.strong}>
                  Nous ne vendons jamais vos données personnelles.
                </span>{' '}
                Nous pouvons les partager uniquement dans les cas suivants :
              </p>
              <ul className={styles.list}>
                <li>
                  Avec les propriétaires ou agents immobiliers lorsque vous
                  débloquez les coordonnées d&apos;une annonce
                </li>
                <li>
                  Avec nos prestataires techniques de confiance (hébergement,
                  paiement, analytics) sous contrat de confidentialité strict
                </li>
                <li>
                  Avec les autorités compétentes uniquement si requis par la loi
                  en vigueur
                </li>
              </ul>
            </section>

            {/* §4 — Connexion sociale */}
            <section id="connexion-sociale" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>4. Connexion sociale</h2>
              </div>
              <p>
                Si vous choisissez de vous connecter via{' '}
                <span className={styles.strong}>Google, Facebook ou Apple</span>
                , nous recevons uniquement votre nom, adresse e-mail et photo de
                profil.
              </p>
              <p>
                Nous n&apos;accédons jamais à vos contacts, messages,
                publications ou autres données privées de vos comptes sociaux.
                Ces informations servent exclusivement à créer et sécuriser
                votre compte KeyHome.
              </p>
            </section>

            {/* §5 — Score de Confiance */}
            <section id="score-confiance" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  5. Score de Confiance (TrustScore)
                </h2>
              </div>
              <p>
                KeyHome propose un{' '}
                <span className={styles.strong}>Score de Confiance</span>{' '}
                optionnel pour renforcer la transparence entre utilisateurs.
                Voici comment il fonctionne :
              </p>
              <ul className={styles.list}>
                <li>
                  <span className={styles.strong}>Signaux utilisés :</span>{' '}
                  vérification de l&apos;identité, ancienneté du compte, avis
                  reçus, qualité des annonces publiées, réactivité aux messages
                </li>
                <li>
                  <span className={styles.strong}>Consentement requis :</span>{' '}
                  le score n&apos;est activé qu&apos;avec votre accord explicite
                  (opt-in)
                </li>
                <li>
                  <span className={styles.strong}>
                    Désactivation possible :
                  </span>{' '}
                  vous pouvez désactiver votre score à tout moment dans vos
                  paramètres
                </li>
                <li>
                  <span className={styles.strong}>Confidentialité :</span> les
                  signaux détaillés du score ne sont jamais partagés — seul le
                  score agrégé est visible publiquement
                </li>
              </ul>
              <div className={`${styles.note} ${styles.noteHighlight}`}>
                Le Score de Confiance ne constitue pas un jugement définitif. Il
                est conçu pour faciliter les interactions et ne peut en aucun
                cas être utilisé à des fins discriminatoires.
              </div>
            </section>

            {/* §6 — Sécurité et conservation */}
            <section id="securite" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  6. Sécurité et conservation
                </h2>
              </div>
              <p>
                Nous mettons en œuvre des mesures de sécurité de niveau
                professionnel pour protéger vos données :
              </p>
              <ul className={`${styles.list} ${styles.listSuccess}`}>
                <li>
                  Chiffrement SSL/TLS pour toutes les communications réseau
                </li>
                <li>Stockage sécurisé des mots de passe via hachage bcrypt</li>
                <li>
                  Accès restreint au personnel autorisé avec authentification
                  multi-facteurs
                </li>
                <li>Audits de sécurité réguliers et tests de pénétration</li>
                <li>
                  Hébergement sur des serveurs conformes aux normes
                  internationales
                </li>
              </ul>
              <div className={styles.note}>
                Vos données sont conservées tant que votre compte est actif.
                Après suppression de votre compte, certaines données peuvent
                être gardées pendant une durée limitée pour des raisons légales
                ou comptables.
              </div>
            </section>

            {/* §7 — Vos droits */}
            <section id="droits" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M16 11l2 2 4-4" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>7. Vos droits</h2>
              </div>
              <p>
                Conformément aux réglementations en vigueur, vous disposez des
                droits suivants sur vos données personnelles :
              </p>
              <ul className={styles.list}>
                <li>
                  <span className={styles.strong}>Droit d&apos;accès :</span>{' '}
                  consulter l&apos;ensemble de vos données personnelles
                </li>
                <li>
                  <span className={styles.strong}>
                    Droit de rectification :
                  </span>{' '}
                  corriger les informations incorrectes ou incomplètes
                </li>
                <li>
                  <span className={styles.strong}>Droit de suppression :</span>{' '}
                  supprimer votre compte et l&apos;ensemble de vos données
                </li>
                <li>
                  <span className={styles.strong}>
                    Droit à la portabilité :
                  </span>{' '}
                  exporter vos données dans un format structuré et lisible
                </li>
                <li>
                  <span className={styles.strong}>Droit de retrait :</span>{' '}
                  retirer votre consentement au traitement de vos données à tout
                  moment
                </li>
              </ul>
              <div className={styles.note}>
                Pour exercer vos droits, contactez-nous à{' '}
                <span className={styles.strong}>privacy@keyhome.app</span>. Nous
                répondrons dans un délai de 30 jours.
              </div>
            </section>

            {/* §8 — Cookies */}
            <section id="cookies" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                    <circle cx="8.5" cy="8.5" r="0.5" fill="currentColor" />
                    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                    <circle cx="16" cy="12" r="0.5" fill="currentColor" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>8. Cookies</h2>
              </div>
              <p>Notre plateforme utilise deux types de cookies :</p>
              <ul className={styles.list}>
                <li>
                  <span className={styles.strong}>Cookies essentiels :</span>{' '}
                  nécessaires au fonctionnement du service (authentification,
                  sécurité, session)
                </li>
                <li>
                  <span className={styles.strong}>Cookies analytiques :</span>{' '}
                  nous aident à comprendre l&apos;utilisation de la plateforme
                  pour l&apos;améliorer
                </li>
              </ul>
              <p>
                Vous pouvez gérer vos préférences de cookies à tout moment dans
                les paramètres de votre navigateur. La désactivation des cookies
                essentiels peut affecter le fonctionnement du service.
              </p>
            </section>

            <hr className={styles.divider} />

            {/* §9 — Contact */}
            <section id="contact" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>9. Contact</h2>
              </div>
              <p>
                Pour toute question relative à vos données personnelles ou à
                cette politique de confidentialité :
              </p>
              <div className={styles.contactBox}>
                <div className={styles.contactInner}>
                  <span className={styles.contactName}>
                    KeyHome — Protection des données
                  </span>
                  <a
                    href="mailto:privacy@keyhome.app"
                    className={styles.contactEmail}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    privacy@keyhome.app
                  </a>
                  <span className={styles.contactNote}>
                    Nous nous engageons à répondre à toute demande dans un délai
                    maximum de 30 jours ouvrés.
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className={styles.footer}>
            <div className={styles.footerInner}>
              <div className={styles.footerLinks}>
                <Link href="/" className={styles.footerLink}>
                  Accueil
                </Link>
                <span className={styles.footerSep}>•</span>
                <Link
                  href="/confidentialite"
                  className={styles.footerLinkActive}
                >
                  Confidentialité
                </Link>
                <span className={styles.footerSep}>•</span>
                <Link href="/conditions" className={styles.footerLink}>
                  Conditions générales
                </Link>
                <span className={styles.footerSep}>•</span>
                <Link href="/aide" className={styles.footerLink}>
                  Aide
                </Link>
              </div>
              <p className={styles.footerCopyright}>
                © {new Date().getFullYear()} KeyHome — Tous droits réservés
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
