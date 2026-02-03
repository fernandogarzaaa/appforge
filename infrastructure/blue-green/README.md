# Blue-Green Deployment (Scaffold)

This guide provides a minimal blue-green deployment workflow for AppForge.

## Strategy
- **Blue** = currently serving traffic
- **Green** = new release
- Traffic is switched via load balancer or reverse proxy once green is healthy.

## Steps
1. Build and push a new image to your registry (GHCR/ECR/ACR).
2. Deploy the **green** stack with the new image.
3. Run health checks on `/health` and `/api/status`.
4. Switch traffic to green (load balancer target group or reverse proxy).
5. Keep blue running for fast rollback.
6. Decommission blue after the smoke test window.

## Example Reverse Proxy Switch (Nginx)
```
# /etc/nginx/conf.d/appforge.conf
upstream appforge_backend {
  server 10.0.1.10:5000; # blue
  # server 10.0.2.10:5000; # green
}
```

## Rollback
- Revert traffic to blue.
- Confirm stability.
- Investigate green and re-deploy.

## Notes
- Prefer **immutable deploys** with versioned image tags.
- Track release metadata in Sentry.
