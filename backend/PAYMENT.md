# BibSaaS Premium Payment Architecture

**Version:** 1.0.0

---

# 1. Objectif

BibSaaS doit accepter des paiements locaux et internationaux.

Providers :

```text
SIMULATED
MTN_MONEY
AIRTEL_MONEY
STRIPE
```

---

# 2. Architecture

```text
PaymentController
       ↓
PaymentService
       ↓
PaymentProvider
       ├── SimulatedProvider
       ├── MtnProvider
       ├── AirtelProvider
       └── StripeProvider
```

---

# 3. Mobile Money

## MTN

```text
MTN Mobile Money
        ↓
MTN API
        ↓
Webhook BibSaaS
```

## Airtel

```text
Airtel Money
        ↓
Airtel API
        ↓
Webhook BibSaaS
```

---

# 4. Cartes internationales

Stripe permet de traiter les paiements par carte selon les moyens activés sur le compte Stripe.

Architecture :

```text
Client
 ↓
Stripe Checkout / Payment Element
 ↓
Stripe
 ↓
Webhook
 ↓
BibSaaS
 ↓
Payment SUCCESS
 ↓
Subscription ACTIVE
```

BibSaaS ne stocke jamais :

* numéro complet de carte ;
* CVV ;
* PIN ;
* données d'authentification bancaire.

---

# 5. SIMULATED

Utilisé uniquement pour :

* développement ;
* tests ;
* démonstration ;
* CI/CD.

Il doit être désactivé en production.

---

# 6. Paiement

Flux :

```text
1. Client choisit un plan
2. API récupère le plan
3. API récupère le prix depuis PostgreSQL
4. Payment PENDING
5. Provider est appelé
6. Provider traite le paiement
7. Webhook reçu
8. Signature vérifiée
9. Montant vérifié
10. Idempotence vérifiée
11. Payment SUCCESS
12. Subscription ACTIVE
13. Invoice créée
14. Notification envoyée
15. AuditLog enregistré
```

---

# 7. Idempotence

Chaque paiement possède :

```text
transactionReference
idempotencyKey
providerTransactionId
webhookEventId
```

Un webhook déjà traité ne doit jamais être traité une seconde fois.

---

# 8. Vérification du montant

Le serveur compare :

```text
Montant attendu
        VS
Montant reçu
```

Si différent :

```text
PAYMENT REJECTED
```

---

# 9. Statuts

```text
PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
REFUNDED
```

---

# 10. Stripe

Variables :

```env
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

La clé secrète reste uniquement côté serveur.

---

# 11. Webhooks

Endpoints :

```text
POST /api/payments/webhooks/mtn
POST /api/payments/webhooks/airtel
POST /api/payments/webhooks/stripe
```

Les webhooks doivent être :

* publics au niveau JWT ;
* protégés par signature/authentification provider ;
* idempotents ;
* journalisés.

---

# 12. Remboursement

Un remboursement doit :

1. être autorisé ;
2. être enregistré ;
3. être envoyé au provider ;
4. attendre confirmation ;
5. changer le statut vers REFUNDED ;
6. être enregistré dans AuditLog.

---

# 13. Production

Avant production :

```text
SIMULATED = OFF
STRIPE = ON
MTN = ON
AIRTEL = ON
WEBHOOK_SIGNATURE = REQUIRED
HTTPS = REQUIRED
```

---

# 14. Règle critique

Un frontend ne doit jamais envoyer :

```json
{
  "amount": 1000
}
```

comme source de vérité.

Le frontend envoie :

```json
{
  "planId": "..."
}
```

Le backend récupère :

```text
SubscriptionPlan.price
```

depuis PostgreSQL.

---

# 15. Audit

Chaque paiement doit pouvoir être retracé :

```text
User
 ↓
Payment
 ↓
PaymentEvent
 ↓
Provider
 ↓
Webhook
 ↓
Subscription
 ↓
Invoice
```
