# CRUD Blog API (Node.js, Express & MongoDB)

A clean RESTful Blog API built with **Express 5** and **Mongoose**, featuring input validation, field-whitelisted updates, search/author filtering, centralized error handling, and a simple browser test client in `public/`.

## Features

- Full CRUD lifecycle for blog posts (`POST`, `GET`, `PUT`, `DELETE`)
- Schema-level validation (`trim`, `minlength`, `maxlength`) and explicit MongoDB `ObjectId` checks
- Query filtering by author (`?author=`) and full-text search (`?q=`), sorted newest-first
- CORS support, `/health` endpoint, centralized 404/error middleware, and graceful shutdown
- Environment-based configuration via `.env` (see `.env.example`)

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health and uptime check |
| `POST` | `/blogs` | Create a new blog post (`title`, `body`, optional `author`) |
| `GET` | `/blogs` | List posts (supports `?author=` and `?q=` query params) |
| `GET` | `/blogs/:id` | Retrieve a single post by ID |
| `PUT` | `/blogs/:id` | Update `title`, `body`, and/or `author` with schema validation |
| `DELETE` | `/blogs/:id` | Delete a post by ID |

## Setup & Run

```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
npm install
npm run dev
```

For production:

```bash
npm start
```
