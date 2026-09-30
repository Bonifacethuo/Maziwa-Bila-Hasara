# Security policy

This is a static, device-local pilot. There are no server accounts, roles, authenticated collector results, or shared records. Farm records and exported backups are unencrypted. Anyone with access to the browser profile or a downloaded backup may read them. GitHub Pages hosts the public application code; never commit farmer records, credentials, or private backups.

## Implemented safeguards

- Restrictive HTML Content Security Policy and no-referrer policy; no remote scripts or analytics.
- Escaped record text, spreadsheet formula protection, bounded backup size and strict record validation.
- Commit-after-save behavior, damaged-data recovery, cross-tab change detection, confirmed restore/deletion.
- App-scoped offline asset caching that preserves unrelated caches.

A static HTML CSP cannot provide all HTTP response protections (for example, `frame-ancestors`). Shared-origin GitHub Pages hosting is not an isolation boundary against other code running on the same origin. Local storage and these controls are not a substitute for authentication, encryption, or operating-system device security.

## Reporting

Do not publish sensitive farmer data or exploit details in a public issue. Use GitHub's private vulnerability reporting if the repository owner has enabled it; otherwise contact the owner through a private channel already known to you. For non-sensitive bugs, open an issue with browser, app version, steps, and synthetic sample records.

## Before a shared field deployment

Design and test server authentication and authorization, least-privilege farmer/collector/vet roles, immutable audit history, verified collection results, encryption, recovery, retention and consent. Include an independent security review. This app never certifies milk safety or replaces veterinary instructions and collection-point tests.
