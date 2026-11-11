# Secret Rotation Policy

This document describes how to rotate secrets (environment variables, API keys, database passwords, JWT secret, etc.) in the **Gestor de Servicios** project.

## 1. Types of Secrets
- **Database credentials** (`POSTGRES_USER`, `POSTGRES_PASSWORD`).
- **JWT secret** (`JWT_SECRET`).
- **Third‑party API keys** (if any future integrations). 

## 2. Rotation Frequency
- **Critical production secrets** (DB passwords, JWT secret): rotate **every 90 days**.
- **Development secrets**: rotate as needed, preferably when a breach is suspected.

## 3. Rotation Procedure
1. **Generate new secret** (e.g., `openssl rand -hex 32`).
2. **Update `.env.prod`** (or secret manager) with the new value.
3. **Commit change** *only* to the secret store (if using a secret manager) – never commit raw secrets to Git.
4. **Deploy new version**:
   - The CI/CD pipeline will pick up the updated environment variables.
   - Verify the new containers start correctly.
5. **Invalidate old secret**:
   - For JWT, invalidate existing tokens by changing the secret; users will need to re‑authenticate.
   - For DB, the old password will no longer work after deployment.

## 4. Auditing & Logging
- Keep an audit log (e.g., in the repository `docs/secret-rotation-audit.log`) of each rotation with date, person, and secret type.
- Ensure CI runs with `secrets` only, no plain‑text values.

## 5. Emergency Rotation
If a secret is compromised:
- Immediately revoke access (e.g., revoke DB user, invalidate JWT tokens). 
- Follow steps 1‑5 above.
- Notify the security team.

---
*This policy should be reviewed annually and updated as needed.*
