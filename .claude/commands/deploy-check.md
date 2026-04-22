# Deploy Check

Pre-deployment validation checklist. Run before any Vercel deployment.

## Usage

```
/deploy-check
```

## Checklist

### Code Quality
- [ ] `npm run type-check` — zero TypeScript errors
- [ ] `npm run lint` — zero ESLint errors/warnings
- [ ] `npm test` — all unit tests pass
- [ ] `npm run test:e2e` — critical E2E flows pass

### Environment
- [ ] All required env vars documented in `.env.example`
- [ ] No `.env.local` secrets committed to git
- [ ] `NEXT_PUBLIC_*` vars are safe to expose client-side

### Database
- [ ] All migrations are sequential with no gaps
- [ ] RLS policies cover all tables
- [ ] New tables have `updated_at` triggers

### Security
- [ ] No hardcoded API keys or secrets in source
- [ ] Webhook endpoints validate `WEBHOOK_SECRET`
- [ ] File upload validates MIME type and size limit
- [ ] All API routes handle unauthorized access (401)

### Performance
- [ ] Images use `next/image` with explicit `width`/`height`
- [ ] Dynamic imports used for heavy components
- [ ] No `console.log` in production code paths

## Steps

1. Run each check and report pass/fail
2. Block deployment if any TypeScript errors or failing unit tests
3. Warn (don't block) on E2E failures with details
