# Container Registry (Scaffold)

## GitHub Container Registry (GHCR)

```bash
# Build
docker build -t ghcr.io/<org>/appforge-backend:latest ./backend

# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Push
docker push ghcr.io/<org>/appforge-backend:latest
```

## Recommended Tags
- `latest`
- `v1.0.0`
- `sha-<git-sha>`

## Registry Providers
- GitHub Container Registry (GHCR)
- AWS ECR
- Azure Container Registry (ACR)
- Google Artifact Registry
