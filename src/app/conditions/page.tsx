import { LEGAL_DOCUMENTS_LAST_UPDATED_LABEL } from '@/lib/legal-documents';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../confidentialite/legal.module.css';

const sections = [
  { id: 'description', title: 'Description du service' },
  { id: 'compte', title: 'Compte utilisateur' },
  { id: 'publication', title: 'Règles de publication' },
  { id: 'score-confiance', title: 'Score de Confiance' },
  { id: 'credits', title: 'Crédits et abonnements' },
  { id: 'ia', title: "Outils assistés par l'IA" },
  { id: 'responsabilites', title: 'Responsabilités' },
  { id: 'propriete', title: 'Propriété intellectuelle' },
  { id: 'resiliation', title: 'Résiliation' },
  { id: 'limitation', title: 'Limitation de responsabilité' },
  { id: 'modifications', title: 'Modifications et contact' },
  { id: 'droit-applicable', title: 'Droit applicable et litiges' },
];

export default function TermsOfUsePage() {
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
              aria-hidden="true"
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
          <Link
            href="/home"
            className={styles.brandLink}
            aria-label="KeyHome — Accueil"
          >
            <Image src="/images/logo.png" alt="" width={32} height={32} />
            <span className={styles.brand}>KeyHome</span>
          </Link>
          <div className={styles.headerSpacer} />
          <span className={styles.headerDocType}>Document légal</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowDot} />
            KeyHome · Conditions générales
          </p>
          <h1 className={styles.heroTitle}>
            Conditions Générales d&apos;Utilisation
          </h1>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeIcon}>
              <svg
                aria-hidden="true"
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
            Dernière mise à jour : {LEGAL_DOCUMENTS_LAST_UPDATED_LABEL}
          </div>
          <p className={styles.heroDescription}>
            En utilisant KeyHome, vous acceptez les présentes conditions
            générales d&apos;utilisation (CGU), complétées par notre{' '}
            <Link href="/confidentialite" className={styles.heroLink}>
              politique de confidentialité
            </Link>
            . Veuillez les lire attentivement avant d&apos;utiliser la
            plateforme.
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

        {/* Main Content — div: single document <main> is in root layout (a11y) */}
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <p className={styles.intro}>
              Les présentes conditions régissent l&apos;utilisation de la
              plateforme <span className={styles.introHighlight}>KeyHome</span>.
              En accédant à nos services, vous vous engagez à respecter
              l&apos;ensemble de ces conditions.
            </p>

            <hr className={styles.divider} />

            {/* §1 — Description du service */}
            <section id="description" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
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
                <h2 className={styles.sectionTitle}>
                  1. Description du service
                </h2>
              </div>
              <p>
                KeyHome est une plateforme de mise en relation entre
                propriétaires immobiliers, agents et personnes à la recherche de
                biens en <span className={styles.strong}>Afrique </span> et plus
                tard elle sera disponible dans d&apos;autres pays. Notre service
                permet de :
              </p>
              <ul className={styles.list}>
                <li>
                  Publier et consulter des annonces immobilières détaillées
                </li>
                <li>
                  Rechercher des biens selon des critères géographiques,
                  budgétaires et de confort (y compris avec des outils
                  d&apos;aide à la formulation de recherche)
                </li>
                <li>
                  Échanger via la messagerie intégrée avec les autres
                  utilisateurs
                </li>
                <li>Contacter les propriétaires ou agents immobiliers</li>
                <li>
                  Gérer vos annonces, favoris et baux depuis un espace dédié
                </li>
                <li>
                  Recevoir des recommandations personnalisées basées sur vos
                  préférences
                </li>
              </ul>
            </section>

            {/* §2 — Compte utilisateur */}
            <section id="compte" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>2. Compte utilisateur</h2>
              </div>
              <p>
                Pour accéder à certaines fonctionnalités, vous devez créer un
                compte. En vous inscrivant, vous vous engagez à :
              </p>
              <ul className={styles.list}>
                <li>Fournir des informations exactes, complètes et à jour</li>
                <li>
                  Maintenir la confidentialité stricte de vos identifiants de
                  connexion
                </li>
                <li>Ne pas partager votre compte avec des tiers</li>
                <li>
                  Nous informer immédiatement de toute utilisation non autorisée
                  de votre compte
                </li>
                <li>
                  Utiliser la plateforme conformément à sa destination et aux
                  présentes conditions, sans en détourner les fonctionnalités
                </li>
                <li>
                  Ne pas tenter de nuire au bon fonctionnement du site, de ses
                  serveurs ou de ses réseaux, ni de contourner ses systèmes de
                  sécurité
                </li>
              </ul>
              <p>
                Selon les options proposées sur la plateforme, vous pouvez
                également sécuriser votre compte avec des{' '}
                <span className={styles.strong}>passkeys </span> (WebAuthn) en
                complément ou à la place d&apos;un mot de passe.
              </p>
              <div className={styles.note}>
                Vous êtes responsable de toutes les actions effectuées sous
                votre compte. KeyHome ne pourra être tenu responsable d&apos;un
                accès non autorisé résultant d&apos;une négligence de votre
                part.
              </div>
            </section>

            {/* §3 — Règles de publication */}
            <section id="publication" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  3. Règles de publication
                </h2>
              </div>
              <p>
                Les utilisateurs publiant des annonces s&apos;engagent
                formellement à respecter les règles suivantes :
              </p>
              <ul className={`${styles.list} ${styles.listWarning}`}>
                <li>
                  Publier uniquement des biens dont ils sont propriétaires ou
                  mandataires légitimes
                </li>
                <li>
                  Fournir des informations exactes, complètes et vérifiables
                </li>
                <li>Utiliser des photos réelles et récentes du bien proposé</li>
                <li>
                  Mettre à jour ou supprimer les annonces devenues obsolètes
                </li>
                <li>
                  Ne pas publier de contenu frauduleux, trompeur ou illégal
                </li>
              </ul>
              <div className={`${styles.note} ${styles.noteHighlight}`}>
                Toute annonce ne respectant pas ces règles pourra être retirée
                sans préavis. Les récidives peuvent entraîner la suspension du
                compte.
              </div>
              <p>
                Un dispositif de{' '}
                <span className={styles.strong}>signalement </span> permet de
                notifier les contenus ou comportements préoccupants. KeyHome
                examine les signalements de bonne foi et peut retirer un
                contenu, suspendre un compte ou transmettre les informations aux
                autorités lorsque la loi l&apos;exige.
              </p>
            </section>

            {/* §4 — Score de Confiance */}
            <section id="score-confiance" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
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
                    <polygon
                      points="12,8 13.1,11.3 16.5,11.3 13.7,13.5 14.8,16.7 12,14.5 9.2,16.7 10.3,13.5 7.5,11.3 10.9,11.3"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  4. Score de Confiance (TrustScore)
                </h2>
              </div>
              <p>
                KeyHome propose un système de{' '}
                <span className={styles.strong}>Score de Confiance</span>{' '}
                optionnel visant à renforcer la transparence des interactions
                entre utilisateurs :
              </p>
              <ul className={styles.list}>
                <li>
                  <span className={styles.strong}>Opt-in : </span> le score
                  n&apos;est calculé et affiché qu&apos;avec le consentement
                  explicite de l&apos;utilisateur
                </li>
                <li>
                  <span className={styles.strong}>Non-discrimination :</span> le
                  score ne peut en aucun cas servir de base à un traitement
                  discriminatoire
                </li>
                <li>
                  <span className={styles.strong}>Contestation : </span> tout
                  utilisateur peut contester son score et demander un réexamen
                  via le support
                </li>
                <li>
                  <span className={styles.strong}>Transparence : </span> les
                  critères généraux de calcul sont documentés et accessibles
                  dans notre politique de confidentialité
                </li>
              </ul>
            </section>

            {/* §5 — Crédits et abonnements */}
            <section id="credits" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  5. Crédits et abonnements
                </h2>
              </div>
              <p>
                KeyHome propose un{' '}
                <span className={styles.strong}>système de crédits </span> pour
                débloquer certaines fonctionnalités (par exemple l&apos;accès
                aux coordonnées d&apos;une annonce), ainsi que des{' '}
                <span className={styles.strong}>abonnements</span> ou offres
                réservés aux professionnels (agents, agences) lorsque ces
                formules sont disponibles sur la plateforme.
              </p>
              <ul className={styles.list}>
                <li>
                  <span className={styles.strong}>Achat :</span> les crédits et
                  abonnements sont réglés via les moyens de paiement affichés
                  sur le service (par ex. Mobile Money, carte bancaire via notre
                  prestataire de paiement).
                </li>
                <li>
                  <span className={styles.strong}>Conditions tarifaires :</span>{' '}
                  les prix, contenus inclus et durées sont indiqués au moment de
                  la commande.
                </li>
                <li>
                  <span className={styles.strong}>Crédits :</span> sauf mention
                  contraire affichée sur la plateforme, les crédits achetés ne
                  sont en principe pas remboursables après confirmation du
                  paiement et restent associés à votre compte tant que celui-ci
                  est actif.
                </li>
                <li>
                  <span className={styles.strong}>Abonnements :</span> la
                  résiliation, la reconduction et les éventuels remboursements
                  suivent les conditions présentées sur l&apos;écran de
                  souscription et dans les communications liées à votre formule.
                </li>
              </ul>
            </section>

            {/* §6 — Outils assistés par l'IA */}
            <section id="ia" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v18" />
                    <path d="M5.5 8.5c0-1.4 1.8-2.5 6.5-2.5s6.5 1.1 6.5 2.5S20 11 12 11 5.5 9.9 5.5 8.5z" />
                    <path d="M5.5 15.5c0 1.4 1.8 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  6. Outils assistés par l&apos;IA
                </h2>
              </div>
              <p>
                KeyHome peut proposer des fonctionnalités d&apos;aide (recherche
                en langage naturel, suggestions de texte pour une annonce, etc.)
                faisant appel à des modèles d&apos;intelligence artificielle
                fournis par des prestataires techniques.
              </p>
              <ul className={styles.list}>
                <li>
                  Ces outils sont des{' '}
                  <span className={styles.strong}>aides à la décision</span> :
                  vous restez responsable du contenu que vous publiez et des
                  choix que vous faites suite à une suggestion automatique.
                </li>
                <li>
                  KeyHome ne garantit ni l&apos;exhaustivité ni
                  l&apos;exactitude des propositions générées ; il vous
                  appartient de vérifier les informations (prix, localisation,
                  caractéristiques, mentions légales).
                </li>
                <li>
                  Les données envoyées à ces services sont limitées au strict
                  nécessaire ; le détail des traitements figure dans la{' '}
                  <Link href="/confidentialite" className={styles.inlineLink}>
                    politique de confidentialité
                  </Link>
                  .
                </li>
              </ul>
            </section>

            {/* §7 — Responsabilités */}
            <section id="responsabilites" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="3" x2="12" y2="15" />
                    <path d="M5 12l7 7 7-7" />
                    <path d="M1 21h22" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>7. Responsabilités</h2>
              </div>
              <p>
                KeyHome agit en qualité d&apos;
                <span className={styles.strong}>
                  intermédiaire technologique
                </span>{' '}
                entre les parties. À ce titre :
              </p>
              <ul className={`${styles.list} ${styles.listMuted}`}>
                <li>
                  Nous ne garantissons pas l&apos;exactitude des informations
                  publiées par les utilisateurs
                </li>
                <li>
                  Nous ne sommes pas partie aux transactions immobilières
                  effectuées via la plateforme
                </li>
                <li>
                  Il est de votre responsabilité de vérifier indépendamment les
                  biens et leurs propriétaires
                </li>
                <li>
                  Nous recommandons fortement de visiter tout bien avant tout
                  engagement financier
                </li>
                <li>
                  KeyHome met tout en œuvre pour assurer la disponibilité du
                  service, mais ne garantit pas un accès ininterrompu ; des
                  interruptions temporaires pour maintenance ou raisons
                  techniques n&apos;engagent pas sa responsabilité
                </li>
                <li>
                  Les liens hypertextes vers des sites tiers sont fournis à
                  titre indicatif ; KeyHome ne contrôle pas ces contenus et
                  décline toute responsabilité quant à leur exactitude ou leur
                  disponibilité
                </li>
                <li>
                  KeyHome ne peut être tenu responsable des contenus publiés par
                  les utilisateurs (annonces, messages, avis) ; tout contenu
                  illicite peut être signalé et sera traité de bonne foi dans
                  les meilleurs délais
                </li>
              </ul>
            </section>

            {/* §8 — Propriété intellectuelle */}
            <section id="propriete" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  8. Propriété intellectuelle
                </h2>
              </div>
              <p>
                <span className={styles.strong}>KeyHome </span> est propriétaire
                de l&apos;ensemble des éléments de la plateforme : logos,
                design, code source, algorithmes et documentation.
              </p>
              <p>
                Les utilisateurs conservent l&apos;entière propriété de leur
                contenu publié (textes, photos, descriptions) mais accordent à
                KeyHome une licence non-exclusive, gratuite et mondiale pour
                afficher ce contenu sur la plateforme et dans les communications
                promotionnelles liées au service.
              </p>
              <ul className={styles.list}>
                <li>
                  Toutes les informations de la plateforme sont réservées à un
                  usage strictement personnel et non commercial, sauf accord
                  préalable écrit de KeyHome
                </li>
                <li>
                  Toute utilisation à des fins commerciales ou publicitaires,
                  toute reproduction totale ou partielle du site ou de son
                  contenu est interdite et engage la responsabilité de
                  l&apos;auteur
                </li>
                <li>
                  La reproduction à titre strictement personnel est tolérée sous
                  réserve de mentionner KeyHome comme source
                </li>
                <li>
                  Tout scraping, extraction automatisée ou utilisation de robots
                  est strictement prohibé et peut engager la responsabilité
                  civile et pénale de son auteur
                </li>
              </ul>
            </section>

            {/* §9 — Résiliation */}
            <section id="resiliation" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>9. Résiliation</h2>
              </div>
              <p>
                <span className={styles.strong}>Par l&apos;utilisateur :</span>{' '}
                vous pouvez supprimer votre compte à tout moment depuis les
                paramètres de votre profil. La suppression entraîne la perte de
                vos crédits restants et de vos données.
              </p>
              <p>
                <span className={styles.strong}>Par KeyHome : </span> nous nous
                réservons le droit de suspendre ou supprimer tout compte en cas
                de violation des présentes conditions, de fraude avérée ou de
                comportement nuisible envers d&apos;autres utilisateurs.
              </p>
            </section>

            {/* §10 — Limitation de responsabilité */}
            <section id="limitation" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  10. Limitation de responsabilité
                </h2>
              </div>
              <p>
                Dans les limites autorisées par la loi, KeyHome décline toute
                responsabilité pour :
              </p>
              <ul className={`${styles.list} ${styles.listMuted}`}>
                <li>
                  Les transactions financières effectuées entre utilisateurs en
                  dehors de la plateforme
                </li>
                <li>
                  Les cas de force majeure (catastrophes naturelles, pannes
                  réseau, conflits)
                </li>
                <li>
                  Les interruptions temporaires de service liées à la
                  maintenance ou à des problèmes techniques
                </li>
                <li>
                  Les erreurs ou imprécisions issues d&apos;outils assistés par
                  intelligence artificielle (recherche, rédaction), dans la
                  mesure permise par la loi
                </li>
              </ul>
            </section>

            <hr className={styles.divider} />

            {/* §11 — Modifications et contact */}
            <section id="modifications" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  11. Modifications et contact
                </h2>
              </div>
              <p>
                KeyHome se réserve le droit de modifier les présentes conditions
                à tout moment. En cas de modification substantielle, nous vous
                en informerons au moins{' '}
                <span className={styles.strong}>30 jours avant </span> leur
                entrée en vigueur, par e-mail ou notification dans
                l&apos;application.
              </p>
              <p>
                La poursuite de l&apos;utilisation du service après la date
                d&apos;entrée en vigueur vaut acceptation des nouvelles
                conditions.
              </p>
              <div className={styles.contactBox}>
                <div className={styles.contactInner}>
                  <span className={styles.contactName}>
                    KeyHome — Support juridique
                  </span>
                  <a
                    href="mailto:contact@keyhome.app"
                    className={styles.contactEmail}
                  >
                    <svg
                      aria-hidden="true"
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
                    contact@keyhome.app
                  </a>
                  <span className={styles.contactNote}>
                    Pour toute question concernant ces conditions, notre équipe
                    juridique est à votre disposition.
                  </span>
                </div>
              </div>
            </section>

            {/* §12 — Droit applicable et litiges */}
            <section id="droit-applicable" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconBox}>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6l9-4 9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V6z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h2 className={styles.sectionTitle}>
                  12. Droit applicable et règlement des litiges
                </h2>
              </div>
              <p>
                Les présentes CGU sont régies par le droit applicable dans
                l&apos;espace CEMAC/UEMOA, et notamment par le droit
                camerounais, sans préjudice des dispositions d&apos;ordre public
                qui pourraient s&apos;appliquer dans le pays de résidence de
                l&apos;utilisateur.
              </p>
              <p>
                En cas de litige ou de réclamation, nous vous encourageons
                vivement à nous contacter en premier lieu à{' '}
                <a
                  href="mailto:contact@keyhome.app"
                  className={styles.inlineLink}
                >
                  contact@keyhome.app
                </a>{' '}
                afin de rechercher une solution amiable.{' '}
                <span className={styles.strong}>
                  Nous nous engageons à répondre dans les 15 jours ouvrés.
                </span>
              </p>
              <p>
                À défaut de résolution amiable dans un délai de{' '}
                <span className={styles.strong}>30 jours</span> à compter de la
                première réclamation écrite, le litige sera soumis à la
                juridiction compétente du ressort du siège de KeyHome, sauf
                disposition légale impérative applicable en votre faveur en tant
                que consommateur.
              </p>
              <div className={styles.note}>
                En tant que consommateur, vous bénéficiez des protections
                offertes par les lois impératives de votre pays de résidence.
                Les présentes CGU ne sauraient vous priver de ces droits
                fondamentaux.
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
                <Link href="/confidentialite" className={styles.footerLink}>
                  Confidentialité
                </Link>
                <span className={styles.footerSep}>•</span>
                <Link
                  href="/conditions"
                  className={styles.footerLinkActive}
                  aria-current="page"
                >
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
        </div>
      </div>
    </div>
  );
}
