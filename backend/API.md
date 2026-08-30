# BibSaaS API Documentation

**Version:** 1.0.0

Base URL :

```text
http://localhost:5000/api
```

Production :

```text
https://api.bibsaas.com/api
```

---

# 1. Authentication

## Register

```http
POST /auth/register
```

Body :

```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "StrongPassword123!"
}
```

---

## Login

```http
POST /auth/login
```

---

## Refresh token

```http
POST /auth/refresh
```

---

## Logout

```http
POST /auth/logout
```

---

# 2. Users

```http
GET /users/me
PUT /users/me
DELETE /users/me
```

---

# 3. Face Analysis

```http
POST /face-analysis
GET /face-analysis
GET /face-analysis/:id
```

---

# 4. Hairstyles

```http
GET /hairstyles
GET /hairstyles/:id
POST /hairstyles
PUT /hairstyles/:id
DELETE /hairstyles/:id
```

---

# 5. Recommendations

```http
POST /recommendations
GET /recommendations
GET /recommendations/:id
```

---

# 6. Barbers

```http
GET /barbers
GET /barbers/:id
POST /barbers
PUT /barbers/:id
```

---

# 7. Salons

```http
GET /salons
GET /salons/:id
POST /salons
PUT /salons/:id
DELETE /salons/:id
```

---

# 8. Bookings

```http
POST /bookings
GET /bookings
GET /bookings/:id
PUT /bookings/:id
DELETE /bookings/:id
```

---

# 9. Subscriptions

```http
GET /subscriptions/plans
POST /subscriptions
GET /subscriptions/me
POST /subscriptions/:id/cancel
```

---

# 10. Payments

```http
POST /payments
GET /payments/:id
GET /payments/:id/verify
```

Body :

```json
{
  "planId": "plan_id",
  "paymentMethod": "CARD"
}
```

Pour MTN :

```json
{
  "planId": "plan_id",
  "paymentMethod": "MTN_MOBILE_MONEY",
  "phone": "24206XXXXXXXX"
}
```

Pour Airtel :

```json
{
  "planId": "plan_id",
  "paymentMethod": "AIRTEL_MONEY",
  "phone": "24205XXXXXXXX"
}
```

---

# 11. Simulated payment

Développement uniquement :

```http
POST /payments/simulated
```

---

# 12. Webhooks

MTN :

```http
POST /payments/webhooks/mtn
```

Airtel :

```http
POST /payments/webhooks/airtel
```

Stripe :

```http
POST /payments/webhooks/stripe
```

Les webhooks ne doivent pas utiliser JWT.

Ils doivent être sécurisés par les mécanismes d'authentification/signature du provider.

---

# 13. Invoices

```http
GET /invoices
GET /invoices/:id
GET /invoices/:id/pdf
```

---

# 14. Notifications

```http
GET /notifications
PUT /notifications/:id/read
PUT /notifications/read-all
```

---

# 15. Admin

```http
GET /admin/dashboard
GET /admin/users
GET /admin/payments
GET /admin/subscriptions
GET /admin/invoices
GET /admin/audit-logs
```

---

# 16. Response format

Succès :

```json
{
  "success": true,
  "data": {}
}
```

Erreur :

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

---

# 17. HTTP status

```text
200 OK
201 CREATED
400 BAD REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT FOUND
409 CONFLICT
422 VALIDATION ERROR
429 RATE LIMIT
500 SERVER ERROR
```
