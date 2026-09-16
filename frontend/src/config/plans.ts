
export type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  priceId: string;
  link: string;
  features: string[];
  popular?: boolean;
};

export const plans: Plan[] = [
  // ============================================================
  // PLAN JOURNALIER
  // ============================================================
  {
    id: "daily",
    name: "Journalier",
    description: "Pour tester BibSaaS avec une grande flexibilité.",
    price: 3,
    duration: "/jour",

    priceId:
      import.meta.env.MODE === "development"
        ? "price_1UFBaXDAm8a1iudFs86szPnO"
        : "price_LIVE_DAILY",

    link:
      import.meta.env.MODE === "development"
        ? "https://buy.stripe.com/test_9B65kDg4y1emaQTegj0sU03"
        : "https://buy.stripe.com/REMPLACE_PAR_TON_LIEN_DAILY",

    features: [
      "Essai gratuit de 30 minutes",
      "Gestion des clients",
      "Gestion des coiffeurs",
      "Gestion des réservations",
      "Gestion du profil salon",
      "Tableau de bord",
      "Notifications",
      "Support standard",
    ],
  },

  // ============================================================
  // PLAN HEBDOMADAIRE
  // ============================================================
  {
    id: "weekly",
    name: "Hebdomadaire",
    description: "Pour les coiffeurs et salons qui veulent plus de flexibilité.",
    price: 7,
    duration: "/semaine",

    priceId:
      import.meta.env.MODE === "development"
        ? "prod_VFgzcVMH3pKuUI"
        : "price_LIVE_WEEKLY",

    link:
      import.meta.env.MODE === "development"
        ? "https://buy.stripe.com/test_eVq00j2dIe181gj1tx0sU02"
        : "https://buy.stripe.com/REMPLACE_PAR_TON_LIEN_WEEKLY",

    features: [
      "Essai gratuit de 30 minutes",
      "Gestion des clients",
      "Gestion des coiffeurs",
      "Gestion des réservations",
      "Gestion du profil salon",
      "Tableau de bord",
      "Notifications",
      "Support standard",
    ],
  },

  // ============================================================
  // PLAN MENSUEL
  // ============================================================
  {
    id: "monthly",
    name: "Pro",
    description: "Pour les salons qui souhaitent développer leur activité.",
    price: 11,
    duration: "/mois",

    priceId:
      import.meta.env.MODE === "development"
        ? "prod_VFh0I5VRWf8jBv"
        : "price_LIVE_MONTHLY",

    link:
      import.meta.env.MODE === "development"
        ? "https://buy.stripe.com/test_4gM7sL5pUe18e355JN0sU01"
        : "https://buy.stripe.com/REMPLACE_PAR_TON_LIEN_MONTHLY",

    features: [
      "Essai gratuit de 30 minutes",
      "Tout le plan Hebdomadaire",
      "Analyse du visage",
      "Recommandations de coiffures",
      "Gestion avancée des réservations",
      "Rapports et statistiques",
      "Paiements Mobile Money",
      "Facturation",
      "Support prioritaire",
    ],

    popular: true,
  },

  // ============================================================
  // PLAN ANNUEL
  // ============================================================
  {
    id: "yearly",
    name: "Business",
    description:
      "Pour les salons, chaînes de salons et entreprises avec des besoins avancés.",
    price: 45.5,
    duration: "/an",

    priceId:
      import.meta.env.MODE === "development"
        ? "prod_VFh1XEufN71Dz0"
        : "price_LIVE_YEARLY",

    link:
      import.meta.env.MODE === "development"
        ? "https://buy.stripe.com/test_bJecN54lQ6yGgbd6NR0sU00"
        : "https://buy.stripe.com/REMPLACE_PAR_TON_LIEN_YEARLY",

    features: [
      "Essai gratuit de 30 minutes",
      "Tout le plan Pro",
      "Utilisateurs multiples",
      "Gestion de plusieurs salons",
      "Gestion des chaînes de salons",
      "Tableaux de bord avancés",
      "Rapports avancés",
      "Automatisations",
      "Journaux d'audit",
      "Support premium",
    ],
  },
];

export default plans;

