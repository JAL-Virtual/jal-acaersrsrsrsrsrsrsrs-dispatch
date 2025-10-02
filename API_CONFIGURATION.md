# API Configuration Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# External API Configuration
EXTERNAL_API_URL=https://jalvirtual.com/api/user
EXTERNAL_API_TIMEOUT=10000
EXTERNAL_API_RETRY_ATTEMPTS=3
EXTERNAL_API_RETRY_DELAY=1000

# JAL Virtual API Configuration (legacy)
JAL_VIRTUAL_API_URL=https://jalvirtual.com/api/user
HOPPIE_API_URL=http://www.hoppie.nl/acars/system/connect.html

# API Settings
API_TIMEOUT=10000
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY=1000

# CORS Settings
ALLOWED_ORIGINS=*

# Feature Flags
ACARS_ENABLED=true
ROPS_ENABLED=true
MESSAGING_ENABLED=true

# Application Settings
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME=JAL ACARS
```

## API Endpoints

### Authentication
- `POST /api/auth` - Standard authentication using JAL Virtual API
- `POST /api/auth/external` - External API authentication with custom URL support

### User Management
- `GET /api/user` - Get user data (requires Authorization header)

### System
- `GET /api/config` - Get API configuration
- `GET /api/health` - Health check endpoint

## Usage

### Using Custom API URL

You can specify a custom API URL when logging in by including it in the request body:

```javascript
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    pilotId: 'your-pilot-id',
    apiKey: 'your-api-key',
    externalApiUrl: 'https://your-custom-api.com/user' // Optional
  }),
});
```

### API Response Format

All API endpoints return responses in the following format:

```json
{
  "success": boolean,
  "message": string,
  "data": object, // Optional
  "error": string // Optional, only present when success is false
}
```

### Authentication Headers

The API supports multiple authentication header formats:

- `Authorization: Bearer <api-key>`
- `X-API-Key: <api-key>`
- `X-Pilot-ID: <pilot-id>` (for additional verification)

## Error Handling

The API includes comprehensive error handling for:

- Connection timeouts
- Network errors
- Invalid credentials
- Server errors
- CORS issues

All errors return appropriate HTTP status codes and descriptive error messages.
