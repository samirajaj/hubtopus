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
- Explicit not-found, rate-limit, empty, loading, and unexpected-error states
- Responsive light and dark themes

## Technology

Hubtopus uses Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui primitives, Lucide icons, Zod, and the GitHub REST API.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## GitHub token (optional)

The application works without credentials, but unauthenticated GitHub API requests have a low hourly rate limit. To increase it, create `.env.local` and add a GitHub token:

```dotenv
GITHUB_TOKEN=your_token_here
SITE_URL=https://your-production-domain.example
```

The token is read only on the server. Never prefix it with `NEXT_PUBLIC_` or commit `.env.local`.

GitHub responses are cached for 15 minutes to reduce duplicate requests. The complete repository list is treated as core data; contribution search, organizations, stars, community health, releases, and events degrade independently if GitHub cannot return them. Repository-level analysis is intentionally limited to three source projects to avoid an N+1 request pattern.

## Production checks

```bash
npm run lint
npm run build
npm start
```
