# API Configuration Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# External API Configuration
EXTERNAL_API_URL=https://jalvirtual.com/api/user
EXTERNAL_API_TIMEOUT=10000
EXTERNAL_API_RETRY_ATTEMPTS=3
EXTERNAL_API_RETRY_DELAY=1000
```

## API Endpoints

### Authentication
- `POST /api/auth` - Single login endpoint that supports external API authentication

## Usage

### Login with External API

The single `/api/auth` endpoint handles all login functionality. You can specify a custom API URL when logging in:

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

If no `externalApiUrl` is provided, it will use the default URL from environment variables.

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
