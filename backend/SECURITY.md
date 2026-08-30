# BibSaaS Security Policy

**Version:** 1.0.0

---

# 1. Objectif

La sécurité de BibSaaS repose sur :

* authentification forte ;
* autorisation par rôle ;
* chiffrement ;
* validation ;
* rate limiting ;
* audit ;
* sécurité des paiements ;
* protection des secrets.

---

# 2. Authentication

BibSaaS utilise :

```text
JWT Access Token
+
Refresh Token
```

Les mots de passe sont hashés avec bcrypt.

---

# 3. Passwords

Les mots de passe doivent :

* être suffisamment longs ;
* ne jamais être stockés en clair ;
* être hashés ;
* ne jamais apparaître dans les logs.

---

# 4. JWT

Secrets :

```env
JWT_SECRET=""
JWT_REFRESH_SECRET=""
```

Ils doivent être longs et aléatoires.

---

# 5. Roles

Rôles :

```text
CLIENT
BARBER
SALON
SALON_CHAIN
ADMIN
SUPER_ADMIN
```

Une route administrative doit toujours vérifier le rôle.

---

# 6. API Security

Utiliser :

```text
Helmet
CORS
Rate Limiting
Input Validation
HTTP status codes
Request size limits
```

---

# 7. Payments

Les paiements sont particulièrement protégés.

Contrôles :

```text
Provider validation
Amount validation
Currency validation
Webhook signature
Idempotency
Transaction verification
Audit log
```

---

# 8. Stripe

Ne jamais stocker les cartes.

Ne jamais demander :

```text
CVV
PIN
Full card number
```

dans la base BibSaaS.

---

# 9. Secrets

Ne jamais publier :

```text
.env
JWT_SECRET
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
MTN_API_SECRET
AIRTEL_CLIENT_SECRET
SMTP_PASSWORD
```

---

# 10. Git

`.gitignore` doit contenir :

```gitignore
.env
.env.*
!.env.example

node_modules/

coverage/

dist/

logs/

uploads/

*.log
```

---

# 11. Database

Prisma doit être utilisé pour les requêtes.

Éviter les requêtes SQL dynamiques non contrôlées.

---

# 12. File uploads

Les fichiers doivent être :

* validés ;
* limités en taille ;
* contrôlés par type MIME ;
* stockés dans un bucket sécurisé ;
* jamais exécutés comme code.

---

# 13. Face Analysis

Les images de visage sont des données sensibles.

Elles doivent être :

* protégées ;
* accessibles uniquement aux utilisateurs autorisés ;
* supprimables ;
* non exposées publiquement sans autorisation.

---

# 14. Audit

Les actions sensibles sont enregistrées :

```text
LOGIN
REGISTER
PASSWORD_CHANGE
PAYMENT
REFUND
ADMIN_ACTION
WEBHOOK
SUBSCRIPTION_CHANGE
```

---

# 15. Production

En production :

```text
HTTPS = REQUIRED
NODE_ENV = production
DEBUG = false
SIMULATION = false
STRONG JWT = required
WEBHOOK SIGNATURE = required
```

---

# 16. Incident

En cas d'incident :

1. identifier l'incident ;
2. bloquer les accès compromis ;
3. révoquer les secrets ;
4. analyser les logs ;
5. vérifier les paiements ;
6. restaurer si nécessaire ;
7. documenter l'incident.

---

# 17. Principe général

BibSaaS applique :

> Never trust the client.

Le serveur est toujours la source de vérité.
