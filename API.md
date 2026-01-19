# Backend API Documentation

This document describes all API endpoints for the Women Safety System backend.

## Base URL

```
http://localhost:3000/api
```

Production: `https://your-domain.com/api`

---

## Endpoints

### Health Check

```http
GET /health
```

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T21:30:00.000Z",
  "service": "Women Safety Backend"
}
```

---

### Create Emergency Alert

```http
POST /api/emergency
```

Receive an emergency alert from the Android app.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceId": 1,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "batteryLevel": 85,
  "sequenceNumber": 42,
  "timestamp": 1705680000000,
  "emergencyContacts": [
    "+14155551234",
    "+14155555678",
    "+14155559999"
  ]
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| deviceId | number | Yes | Unique ESP32 device identifier |
| latitude | number | No | GPS latitude (0 if unavailable) |
| longitude | number | No | GPS longitude (0 if unavailable) |
| batteryLevel | number | No | Battery percentage (0-100) |
| sequenceNumber | number | No | LoRa packet sequence number |
| timestamp | number | Yes | Unix timestamp (milliseconds) |
| emergencyContacts | string[] | Yes | Array of phone numbers (E.164 format) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "incidentId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Emergency alert received and being processed",
  "timestamp": "2026-01-19T21:30:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Device ID is required"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to process emergency alert",
  "message": "Database connection failed"
}
```

---

### Get Incident by ID

```http
GET /api/emergency/:id
```

Retrieve details of a specific incident.

**Parameters:**
- `id` (string): Incident UUID

**Example:**
```http
GET /api/emergency/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "deviceId": 1,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "batteryLevel": 85,
  "sequenceNumber": 42,
  "timestamp": 1705680000000,
  "emergencyContacts": ["+14155551234", "+14155555678"],
  "status": "alerts_sent",
  "createdAt": "2026-01-19T21:30:00.000Z",
  "updatedAt": "2026-01-19T21:30:05.000Z",
  "metadata": {
    "alertResults": {
      "sms": [
        {
          "contact": "+14155551234",
          "success": true,
          "sid": "SM1234567890abcdef",
          "status": "sent"
        }
      ],
      "calls": [
        {
          "contact": "+14155551234",
          "success": true,
          "sid": "CA1234567890abcdef",
          "status": "queued"
        }
      ]
    },
    "responseTime": 4532
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Incident not found"
}
```

---

### Get Incidents by Device

```http
GET /api/emergency/device/:deviceId
```

Retrieve all incidents for a specific device.

**Parameters:**
- `deviceId` (number): Device ID

**Example:**
```http
GET /api/emergency/device/1
```

**Success Response (200 OK):**
```json
{
  "deviceId": "1",
  "count": 3,
  "incidents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "deviceId": 1,
      "latitude": 37.7749,
      "longitude": -122.4194,
      "status": "alerts_sent",
      "timestamp": 1705680000000,
      "createdAt": "2026-01-19T21:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "deviceId": 1,
      "latitude": 37.7750,
      "longitude": -122.4195,
      "status": "resolved",
      "timestamp": 1705579200000,
      "createdAt": "2026-01-18T17:30:00.000Z"
    }
  ]
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request body or parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error occurred |

---

## Incident Status Values

| Status | Description |
|--------|-------------|
| `triggered` | Emergency just received, processing started |
| `alerts_sent` | All SMS and calls have been sent successfully |
| `alert_failed` | Failed to send one or more alerts |
| `resolved` | Incident has been resolved/closed |

---

## Phone Number Format

All phone numbers must be in **E.164 format**:

```
+[country code][subscriber number]
```

**Examples:**
- US: `+14155551234`
- UK: `+447700900123`
- India: `+919876543210`

**Invalid formats:**
- `4155551234` (missing +)
- `+1 (415) 555-1234` (formatting characters)
- `001-415-555-1234` (wrong prefix)

---

## Rate Limiting

Currently no rate limiting implemented. For production:

```javascript
// Recommendation: 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
```

---

## Authentication

Currently no authentication required. For production:

**Recommended approach:**
1. API key in header: `X-API-Key: your_api_key`
2. JWT bearer token
3. Device-specific tokens

**Example:**
```http
POST /api/emergency
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Error Handling

All errors return JSON with this structure:

```json
{
  "error": "Human-readable error message",
  "message": "Technical details (optional)",
  "timestamp": "2026-01-19T21:30:00.000Z"
}
```

---

## Testing with cURL

**Create emergency:**
```bash
curl -X POST http://localhost:3000/api/emergency \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": 1,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "batteryLevel": 85,
    "sequenceNumber": 42,
    "timestamp": 1705680000000,
    "emergencyContacts": ["+14155551234"]
  }'
```

**Get incident:**
```bash
curl http://localhost:3000/api/emergency/550e8400-e29b-41d4-a716-446655440000
```

**Get device incidents:**
```bash
curl http://localhost:3000/api/emergency/device/1
```

---

## Testing with Postman

1. Import collection (create `women_safety.postman_collection.json`)
2. Set base URL variable: `{{baseUrl}} = http://localhost:3000/api`
3. Test endpoints with sample data

---

## Webhooks (Future Enhancement)

Potential webhook for real-time updates:

```http
POST /api/webhooks/incident-update
```

Notify external systems when incident status changes.

---

## Database Schema Reference

**Incident Document/Row:**
```javascript
{
  id: UUID,
  deviceId: Number,
  latitude: Number,
  longitude: Number,
  batteryLevel: Number,
  sequenceNumber: Number,
  timestamp: Date,
  emergencyContacts: [String],
  status: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

---

## CORS Configuration

Current settings (development):
```javascript
cors({
  origin: '*',
  credentials: true
})
```

Production recommendation:
```javascript
cors({
  origin: [
    'https://your-app-domain.com',
    'capacitor://localhost',
    'ionic://localhost'
  ],
  credentials: true
})
```
