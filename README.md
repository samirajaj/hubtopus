# Hubtopus

Hubtopus is a focused GitHub developer explorer. Search for a GitHub username or profile URL to see a clear dashboard built from that developer's real public GitHub data.

## Features

- Shareable developer pages at `/developers/[username]`
- Accurate profile, repository, follower, following, star, and fork totals
- Complete repository pagination through the GitHub REST API
- Primary-language distribution across source repositories
- Factual portfolio brief covering original work, maintenance, and impact concentration
- Recent public pull requests contributed outside the developer's own repositories
- Community health and latest-release analysis for up to three notable source repositories
- Public organizations and open-source interests derived from recently starred repositories
- Notable source repositories and a searchable, sortable repository browser
- Human-readable recent public activity
- Shareable side-by-side developer comparisons without synthetic scoring
- Copy-link and print/PDF export actions
- Encrypted, HttpOnly bring-your-own-token sessions
- Private workspace with accessible public and private repositories
- Personal queues for assigned issues, requested reviews, and authored pull requests
- Permission-aware notifications and latest GitHub Actions failure checks
- Repository maintenance signals for descriptions, licenses, topics, and activity
- Explicit not-found, rate-limit, empty, loading, and unexpected-error states
- Responsive light and dark themes

## Technology

Hubtopus uses Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui primitives, Lucide icons, Zod, and the GitHub REST API.

## Local development

```bash
npm install
```

Create `.env.local` from `.env.example` and set a session secret before using
the private workspace:

```dotenv
HUBTOPUS_SESSION_SECRET=replace_with_at_least_32_random_characters
```

Then start the application:

```bash
npm run dev
```

Open `http://localhost:3000`.

## GitHub token (optional)

Public developer pages work without credentials, but unauthenticated GitHub API requests have a low hourly rate limit. To increase it, add a shared server token to `.env.local`:

```dotenv
GITHUB_TOKEN=your_token_here
SITE_URL=https://your-production-domain.example
```

The token is read only on the server. Never prefix it with `NEXT_PUBLIC_` or commit `.env.local`.

## Private workspace security

Users can connect a personal access token at `/connect`. Hubtopus validates the token with GitHub, encrypts it with AES-256-GCM, and stores only the encrypted value in an HttpOnly session cookie. Production cookies also use `Secure`, `SameSite=Lax`, the `__Host-` prefix, a root path, and a seven-day expiration. Disconnecting deletes the cookie.

Authenticated GitHub requests use `cache: "no-store"`; private responses are not added to the shared Next.js data cache. Session mutations accept only same-origin requests, token inputs are bounded, and workspace responses carry `Cache-Control: private, no-store`. Deploy the private workspace only over HTTPS and rotate `HUBTOPUS_SESSION_SECRET` if it may have been exposed. Changing the secret invalidates existing sessions.

Start with a read-only fine-grained token restricted to the repositories the user wants to inspect. GitHub's notifications endpoint may require a compatible classic token. Optional sections fail independently when the token lacks an endpoint permission.

Repository discovery is bounded at 500 accessible repositories. Latest workflow status checks are limited to six recently updated, non-fork repositories that the user can maintain.

GitHub responses are cached for 15 minutes to reduce duplicate requests. The complete repository list is treated as core data; contribution search, organizations, stars, community health, releases, and events degrade independently if GitHub cannot return them. Repository-level analysis is intentionally limited to three source projects to avoid an N+1 request pattern.

## Production checks

```bash
npm run lint
npm run build
npm start
```
