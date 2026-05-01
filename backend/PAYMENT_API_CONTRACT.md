# Payment API Contract

Base path: `/api` (also available under `/api/v1`).

All endpoints use bearer auth unless stated otherwise.

## Response Envelope

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request failed",
    "details": []
  }
}
```

`details` is optional and appears mainly for validation errors.

## Endpoints

## `GET /payments`

- Auth: required
- Roles: any authenticated role
- Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "orderId": "12",
      "amount": 24.5
    }
  ]
}
```

Notes:
- Customer role is server-filtered to only payments for customer-owned orders.

## `GET /payment-methods`

- Auth: required
- Roles: any authenticated role
- Response `200`:

```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "Cash" },
    { "id": "2", "name": "Bakong" }
  ]
}
```

## `GET /payments/bakong-token`

- Auth: required
- Roles: `Admin`, `Owner`
- Response `200`:

```json
{
  "success": true,
  "data": {
    "hasToken": true,
    "expiresAt": "2026-04-30T12:00:00.000Z",
    "updatedAt": "2026-04-30T10:00:00.000Z"
  }
}
```

## `POST /payments/bakong-token`

- Auth: required
- Roles: `Admin`, `Owner`
- Validation: body must match schema

Request:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "message": "Bakong token saved",
    "hasToken": true,
    "expiresAt": "2026-04-30T12:00:00.000Z",
    "updatedAt": "2026-04-30T10:00:00.000Z"
  }
}
```

## `POST /payments`

- Auth: required
- Roles: `Admin`, `Owner`
- Validation: body must match schema

Request:

```json
{
  "orderId": "123",
  "amount": 50,
  "method": 2,
  "note": "Partial payment"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "87",
      "orderId": "123",
      "amount": 50
    },
    "order": {
      "id": "123",
      "amountPaid": 100,
      "paymentStatus": "PAID"
    }
  }
}
```

Possible errors:
- `404 NOT_FOUND` when order does not exist
- `400 BAD_REQUEST` when payment method is invalid
- `422 VALIDATION_ERROR` for bad payload

## `POST /payments/khqr`

- Auth: required
- Roles: `Admin`, `Owner`, `Customer`
- Validation: body must match schema

Request:

```json
{
  "orderId": "123",
  "amount": 15,
  "currency": "USD"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "orderId": "123",
    "amount": 15,
    "outstanding": 45,
    "currency": "USD",
    "khqr": "000201010211...",
    "md5": "5f4dcc3b5aa765d61d8327deb882cf99",
    "billNumber": "ORD-123-1714465000000"
  }
}
```

Possible errors:
- `403 FORBIDDEN` for customer ownership violation
- `404 NOT_FOUND` for unknown order/customer
- `400 BAD_REQUEST` for business-rule failure
- `422 VALIDATION_ERROR` for bad payload

## `POST /payments/khqr/check-md5-list`

- Auth: required
- Roles: `Admin`, `Owner`, `Customer`
- Validation: body must be non-empty string array

Request:

```json
[
  "5f4dcc3b5aa765d61d8327deb882cf99"
]
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "responseCode": 0,
    "data": []
  }
}
```

Possible errors:
- `401 UNAUTHORIZED` when Bakong token is missing/expired
- `400 BAD_REQUEST` for provider/request failure
- `422 VALIDATION_ERROR` for bad payload

## `POST /payments/khqr/confirm-transaction`

- Auth: required
- Roles: `Admin`, `Owner`, `Customer`
- Validation: body must match schema

Request:

```json
{
  "orderIds": ["123", "124"],
  "transaction": {
    "md5": "5f4dcc3b5aa765d61d8327deb882cf99",
    "status": "SUCCESS",
    "data": {
      "amount": 40,
      "externalRef": "TX-123"
    }
  }
}
```

Response `201` (newly confirmed):

```json
{
  "success": true,
  "data": {
    "alreadyConfirmed": false,
    "transaction": { "id": "9", "md5": "5f4dcc3b5aa765d61d8327deb882cf99" },
    "payments": [],
    "orders": [],
    "appliedAmount": 40
  }
}
```

Response `200` (idempotent duplicate):

```json
{
  "success": true,
  "data": {
    "alreadyConfirmed": true,
    "transaction": { "id": "9", "md5": "5f4dcc3b5aa765d61d8327deb882cf99" },
    "orders": []
  }
}
```

Possible errors:
- `403 FORBIDDEN` for customer ownership violation
- `404 NOT_FOUND` when any order is missing
- `400 BAD_REQUEST` for non-success tx status or business-rule failure
- `422 VALIDATION_ERROR` for bad payload
- `500 INTERNAL_ERROR` for unexpected failures

## Common Auth/Role Errors

### Missing or invalid token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

### Role not allowed

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden for this role"
  }
}
```

