# Contributing to CRUD Blog API

Contributions and bug reports are welcome!

## Development Workflow

1. Fork the repository and create a branch:
   ```bash
   git checkout -b feat/your-improvement
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Run tests before and after making changes:
   ```bash
   npm test
   ```

## Guidelines

- Never commit `.env` files or database credentials.
- Escape user-provided search strings with `escapeRegex()` before constructing MongoDB `RegExp` filters.
- Keep controllers injectable via `createBlogController(BlogModel)` and update `tests/blog.test.js` for any new endpoint behavior.
