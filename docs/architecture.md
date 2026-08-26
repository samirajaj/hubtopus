# Hubtopus architecture

## Module ownership

`src/app` contains Next.js routes, metadata, route-level error/loading states,
and server entry points. Routes compose features but do not implement GitHub
mapping or domain rules.

`src/features/developer` owns public developer DTOs, GitHub schemas and
transformations, public-data server services, portfolio sections, repository
browsing, and comparison views.

`src/features/workspace` owns authenticated workspace DTOs, private GitHub
services, connection status, queues, maintenance sections, and repository
inventory.

`src/features/operations` owns pull request inspection, operation priority and
deduplication rules, and the repository operations interface.

`src/features/repository-health` owns health finding rules and the repository
health interface.

`src/components/app` contains presentation primitives shared by more than one
feature. `src/components/ui` contains low-level design-system components.

`src/lib/github` contains only GitHub-wide infrastructure: the server-only
transport, error mapping, response parsing, and the `RemoteResult` contract.

## Server and client boundaries

- GitHub transport and feature server services import `server-only`.
- Personal access tokens are accepted only by server modules and are never
  included in returned DTOs.
- Public GitHub requests use explicit revalidation; authenticated requests use
  `cache: "no-store"`.
- Components receive mapped DTOs rather than raw GitHub responses.
- Zod schemas stay beside the server feature that owns the external response.
- Domain modules are deterministic and do not perform network or cookie access.

## Remote data

Optional GitHub responses use `RemoteResult<T>`. Only the `ready` branch has a
`data` field. Callers must narrow `status` or explicitly use `remoteDataOr` with
a fallback. This prevents unavailable data from looking like a real empty
GitHub response.

## Dependency direction

Routes may import features and shared modules. Features may import shared app
components, UI primitives, and `lib`, but feature domain modules must not import
React or Next.js APIs. Shared modules must not import feature implementations.
