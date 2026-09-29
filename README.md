# Financial Crime Scene — DPI-HT-01

Static Next.js application for the Divorce Party International Ltd. takeover accounting reconstruction at 31 August 2026.

## Included routes

- `/` — complete evidence, decision, schedule, statement, reconciliation, uncertainty and board review.
- `/review` — compact assessor view of the 25 material judgments, disagreements, overrides, low-confidence decisions and qualifications.
- `/submission.json` — schema-valid machine-readable submission containing D001–D100.

Student identity is intentionally present only in `submission.json`.

## Local use

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Verification

```bash
pnpm validate
pnpm lint
pnpm build
```

`pnpm validate` checks the official JSON schema, decision counts and IDs, required review fields, balance-sheet equality, closing cash and reconstructed profit.

## Regenerating case data

The generated submission is committed in `public/submission.json`. If the approved handoff changes, rerun `scripts/generate-case-data.py` with the handoff path, official Codex ZIP path and `public` as the output directory, then repeat all verification commands.

## Later publication

This project is ready for a standard Next.js deployment. Push it to the student's GitHub repository, import that repository into Vercel, deploy, and then verify `/`, `/review` and `/submission.json` in a private browser window. No login, database or API keys are required.
