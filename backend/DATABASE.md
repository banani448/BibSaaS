# BibSaaS Database Architecture

**Database:** PostgreSQL
**Provider:** Supabase
**ORM:** Prisma

---

# 1. Architecture

```text
Application
     │
     ▼
Prisma
     │
     ▼
Supabase PostgreSQL
```

---

# 2. Principaux modèles

```text
User
Role
SubscriptionPlan
Subscription
Payment
PaymentEvent
Invoice
FaceAnalysis
Hairstyle
Recommendation
Barber
Salon
Booking
Notification
AdminAuditLog
```

---

# 3. User

Contient :

* identité ;
* email ;
* mot de passe hashé ;
* rôle ;
* statut ;
* dates de création/modification.

Le mot de passe ne doit jamais être stocké en clair.

---

# 4. SubscriptionPlan

Contient :

* nom ;
* type ;
* prix ;
* devise ;
* durée ;
* fonctionnalités ;
* statut actif.

Le prix doit être lu côté serveur.

---

# 5. Subscription

Relation :

```text
User
 ↓
Subscription
 ↓
SubscriptionPlan
```

Statuts :

```text
PENDING
ACTIVE
EXPIRED
CANCELLED
SUSPENDED
```

---

# 6. Payment

Le paiement contient :

```text
userId
subscriptionId
amount
currency
provider
paymentMethod
status
transactionReference
providerTransactionId
idempotencyKey
```

---

# 7. PaymentEvent

Chaque événement important du paiement est enregistré.

Exemple :

```text
INITIATED
PROCESSING
SUCCESS
FAILED
WEBHOOK_RECEIVED
WEBHOOK_VERIFIED
WEBHOOK_REJECTED
```

---

# 8. Invoice

Une facture doit être liée au paiement.

Elle contient :

```text
invoiceNumber
userId
paymentId
amount
currency
status
issuedAt
dueDate
```

---

# 9. FaceAnalysis

Une analyse peut contenir :

```text
userId
image
faceShape
skinTone
hairType
confidence
metadata
```

Les données sensibles doivent être protégées.

---

# 10. Recommendation

Une recommandation relie :

```text
User
FaceAnalysis
Hairstyle
```

Elle contient :

* score ;
* justification ;
* paramètres IA ;
* date.

---

# 11. Booking

Relation :

```text
User
Barber
Salon
Service
Payment
```

---

# 12. Index

Les champs fréquemment recherchés doivent être indexés :

```text
User.email
Payment.status
Payment.provider
Payment.createdAt
Subscription.status
Booking.date
Notification.userId
```

---

# 13. Migration

Après modification du schéma :

```bash
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name update_schema
```

Production :

```bash
npx prisma migrate deploy
```

---

# 14. Backup

Supabase doit être configuré avec :

* backups ;
* PITR selon le plan ;
* monitoring ;
* accès sécurisé.

---

# 15. Règles

Ne jamais :

* supprimer directement les données financières ;
* modifier manuellement un paiement SUCCESS ;
* stocker les mots de passe en clair ;
* stocker les secrets API dans PostgreSQL.

Les opérations financières importantes doivent rester auditables.
