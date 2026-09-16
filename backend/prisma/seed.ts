/**
 * ==========================================================
 * BibSaaS Premium
 * Prisma Database Seed
 * ==========================================================
 *
 * Initialisation :
 *
 * 1. Super Admin
 * 2. Plans d'abonnement
 * 3. Prix XAF
 * 4. Prix EUR
 * 5. Prix USD
 *
 * OFFRES :
 *
 * CLIENT
 * ├── Journalier
 * ├── 2 semaines
 * └── 1 mois
 *
 * PROFESSIONNELS
 * ├── Coiffeur mensuel
 * ├── Salon mensuel
 * └── Chaîne de salons mensuelle
 *
 * ==========================================================
 *
 * IMPORTANT :
 *
 * - Les prix EUR/USD sont des prix commerciaux.
 * - Ils ne sont PAS calculés automatiquement depuis XAF.
 * - Aucun paiement réel n'est créé par ce seed.
 * - Aucun utilisateur client fictif n'est créé.
 * - Aucun abonnement actif fictif n'est créé.
 * - Aucun paiement Stripe/MTN/Airtel n'est créé.
 * - Le seed est conçu pour être réexécuté sans créer
 *   de doublons.
 *
 * ==========================================================
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";


// ==========================================================
// PRISMA CLIENT
// ==========================================================

const prisma = new PrismaClient();


// ==========================================================
// CONFIGURATION
// ==========================================================

const BCRYPT_ROUNDS = Math.max(
  10,
  Number(process.env.BCRYPT_SALT_ROUNDS || 12)
);

const SUPER_ADMIN_EMAIL = normalizeEmail(
  process.env.SUPER_ADMIN_EMAIL ||
    "admin@bibsaas.com"
);

const SUPER_ADMIN_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD ||
  "RicheBanani@030";

const SUPER_ADMIN_NAME =
  process.env.SUPER_ADMIN_NAME ||
  "BibSaaS Super Admin";


// ==========================================================
// TYPES
// ==========================================================

type SupportedCurrency =
  | "XAF"
  | "EUR"
  | "USD";

type PlanPrice = {
  currency: SupportedCurrency;
  amount: number;
};

type SeedPlan = {
  slug: string;
  name: string;
  description: string;
  type: string;
  durationDays: number;
  features: string[];
  prices: PlanPrice[];
};


// ==========================================================
// LOGGING
// ==========================================================

function log(message: string): void {
  console.log(
    `[BibSaaS Seed] ${message}`
  );
}

function success(message: string): void {
  console.log(
    `✅ [BibSaaS Seed] ${message}`
  );
}

function warning(message: string): void {
  console.warn(
    `⚠️ [BibSaaS Seed] ${message}`
  );
}

function errorLog(message: string): void {
  console.error(
    `❌ [BibSaaS Seed] ${message}`
  );
}


// ==========================================================
// NORMALIZE EMAIL
// ==========================================================

function normalizeEmail(
  email: string
): string {
  return email
    .trim()
    .toLowerCase();
}


// ==========================================================
// VALIDATE EMAIL
// ==========================================================

function isValidEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}


// ==========================================================
// VALIDATE PLAN
// ==========================================================

function validatePlan(
  plan: SeedPlan
): void {

  if (!plan.slug.trim()) {
    throw new Error(
      "Un plan possède un slug vide."
    );
  }

  if (!plan.name.trim()) {
    throw new Error(
      `Le plan ${plan.slug} possède un nom vide.`
    );
  }

  if (plan.durationDays <= 0) {
    throw new Error(
      `Durée invalide pour le plan ${plan.slug}.`
    );
  }

  if (!Array.isArray(plan.features)) {
    throw new Error(
      `Features invalides pour le plan ${plan.slug}.`
    );
  }

  if (!Array.isArray(plan.prices)) {
    throw new Error(
      `Prix invalides pour le plan ${plan.slug}.`
    );
  }

  const currencies = new Set<string>();

  for (const price of plan.prices) {

    if (price.amount < 0) {
      throw new Error(
        `Prix négatif détecté pour ${plan.slug}.`
      );
    }

    if (currencies.has(price.currency)) {
      throw new Error(
        `Devise ${price.currency} dupliquée dans ${plan.slug}.`
      );
    }

    currencies.add(
      price.currency
    );
  }
}


// ==========================================================
// PLANS PREMIUM
// ==========================================================

const plans: SeedPlan[] = [

  // ========================================================
  // 1. CLIENT JOURNALIER
  // ========================================================

  {
    slug: "client-daily",

    name:
      "Client — Accès journalier",

    description:
      "Accès journalier aux fonctionnalités essentielles de BibSaaS.",

    type: "CLIENT_BASIC",

    durationDays: 1,

    features: [
      "Profil client",
      "Recherche de coiffures",
      "Catalogue de coiffures",
      "Recommandations de coiffures",
      "Réservation",
      "Notifications",
    ],

    prices: [
      {
        currency: "XAF",
        amount: 300,
      },
      {
        currency: "EUR",
        amount: 3,
      },
      {
        currency: "USD",
        amount: 4.5,
      },
    ],
  },


  // ========================================================
  // 2. CLIENT 2 SEMAINES
  // ========================================================

  {
    slug: "client-2-weeks",

    name:
      "Client — 2 semaines",

    description:
      "Accès Premium pendant 14 jours.",

    type: "CLIENT_BASIC",

    durationDays: 14,

    features: [
      "Profil client",
      "Analyse faciale",
      "Recommandations IA",
      "Catalogue Premium",
      "Réservation",
      "Notifications",
      "Historique",
      "Favoris",
    ],

    prices: [
      {
        currency: "XAF",
        amount: 500,
      },
      {
        currency: "EUR",
        amount: 7,
      },
      {
        currency: "USD",
        amount: 11,
      },
    ],
  },


  // ========================================================
  // 3. CLIENT 1 MOIS
  // ========================================================

  {
    slug: "client-monthly-premium",

    name:
      "Client — 1 mois Premium",

    description:
      "Accès Premium complet pendant 30 jours.",

    type: "CLIENT_PREMIUM",

    durationDays: 30,

    features: [
      "Profil client",
      "Analyse faciale IA",
      "Recommandations IA",
      "Analyse des formes du visage",
      "Recommandations de coiffures",
      "Catalogue Premium",
      "Réservations",
      "Favoris",
      "Historique",
      "Notifications",
      "Factures",
    ],

    prices: [
      {
        currency: "XAF",
        amount: 1000,
      },
      {
        currency: "EUR",
        amount: 7,
      },
      {
        currency: "USD",
        amount: 7,
      },
    ],
  },


  // ========================================================
  // 4. COIFFEUR
  // ========================================================

  {
    slug: "barber-monthly",

    name:
      "Coiffeur — 1 mois Premium",

    description:
      "Abonnement professionnel destiné aux coiffeurs et barbiers.",

    type: "BARBER",

    durationDays: 30,

    features: [
      "Profil professionnel",
      "Page professionnelle",
      "Publication de coiffures",
      "Gestion des images",
      "Gestion des services",
      "Gestion des disponibilités",
      "Gestion des réservations",
      "Gestion des clients",
      "Notifications",
      "Statistiques",
      "Historique des paiements",
      "Factures",
    ],

    prices: [
      {
        currency: "XAF",
        amount: 1000,
      },
      {
        currency: "EUR",
        amount: 7,
      },
      {
        currency: "USD",
        amount: 11,
      },
    ],
  },


  // ========================================================
  // 5. SALON
  // ========================================================

  {
    slug: "salon-monthly",

    name:
      "Salon — 1 mois Premium",

    description:
      "Abonnement Premium pour les salons de coiffure.",

    type: "SALON",

    durationDays: 30,

    features: [
      "Profil du salon",
      "Page professionnelle",
      "Gestion des coiffeurs",
      "Gestion des équipes",
      "Gestion des services",
      "Gestion des horaires",
      "Gestion des disponibilités",
      "Gestion des réservations",
      "Gestion des clients",
      "Publication de coiffures",
      "Galerie photos",
      "Notifications",
      "Statistiques",
      "Statistiques financières",
      "Factures",
      "Historique des paiements",
    ],

    prices: [
      {
        currency: "XAF",
        amount: 2000,
      },
      {
        currency: "EUR",
        amount: 7,
      },
      {
        currency: "USD",
        amount: 11,
      },
    ],
  },


  // ========================================================
  // 6. CHAÎNE DE SALONS
  // ========================================================

  {
    slug: "salon-chain-monthly",

    name:
      "Chaîne de salons — Premium",

    description:
      "Abonnement Premium pour les grandes chaînes de salons avec gestion multi-salons.",

    type: "SALON_CHAIN",

    durationDays: 30,

    features: [
      "Gestion multi-salons",
      "Création de plusieurs établissements",
      "Gestion centralisée des salons",
      "Gestion des coiffeurs",
      "Gestion des équipes",
      "Gestion des services",
      "Gestion des horaires",
      "Gestion des réservations",
      "Gestion des clients",
      "Publication de coiffures",
      "Galerie photos",
      "Dashboard centralisé",
      "Statistiques globales",
      "Statistiques par salon",
      "Statistiques financières",
      "Gestion des abonnements",
      "Gestion des paiements",
      "Facturation",
      "Notifications",
      "Audit administratif",
    ],

    prices: [
      {
        currency: "XAF",
        amount: 10000,
      },
      {
        currency: "EUR",
        amount: 11,
      },
      {
        currency: "USD",
        amount: 45.5,
      },
    ],
  },
];


// ==========================================================
// VALIDATION DES PLANS
// ==========================================================

function validateAllPlans(): void {

  const slugs = new Set<string>();

  for (const plan of plans) {

    validatePlan(plan);

    if (slugs.has(plan.slug)) {
      throw new Error(
        `Slug de plan dupliqué : ${plan.slug}`
      );
    }

    slugs.add(plan.slug);
  }

  success(
    `${plans.length} plans validés.`
  );
}


// ==========================================================
// SUPER ADMIN
// ==========================================================

async function seedSuperAdmin(): Promise<void> {

  log(
    "Vérification du Super Admin..."
  );

  const email =
    normalizeEmail(
      SUPER_ADMIN_EMAIL
    );


  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------

  if (!isValidEmail(email)) {

    throw new Error(
      `SUPER_ADMIN_EMAIL invalide : ${email}`
    );
  }


  if (
    SUPER_ADMIN_PASSWORD.length < 15
  ) {

    throw new Error(
      "SUPER_ADMIN_PASSWORD doit contenir au moins 15 caractères."
    );
  }


  // --------------------------------------------------------
  // AVERTISSEMENT MOT DE PASSE PAR DÉFAUT
  // --------------------------------------------------------

  if (
    !process.env.SUPER_ADMIN_PASSWORD
  ) {

    warning(
      "SUPER_ADMIN_PASSWORD n'est pas défini dans .env."
    );

    warning(
      "Le mot de passe par défaut est utilisé."
    );

    warning(
      "Richebanani@030"
    );
  }

 
  // --------------------------------------------------------
  // RECHERCHE ADMIN
  // --------------------------------------------------------

  const existingAdmin =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });


  const nameParts = SUPER_ADMIN_NAME.trim().split(" ");
  const firstName = nameParts[0] || "Super";
  const lastName = nameParts.slice(1).join(" ") || "Admin";

  // --------------------------------------------------------
  // ADMIN EXISTANT
  // --------------------------------------------------------

  if (existingAdmin) {

    await prisma.user.update({
      where: {
        id: existingAdmin.id,
      },

      data: {
        role:
          "SUPER_ADMIN" as any,

        status:
          "ACTIVE" as any,

        profile: {
          upsert: {
            create: {
              firstName,
              lastName,
            },
            update: {
              firstName,
              lastName,
            },
          },
        },
      },
    });

    success(
      `Super Admin existant : ${email}`
    );

    return;
  }


  // --------------------------------------------------------
  // HASH PASSWORD
  // --------------------------------------------------------

  const passwordHash =
    await bcrypt.hash(
      SUPER_ADMIN_PASSWORD,
      BCRYPT_ROUNDS
    );


  // --------------------------------------------------------
  // CREATE ADMIN
  // --------------------------------------------------------

  await prisma.user.create({
    data: {
      email,

      password:
        passwordHash,

      role:
        "SUPER_ADMIN" as any,

      status:
        "ACTIVE" as any,

      emailVerified:
        true,

      profile: {
        create: {
          firstName,
          lastName,
        },
      },
    },
  });


  success(
    `Super Admin créé : ${email}`
  );
}


// ==========================================================
// SEED PLAN
// ==========================================================

async function seedPlan(
  plan: SeedPlan
): Promise<void> {

  log(
    `Traitement du plan : ${plan.name}`
  );


  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------

  validatePlan(plan);


  // --------------------------------------------------------
  // FIND EXISTING PLAN
  // --------------------------------------------------------

  const existingPlan =
    await prisma.subscriptionPlan.findUnique({
      where: {
        slug:
          plan.slug,
      },
    });


  const xafPrice =
    plan.prices.find((p) => p.currency === "XAF")?.amount ??
    plan.prices[0]?.amount ??
    0;

  const subscriptionPlan =
    existingPlan
      ? await prisma.subscriptionPlan.update({

          where: {
            id:
              existingPlan.id,
          },

          data: {

            name:
              plan.name,

            description:
              plan.description,

            type:
              plan.type as any,

            price:
              xafPrice,

            currency:
              "XAF",

            isActive:
              true,

            durationDays:
              plan.durationDays,
          },
        })

      : await prisma.subscriptionPlan.create({

          data: {

            slug:
              plan.slug,

            name:
              plan.name,

            description:
              plan.description,

            type:
              plan.type as any,

            price:
              xafPrice,

            currency:
              "XAF",

            isActive:
              true,

            durationDays:
              plan.durationDays,
          },
        });


  // --------------------------------------------------------
  // FEATURES (PlanFeature)
  // --------------------------------------------------------

  for (const feat of plan.features) {
    await prisma.planFeature.upsert({
      where: {
        planId_key: {
          planId: subscriptionPlan.id,
          key: feat,
        },
      },
      create: {
        planId: subscriptionPlan.id,
        key: feat,
        value: "true",
      },
      update: {
        value: "true",
      },
    });
  }


  success(
    `Plan prêt : ${plan.slug} (${xafPrice} XAF)`
  );
}


// ==========================================================
// SEED ALL PLANS
// ==========================================================

async function seedSubscriptionPlans(): Promise<void> {

  log(
    "Initialisation des plans BibSaaS Premium..."
  );


  for (
    const plan of plans
  ) {

    await seedPlan(
      plan
    );
  }


  success(
    `${plans.length} plans Premium traités.`
  );
}


// ==========================================================
// DISPLAY SUMMARY
// ==========================================================

async function displaySummary(): Promise<void> {

  const allPlans =
    await prisma.subscriptionPlan.findMany({

      where: {
        isActive:
          true,
      },

      include: {
        features:
          true,
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });


  console.log("");

  console.log(
    "=========================================================="
  );

  console.log(
    "             BIBSAAS PREMIUM — PLANS"
  );

  console.log(
    "=========================================================="
  );


  for (
    const plan of allPlans
  ) {

    console.log("");

    console.log(
      `📦 ${plan.name}`
    );

    console.log(
      `   Slug    : ${plan.slug}`
    );

    console.log(
      `   Type    : ${plan.type}`
    );

    console.log(
      `   Durée   : ${plan.durationDays} jour(s)`
    );

    console.log(
      `   Prix    : ${plan.currency} ${plan.price}`
    );

    if (plan.features && plan.features.length > 0) {
      console.log(
        `   Features: ${plan.features.map((f) => f.key).join(", ")}`
      );
    }
  }


  console.log("");

  console.log(
    "=========================================================="
  );

  console.log(
    `Total plans actifs : ${allPlans.length}`
  );

  console.log(
    "=========================================================="
  );
}


// ==========================================================
// DATABASE HEALTH CHECK
// ==========================================================

async function checkDatabaseConnection(): Promise<void> {

  log(
    "Vérification de la connexion PostgreSQL..."
  );

  await prisma.$queryRaw`SELECT 1`;

  success(
    "Connexion PostgreSQL opérationnelle."
  );
}


// ==========================================================
// MAIN
// ==========================================================

async function main(): Promise<void> {

  console.log("");

  console.log(
    "=========================================================="
  );

  console.log(
    "              BibSaaS Premium"
  );

  console.log(
    "             Database Seed"
  );

  console.log(
    "=========================================================="
  );

  console.log("");

  log(
    `Environnement : ${
      process.env.NODE_ENV ||
      "development"
    }`
  );

  log(
    `Bcrypt rounds : ${BCRYPT_ROUNDS}`
  );

  log(
    `Admin email   : ${SUPER_ADMIN_EMAIL}`
  );

  console.log("");


  // --------------------------------------------------------
  // DATABASE CONNECTION
  // --------------------------------------------------------

  await checkDatabaseConnection();


  // --------------------------------------------------------
  // VALIDATION PLANS
  // --------------------------------------------------------

  validateAllPlans();


  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------

  await seedSuperAdmin();


  // --------------------------------------------------------
  // SUBSCRIPTION PLANS
  // --------------------------------------------------------

  await seedSubscriptionPlans();


  // --------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------

  await displaySummary();


  console.log("");

  success(
    "Seed BibSaaS Premium terminé avec succès."
  );

  console.log("");

  console.log(
    "=========================================================="
  );

  console.log(
    "      Aucun paiement ou abonnement fictif créé."
  );

  console.log(
    "=========================================================="
  );

  console.log("");
}


// ==========================================================
// EXECUTION
// ==========================================================

main()

  .catch((error: unknown) => {

    console.error("");

    errorLog(
      "Échec du seed."
    );

    console.error("");

    if (
      error instanceof Error
    ) {

      console.error(
        error.message
      );

      if (error.stack) {

        console.error(
          "\nStack:",
          error.stack
        );
      }

    } else {

      console.error(
        error
      );
    }

    console.error("");

    process.exitCode = 1;
  })

  .finally(async () => {

    await prisma.$disconnect();
  });