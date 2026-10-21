# Error handling

## HTTP status codes

- 401: Missing or invalid session
- 403: Authenticated but not permitted
- 404: Claim not found or not visible to caller
- 409: Version conflict or invalid state transition
- 422: Validation failure

## UI expectations

- Show loading while fetching.
- Show empty states when lists have no matches.
- Display API error messages without crashing.
- Handle stale edits with a clear conflict message.
- Invalid login shows a generic credential error.

## Persistence errors

Corrupt JSON or failed writes surface as 500 with a safe message; data is not replaced with empty collections.
