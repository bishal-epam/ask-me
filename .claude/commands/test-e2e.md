# Run E2E Tests

Runs Playwright end-to-end tests, optionally filtered to a specific flow.

## Usage

```
/test-e2e [flow]
```

Available flows:
- `auth` — signup, login, logout
- `upload` — document upload and processing
- `chat` — public chatbot interaction
- `dashboard` — profile and persona management
- `interview` — interview request flow

## Steps

1. Ensure dev server is running (`npm run dev`)
2. Run targeted tests:
   ```bash
   npx playwright test tests/e2e/{flow}.spec.ts --reporter=list
   ```
3. On failure, open the HTML report:
   ```bash
   npx playwright show-report
   ```

## Notes

- Uses the seeded test accounts (run `/seed-db` first)
- Screenshots saved to `playwright-report/` on failure
- Run all flows with `npm run test:e2e`
