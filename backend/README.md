# Looker Embed Demo Backend

High-performance, secure backend API orchestration for Looker Cookieless Embedding and Token Management.

## Setup & Configuration

Ensure your top-level `.env` file is populated with your Looker SDK 4.0 credentials. Then, append a cryptographically secure application encryption key directly into your `.env` file by running this command from the root of the project:

```bash
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
```
