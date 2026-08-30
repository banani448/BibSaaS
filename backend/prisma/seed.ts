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
 *
 * ==========================================================
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();


// ==========================================================
// CONFIGURATION
// ==========================================================

const BCRYPT_ROUNDS = Number(
  process.env.BCRYPT_SALT_ROUNDS || 12
);

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL ||
  "admin@bibsaas.com";

const SUPER_ADMIN_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD ||
  "ChangeMeNow123!";

const SUPER_ADMIN_NAME =
  process.env.SUPER_ADMIN_NAME ||
  "BibSaaS Super Admin";


// ==========================================================
// TYPES
// ==========================================================

type PlanPrice = {
  currency: "XAF" | "EUR" | "USD";
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

function log(message: string) {
  console.log(`[BibSaaS Seed] ${message}`);
}

function success(message: string) {
  console.log(`✅ [BibSaaS Seed] ${message}`);
}

function warning(message: string) {
  console.warn(`⚠️ [BibSaaS Seed] ${message}`);
}


// ==========================================================
// NORMALIZE EMAIL
// ==========================================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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
    name: "Client — Accès journalier",
    description:
      "Accès journalier aux fonctionnalités essentielles de BibSaaS.",

    type: "CLIENT",

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
        amount: 3.5,
      },
      {
        currency: "USD",
        amount: 3.85,
      },
    ],
  },


  // ========================================================
  // 2. CLIENT 2 SEMAINES
  // ========================================================

  {
    slug: "client-2-weeks",
    name: "Client — 2 semaines",
    description:
      "Accès Premium pendant 14 jours.",

    type: "CLIENT",

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
        amount: 6,
      },
      {
        currency: "USD",
        amount: 6.5,
      },
    ],
  },


  // ========================================================
  // 3. CLIENT 1 MOIS
  // ========================================================

  {
    slug: "client-monthly-premium",
    name: "Client — 1 mois Premium",
    description:
      "Accès Premium complet pendant 30 jours.",

    type: "CLIENT",

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
        amount: 9,
      },
      {
        currency: "USD",
        amount: 10,
      },
    ],
  },


  // ========================================================
  // 4. COIFFEUR
  // ========================================================

  {
    slug: "barber-monthly",
    name: "Coiffeur — 1 mois Premium",
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
        amount: 8,
      },
      {
        currency: "USD",
        amount: 8.5,
      },
    ],
  },


  // ========================================================
  // 5. SALON
  // ========================================================

  {
    slug: "salon-monthly",
    name: "Salon — 1 mois Premium",
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
        amount: 9,
      },
      {
        currency: "USD",
        amount: 9.5,
      },
    ],
  },


  // ========================================================
  // 6. CHAÎNE DE SALONS
  // ========================================================

  {
    slug: "salon-chain-monthly",
    name: "Chaîne de salons — Premium",
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
        amount: 18,
      },
      {
        currency: "USD",
        amount: 20,
      },
    ],
  },
];


// ==========================================================
// SUPER ADMIN
// ==========================================================

async function seedSuperAdmin() {
  log("Vérification du Super Admin...");

  const email = normalizeEmail(
    SUPER_ADMIN_EMAIL
  );

  const existingAdmin =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (existingAdmin) {

    await prisma.user.update({
      where: {
        id: existingAdmin.id,
      },

      data: {
        name: SUPER_ADMIN_NAME,

        // Les valeurs doivent correspondre
        // aux enums de ton schema.prisma.
        role: "SUPER_ADMIN" as any,

        status: "ACTIVE" as any,
      },
    });

    success(
      `Super Admin existant : ${email}`
    );

    return;
  }

  const passwordHash =
    await bcrypt.hash(
      SUPER_ADMIN_PASSWORD,
      BCRYPT_ROUNDS
    );

  await prisma.user.create({
    data: {
      name: SUPER_ADMIN_NAME,

      email,

      password: passwordHash,

      role: "SUPER_ADMIN" as any,

      status: "ACTIVE" as any,
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
) {

  log(
    `Traitement du plan : ${plan.name}`
  );

  // --------------------------------------------------------
  // FIND EXISTING PLAN
  // --------------------------------------------------------

  const existingPlan =
    await prisma.subscriptionPlan.findUnique({
      where: {
        slug: plan.slug,
      },
    });


  // --------------------------------------------------------
  // CREATE / UPDATE PLAN
  // --------------------------------------------------------

  const subscriptionPlan =
    existingPlan
      ? await prisma.subscriptionPlan.update({
          where: {
            id: existingPlan.id,
          },

          data: {
            name: plan.name,

            description:
              plan.description,

            type: plan.type as any,

            features: plan.features,

            isActive: true,

            durationDays:
              plan.durationDays,
          },
        })

      : await prisma.subscriptionPlan.create({
          data: {
            slug: plan.slug,

            name: plan.name,

            description:
              plan.description,

            type: plan.type as any,

            features: plan.features,

            isActive: true,

            durationDays:
              plan.durationDays,
          },
        });


  // --------------------------------------------------------
  // PRICES
  // --------------------------------------------------------

  for (const price of plan.prices) {

    const existingPrice =
      await prisma.subscriptionPlanPrice.findFirst({
        where: {
          planId: subscriptionPlan.id,

          currency:
            price.currency,
        },
      });


    if (existingPrice) {

      await prisma.subscriptionPlanPrice.update({
        where: {
          id: existingPrice.id,
        },

        data: {
          amount: price.amount,

          durationDays:
            plan.durationDays,

          isActive: true,
        },
      });

      log(
        `Prix mis à jour : ${price.currency} ${price.amount}`
      );

    } else {

      await prisma.subscriptionPlanPrice.create({
        data: {
          planId:
            subscriptionPlan.id,

          currency:
            price.currency,

          amount:
            price.amount,

          durationDays:
            plan.durationDays,

          isActive: true,
        },
      });

      log(
        `Prix créé : ${price.currency} ${price.amount}`
      );
    }
  }


  success(
    `Plan prêt : ${plan.slug}`
  );
}


// ==========================================================
// SEED ALL PLANS
// ==========================================================

async function seedSubscriptionPlans() {

  log(
    "Initialisation des plans BibSaaS Premium..."
  );

  for (const plan of plans) {
    await seedPlan(plan);
  }

  success(
    `${plans.length} plans Premium traités.`
  );
}


// ==========================================================
// DISPLAY SUMMARY
// ==========================================================

async function displaySummary() {

  const allPlans =
    await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
      },

      include: {
        prices: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });


  console.log("");
  console.log(
    "=========================================================="
  );
  console.log(
    " BIBSAAS PREMIUM — PLANS"
  );
  console.log(
    "=========================================================="
  );


  for (const plan of allPlans) {

    console.log("");
    console.log(
      `📦 ${plan.name}`
    );

    console.log(
      `   Slug: ${plan.slug}`
    );

    console.log(
      `   Type: ${plan.type}`
    );

    console.log(
      `   Durée: ${plan.durationDays} jour(s)`
    );

    console.log(
      "   Prix:"
    );


    for (const price of plan.prices) {

      console.log(
        `      ${price.currency} ${price.amount}`
      );
    }
  }


  console.log("");
  console.log(
    "=========================================================="
  );
}


// ==========================================================
// MAIN
// ==========================================================

async function main() {

  console.log("");
  console.log(
    "=========================================================="
  );

  console.log(
    "        BibSaaS Premium Database Seed"
  );

  console.log(
    "        XAF + EUR + USD"
  );

  console.log(
    "=========================================================="
  );

  console.log("");


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
}


// ==========================================================
// EXECUTION
// ==========================================================

main()

  .catch((error) => {

    console.error("");

    console.error(
      "❌ [BibSaaS Seed] Échec du seed."
    );

    console.error("");

    console.error(error);

    console.error("");

    process.exit(1);
  })

  .finally(async () => {

    await prisma.$disconnect();
  });