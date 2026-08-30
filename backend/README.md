# BibSaaS Premium

Version : 1.0.0
Statut : Premium / Production Architecture
Application : BibSaaS
Marché d'origine : République du Congo 🇨🇬
Devise locale : XAF — Franc CFA BEAC
Devises internationales : EUR — Euro / USD — Dollar américain
Langues : Français / Anglais
Architecture : Multi-tenant / Multi-devises / Multi-provider

---

## 1. Présentation

BibSaaS est une plateforme SaaS moderne dédiée à la beauté, la coiffure et la gestion des salons.

La plateforme permet aux utilisateurs de :

* analyser leur visage ;
* obtenir des recommandations de coiffures ;
* découvrir des barbiers et salons ;
* réserver des prestations ;
* payer leurs abonnements ;
* payer certaines réservations ;
* recevoir des factures ;
* recevoir des notifications ;
* gérer leur profil.

BibSaaS fournit également des espaces professionnels pour :

* Clients ;
* Barbiers ;
* Salons ;
* Chaînes de salons ;
* Administrateurs ;
* Super Administrateur.

---

## 2. Architecture

```text
BibSaaS
│
├── client/
│   └── Frontend
│
├── server/
│   ├── controllers/
│   ├── services/
│   ├── providers/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── app.js
│
├── prisma/
│   └── schema.prisma
│
├── API.md
├── DATABASE.md
├── PAYMENT.md
├── PROJECT_SPEC.md
└── SECURITY.md
```

---

## 3. Stack technique

### Frontend

* React
* TypeScript / JavaScript
* React Router
* Axios
* Responsive UI
* Dashboard Premium

### Backend

* Node.js
* Express
* Prisma ORM
* PostgreSQL
* JWT
* bcrypt
* Helmet
* CORS
* Rate limiting

### Database

* Supabase PostgreSQL
* Prisma ORM

### IA

* OpenAI API
* Face Analysis
* Hairstyle Recommendation
* Recommendation Engine

### Paiements

* SIMULATED
* MTN Mobile Money
* Airtel Money
* Stripe
* Visa
* Mastercard
* American Express
* Discover

---

## 4. Installation

### Prérequis

Installer :

* Node.js 20+
* npm
* Git
* PostgreSQL ou Supabase

---

### Installation

```bash
git clone YOUR_GITHUB_REPOSITORY
cd BibSaaS
npm install
```

Installer les dépendances serveur :

```bash
cd server
npm install
```

---

## 5. Variables d'environnement

Créer :

```text
.env
```

à la racine du projet.

Ne jamais publier `.env`.

---

## 6. Prisma

Formater :

```bash
npx prisma format
```

Vérifier :

```bash
npx prisma validate
```

Générer Prisma Client :

```bash
npx prisma generate
```

Migration :

```bash
npx prisma migrate dev --name init
```

Studio :

```bash
npx prisma studio
```

---

## 7. Développement

Depuis la racine :

```bash
npm run dev
```

Ou serveur uniquement :

```bash
npm run server
```

Frontend :

```bash
npm run client
```

---

## 8. Tests

```bash
npm test
```

Mode watch :

```bash
npm run test:watch
```

Coverage :

```bash
npm run test:coverage
```

---

## 9. Paiements

BibSaaS utilise une architecture multi-provider.

```text
PaymentService
      │
      ├── SimulatedProvider
      ├── MtnProvider
      ├── AirtelProvider
      └── StripeProvider
```

Le paiement simulé est destiné au développement.

En production :

```text
SIMULATED = DISABLED
MTN = ENABLED
AIRTEL = ENABLED
STRIPE = ENABLED
```

---

## 10. Sécurité

BibSaaS utilise :

* JWT ;
* refresh tokens ;
* bcrypt ;
* Helmet ;
* CORS ;
* rate limiting ;
* validation des données ;
* vérification des webhooks ;
* idempotence des paiements ;
* audit logs ;
* séparation des rôles ;
* protection des routes.

---

## 11. Production

Avant production :

```bash
NODE_ENV=production
```

Désactiver :

```text
DEBUG
TEST ENDPOINTS
SIMULATED PAYMENTS
```

Activer :

```text
HTTPS
WEBHOOK SIGNATURES
STRIPE
MTN
AIRTEL
AUDIT LOG
```

---

## 12. Licence

Copyright © 2026 BibSaaS.

Tous droits réservés.
