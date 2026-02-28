import Image from 'next/image';
import Link from 'next/link';
import styles from './legal.module.css';

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      {/* Sticky header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backLink} aria-label="Retour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <Image src="/images/logo.png" alt="KeyHome" width={32} height={32} />
          <span className={styles.brand}>KeyHome</span>
        </div>
      </header>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.heroTitle}>Politique de Confidentialité</h1>
          <p className={styles.heroSub}>Dernière mise à jour : 20 février 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.intro}>
            Chez KeyHome, nous prenons la protection de vos données personnelles
            très au sérieux. Cette politique explique de manière transparente
            comment nous collectons, utilisons et protégeons vos informations.
          </p>

          <hr className={styles.divider} />

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>1</span>
              <h2 className={styles.sectionTitle}>Informations collectées</h2>
            </div>
            <p>
              Nous collectons uniquement les informations nécessaires au bon
              fonctionnement de notre service :
            </p>
            <ul className={styles.list}>
              <li>Informations de compte : nom, e-mail, téléphone, photo</li>
              <li>Localisation : ville et quartier pour personnaliser les résultats</li>
              <li>Données d&apos;utilisation : annonces consultées, recherches, favoris</li>
              <li>Informations de paiement : traitées par nos partenaires sécurisés</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>2</span>
              <h2 className={styles.sectionTitle}>Utilisation des données</h2>
            </div>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className={styles.list}>
              <li>Fournir et améliorer nos services immobiliers</li>
              <li>Personnaliser vos recommandations de biens</li>
              <li>Traiter vos transactions en toute sécurité</li>
              <li>Vous envoyer des notifications pertinentes</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>3</span>
              <h2 className={styles.sectionTitle}>Partage des informations</h2>
            </div>
            <p>
              <strong>Nous ne vendons jamais vos données.</strong> Nous pouvons
              les partager uniquement avec :
            </p>
            <ul className={styles.list}>
              <li>Les propriétaires/agents pour les contacts liés aux annonces</li>
              <li>Nos prestataires techniques (hébergement, paiement)</li>
              <li>Les autorités si requis par la loi</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>4</span>
              <h2 className={styles.sectionTitle}>Connexion via Google, Facebook, Apple</h2>
            </div>
            <p>
              Si vous utilisez la connexion sociale, nous recevons uniquement
              votre nom, e-mail et photo de profil. Nous n&apos;accédons jamais à vos
              contacts, messages ou autres données privées.
            </p>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>5</span>
              <h2 className={styles.sectionTitle}>Sécurité et conservation</h2>
            </div>
            <p>Vos données sont protégées par :</p>
            <ul className={`${styles.list} ${styles.listSuccess}`}>
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Stockage sécurisé des mots de passe (bcrypt)</li>
              <li>Accès restreint au personnel autorisé</li>
              <li>Audits de sécurité réguliers</li>
            </ul>
            <p className={styles.note}>
              Vos données sont conservées tant que votre compte est actif. Après
              suppression, certaines données peuvent être gardées pour des
              raisons légales.
            </p>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>6</span>
              <h2 className={styles.sectionTitle}>Vos droits</h2>
            </div>
            <p>Vous pouvez à tout moment :</p>
            <ul className={styles.list}>
              <li>Accéder à vos données personnelles</li>
              <li>Rectifier les informations incorrectes</li>
              <li>Supprimer votre compte et vos données</li>
              <li>Exporter vos données</li>
              <li>Retirer votre consentement</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>7</span>
              <h2 className={styles.sectionTitle}>Cookies</h2>
            </div>
            <p>
              Nous utilisons des cookies essentiels pour le fonctionnement du
              service et des cookies analytiques pour améliorer votre
              expérience. Vous pouvez gérer vos préférences dans les paramètres
              de votre navigateur.
            </p>
          </section>

          <hr className={styles.divider} />

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>8</span>
              <h2 className={styles.sectionTitle}>Contact</h2>
            </div>
            <p>Pour toute question sur vos données personnelles :</p>
            <div className={styles.contactBox}>
              <strong>KeyHome</strong>
              <br />
              privacy@keyhome.app
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className={styles.footerLinks}>
          <Link href="/conditions" className={styles.footerPrimary}>
            Conditions d&apos;utilisation
          </Link>
          <Link href="/" className={styles.footerSecondary}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
