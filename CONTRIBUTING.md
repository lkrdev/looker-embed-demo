# Contributing to Looker Embed Demo

Thank you for contributing!

## Required Extensions

Please make sure you have the following extensions installed:

- **Ruff** (`charliermarsh.ruff`)
- **ty** (`astral-sh.ty`)

## Docker Development

You can fully build and test the application locally using Docker.

### Building the Image

```bash
docker build -t looker-embed-demo:latest .
```

### Running the Container (HTTPS)

To ensure secure cookies and embedded cross-origin authentication behave correctly during local development, the application should always be run over HTTPS. You can generate self-signed SSL certificates and mount them into the container:

1. **Generate Self-Signed SSL Certificates**:
   ```bash
   openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/CN=localhost" && chmod 644 cert.pem key.pem
   ```

2. **Run the Container**:
   ```bash
   docker run --rm -it --env-file .env \
     -p 8443:8080 \
     -v $(pwd)/cert.pem:/cert.pem:ro \
     -v $(pwd)/key.pem:/key.pem:ro \
     looker-embed-demo:latest \
     sh -c "uvicorn backend.main:app --host 0.0.0.0 --port 8080 --ssl-certfile /cert.pem --ssl-keyfile /key.pem"
   ```

Once running, access your secure local environment at https://localhost:8443.
