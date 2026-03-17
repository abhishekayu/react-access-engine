# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in react-access-engine, please report it responsibly.

**Do not open a public issue.**

Instead, email **[security@react-access-engine.dev](mailto:security@react-access-engine.dev)** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive an acknowledgment within **48 hours** and a detailed response within **5 business days**.

## Disclosure Policy

- We will work with you to understand and address the issue before any public disclosure.
- We aim to release a fix within **14 days** of confirming a vulnerability.
- Credit will be given to the reporter in the release notes (unless you prefer to remain anonymous).

## Scope

This policy applies to the `react-access-engine` npm package and the code in this repository. It does not cover third-party services, documentation sites, or example applications.

## Best Practices

When using react-access-engine in production:

- **Never trust the client alone** — always enforce permissions on your backend using the exported engine functions.
- **Keep your access config server-side** when it contains sensitive policy details.
- **Use remote config signature verification** to prevent config tampering.
- **Audit access decisions** using the plugin system (`createAuditLoggerPlugin`).
