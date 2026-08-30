# BibSaaS Premium — Project Specification

**Version:** 1.0.0

---

## 1. Objectif

Créer une plateforme SaaS internationale spécialisée dans :

* coiffure ;
* beauté ;
* analyse faciale ;
* recommandations de coiffures ;
* réservation ;
* gestion des professionnels ;
* gestion des salons ;
* abonnements ;
* paiements internationaux.

---

# 2. Utilisateurs

## Client

Le client peut :

* créer un compte ;
* se connecter ;
* gérer son profil ;
* effectuer une analyse faciale ;
* obtenir des recommandations ;
* consulter les coiffures ;
* rechercher un barbier ;
* rechercher un salon ;
* réserver ;
* payer ;
* consulter ses factures ;
* gérer son abonnement.

---

## Barbier

Le barbier peut :

* gérer son profil ;
* publier ses coiffures ;
* gérer ses disponibilités ;
* recevoir des réservations ;
* gérer ses clients ;
* consulter ses revenus ;
* gérer son abonnement.

---

## Salon

Le salon peut :

* gérer son établissement ;
* gérer ses barbiers ;
* publier ses services ;
* publier ses coiffures ;
* gérer ses réservations ;
* gérer ses revenus ;
* gérer son abonnement.

---

## Chaîne de salons

Une chaîne peut :

* gérer plusieurs salons ;
* gérer plusieurs utilisateurs ;
* gérer plusieurs barbiers ;
* consulter les statistiques globales ;
* gérer les abonnements ;
* consulter les revenus.

---

## Administrateur

L'administrateur peut :

* gérer les utilisateurs ;
* gérer les abonnements ;
* gérer les paiements ;
* gérer les factures ;
* gérer les salons ;
* gérer les barbiers ;
* consulter les statistiques ;
* consulter les audit logs.

---

# 3. Abonnements

### Client

```text
2 semaines Promotion
1000 XAF

2 semaines Premium
1500 XAF

1 mois Premium
2000 XAF
```

### Barbier

```text
1 mois
2500 XAF
```

### Salon

```text
1 mois / annuel
3500 XAF
```

### Chaîne

```text
Premium Multi-Salon
10000 XAF
```

Les montants doivent être récupérés depuis PostgreSQL et jamais imposés par le frontend.

---

# 4. Paiements

Providers :

```text
SIMULATED
MTN_MONEY
AIRTEL_MONEY
STRIPE
```

Méthodes :

```text
SIMULATED
MTN_MOBILE_MONEY
AIRTEL_MONEY
CARD
VISA
MASTERCARD
AMERICAN_EXPRESS
DISCOVER
```

---

# 5. IA

Fonctionnalités :

```text
Face Analysis
Hairstyle Recommendation
AI Recommendation
```

Flux :

```text
Image
 ↓
Upload sécurisé
 ↓
Face Analysis
 ↓
Face characteristics
 ↓
Recommendation Engine
 ↓
Hairstyles
 ↓
Recommendations
```

---

# 6. Réservations

Une réservation contient :

* client ;
* barbier ;
* salon ;
* date ;
* heure ;
* service ;
* montant ;
* statut.

---

# 7. Factures

Une facture est créée après un paiement réussi.

Elle contient :

* numéro ;
* client ;
* paiement ;
* montant ;
* devise ;
* date ;
* statut.

---

# 8. Notifications

Types :

```text
EMAIL
IN_APP
PUSH
SMS
```

Événements :

* inscription ;
* paiement ;
* abonnement ;
* réservation ;
* facture ;
* expiration ;
* sécurité.

---

# 9. Audit

Les événements importants doivent être enregistrés :

```text
LOGIN
LOGOUT
REGISTER
PAYMENT
REFUND
SUBSCRIPTION
ADMIN_ACTION
WEBHOOK
SECURITY_EVENT
```

---

# 10. Architecture

```text
Client
 ↓
API
 ↓
Controller
 ↓
Service
 ↓
Database / Provider
```

Ne jamais placer la logique métier importante directement dans les routes.

---

# 11. Règle fondamentale

Le serveur est la source de vérité.

Le client ne doit jamais décider :

* du prix ;
* du statut d'un paiement ;
* du statut d'un abonnement ;
* du rôle d'un utilisateur ;
* de la réussite d'une transaction.
