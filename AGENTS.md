<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:database-rules -->
# Database changes

- NEVER run `db:generate`, `db:push`, `db:migrate`, or any drizzle-kit migration command.
- Schema files (`db/schemas/*`) may be edited, but the user applies migrations to the database themselves.
<!-- END:database-rules -->
