# Changelog

## [Unreleased] - 2026-06-11

### Refactored
- **Modularized Backend Architecture:** Decomposed the monolithic `main.py` entry point into a clean, decoupled structure inside `backend/app/`.
  - Created `app/core/config.py` for eager validation of Looker SDK environment variables on startup.
  - Created `app/core/security.py` to isolate PBKDF2 key derivation and stream cipher encryption/decryption.
  - Created `app/core/cookies.py` to organize cookie setters, getters, keys, and lifetime constants.
  - Created `app/services/looker.py` to encapsulate Looker SDK methods (`login_user`, `acquire_cookieless_session`, `generate_cookieless_tokens`) for loose coupling and mockability in testing.
  - Created `app/middleware.py` for HTTP middleware handling external user ID generation and Looker context parsing.
  - Created `app/api/deps.py` supplying clean FastAPI dependencies for LookerService and current user state retrieval.
  - Created `app/api/endpoints/auth.py` and `app/api/endpoints/system.py` to split route handlers into separate namespaces, aggregated via `app/api/api.py`.
- **Simplified Entry Point:** Stripped down `backend/main.py` to focus exclusively on application bootstrapping, middleware setup, and router loading.
- **Removed Duplicate Code:** Cleaned up root-level `utils.py` to only contain external ID utilities, and deleted the deprecated root `models.py`.

### Added
- **Reactive Session Configuration:** Implemented dynamic Looker session synchronization on frontend settings changes (role, language, company) via a unified `POST /api/looker/login` call.
- **Encrypted User Session Cookie:** Replaced `COOKIE_LOOKER_USER_ID` with `COOKIE_LOOKER_USER` to securely store and decrypt user role, permissions, models, and attributes on the backend.
- **Cookieless SDK Integration:** Migrated the frontend Looker Embed SDK to use `initCookieless` with secure callback functions instead of standard SSO URL embedding.

### Fixed
- **SDK Handshake Property Mismatch:** Exposed `session_reference_token_ttl` in acquisition and generation token responses to satisfy the Looker Embed SDK's check and prevent session setup errors.

