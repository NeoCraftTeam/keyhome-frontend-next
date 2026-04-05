import Image from 'next/image';
import Link from 'next/link';
import styles from './legal.module.css';

export default function TermsOfUsePage() {
  return (
    <div className={styles.page}>
      {/* Sticky header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backLink} aria-label="Retour">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
          <h1 className={styles.heroTitle}>
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className={styles.heroSub}>
            Dernière mise à jour : 20 février 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.intro}>
            En utilisant KeyHome, vous acceptez les présentes conditions.
            Veuillez les lire attentivement avant d&apos;utiliser notre service.
          </p>

          <hr className={styles.divider} />

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>1</span>
              <h2 className={styles.sectionTitle}>Description du service</h2>
            </div>
            <p>
              KeyHome est une plateforme de mise en relation entre propriétaires
              immobiliers, agents et personnes à la recherche de biens en
              Afrique. Notre service permet de :
            </p>
            <ul className={styles.list}>
              <li>Publier et consulter des annonces immobilières</li>
              <li>Rechercher des biens selon différents critères</li>
              <li>Contacter les propriétaires ou agents</li>
              <li>Gérer ses annonces et favoris</li>
              <li>Recevoir des recommandations personnalisées</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>2</span>
              <h2 className={styles.sectionTitle}>Compte utilisateur</h2>
            </div>
            <p>
              Pour utiliser certaines fonctionnalités, vous devez créer un
              compte et vous engagez à :
            </p>
            <ul className={styles.list}>
              <li>Fournir des informations exactes et à jour</li>
              <li>Maintenir la confidentialité de vos identifiants</li>
              <li>Ne pas partager votre compte avec des tiers</li>
              <li>Nous informer de toute utilisation non autorisée</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>3</span>
              <h2 className={styles.sectionTitle}>Règles de publication</h2>
            </div>
            <p>Les utilisateurs publiant des annonces s&apos;engagent à :</p>
            <ul className={`${styles.list} ${styles.listWarning}`}>
              <li>
                Publier uniquement des biens dont ils sont propriétaires ou
                mandataires
              </li>
              <li>Fournir des informations exactes et complètes</li>
              <li>Utiliser des photos réelles et récentes du bien</li>
              <li>Mettre à jour ou supprimer les annonces obsolètes</li>
              <li>Ne pas publier de contenu frauduleux ou illégal</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>4</span>
              <h2 className={styles.sectionTitle}>Comportements interdits</h2>
            </div>
            <p>Il est strictement interdit de :</p>
            <ul className={`${styles.list} ${styles.listDanger}`}>
              <li>Utiliser le service à des fins illégales ou frauduleuses</li>
              <li>Harceler, menacer ou nuire aux autres utilisateurs</li>
              <li>Publier du contenu haineux, discriminatoire ou offensant</li>
              <li>Collecter des données personnelles sans consentement</li>
              <li>Interférer avec le fonctionnement de la plateforme</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>5</span>
              <h2 className={styles.sectionTitle}>Services payants</h2>
            </div>
            <p>Certaines fonctionnalités sont payantes :</p>
            <ul className={`${styles.list} ${styles.listSuccess}`}>
              <li>
                Déblocage d&apos;annonces : accès aux coordonnées complètes
              </li>
              <li>Boost d&apos;annonces : mise en avant dans les résultats</li>
              <li>Abonnements : forfaits pour les professionnels</li>
            </ul>
            <p className={styles.note}>
              Les paiements sont traités de manière sécurisé. Les achats ne sont
              généralement pas remboursables une fois activés.
            </p>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>6</span>
              <h2 className={styles.sectionTitle}>Propriété intellectuelle</h2>
            </div>
            <p>
              Le contenu de l&apos;application (logos, design, code) est protégé
              par les droits de propriété intellectuelle. Les utilisateurs
              conservent leurs droits sur le contenu publié mais accordent à
              KeyHome une licence pour l&apos;afficher sur la plateforme.
            </p>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>7</span>
              <h2 className={styles.sectionTitle}>
                Limitation de responsabilité
              </h2>
            </div>
            <p>
              KeyHome agit en tant qu&apos;intermédiaire et ne peut être tenu
              responsable :
            </p>
            <ul className={`${styles.list} ${styles.listMuted}`}>
              <li>
                De l&apos;exactitude des informations publiées par les
                utilisateurs
              </li>
              <li>Des transactions effectuées entre utilisateurs</li>
              <li>Des litiges entre propriétaires et locataires</li>
              <li>Des interruptions de service dues à des causes externes</li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>8</span>
              <h2 className={styles.sectionTitle}>
                Résiliation et droit applicable
              </h2>
            </div>
            <p>
              Vous pouvez supprimer votre compte à tout moment. KeyHome se
              réserve le droit de suspendre tout compte violant ces conditions.
            </p>
            <p>
              Les présentes conditions sont régies par le droit applicable dans
              le pays d&apos;utilisation du service. Tout litige sera soumis aux
              tribunaux compétents du lieu d&apos;établissement de
              l&apos;utilisateur.
            </p>
          </section>

          <hr className={styles.divider} />

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.iconBox}>9</span>
              <h2 className={styles.sectionTitle}>Contact</h2>
            </div>
            <p>Pour toute question concernant ces conditions :</p>
            <div className={styles.contactBox}>
              <strong>KeyHome</strong>
              <br />
              support@keyhome.app
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className={styles.footerLinks}>
          <Link href="/confidentialite" className={styles.footerPrimary}>
            Politique de confidentialité
          </Link>
          <Link href="/" className={styles.footerSecondary}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
