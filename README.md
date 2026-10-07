# StudySync

A collaborative study planner: one course hub per course, with shared tasks, resources, files, and
group membership.

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication

StudySync uses email/password authentication with database-backed sessions (W06 MVP scope).

- **Sign up** — `/signup` → `POST /api/auth/signup` (name, email, password). Passwords are hashed
  with scrypt (`lib/passwords.ts`); the hash is stored on the `User` document.
- **Login** — `/login` → `POST /api/auth/login`. A `Session` row is created and an httpOnly cookie
  (`studysync_session`) is set.
- **Logout** — `Sign out` button on the dashboard → `POST /api/auth/logout` deletes the session row
  and clears the cookie.
- **Session lookup** — `lib/auth.ts` `getSessionUser()` reads the cookie, loads the session from
  MongoDB, checks expiry, and returns the user.
- **Protected routes** — `proxy.ts` performs an optimistic cookie check on `/courses/*` and
  redirects to `/login?next=...` when the cookie is missing. Real authorization happens in every
  API route and server component (`getSessionUser()` + course membership checks).

Advanced auth (OAuth, email verification, password reset, 2FA) is future work.

## Landing page

`/` is public: visitors see `app/components/landing.tsx`. When a session exists, `/` renders the
dashboard (`app/components/dashboard.tsx`) with live stats from MongoDB.

## W06 MVP API surface

### Auth

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/auth/signup` | Create account, sets session cookie |
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/logout` | Destroys the session |
| GET | `/api/auth/me` | Current user, or 401 |

### Courses

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/courses` | Create a course (creator becomes owner) |
| GET | `/api/courses` | List the signed-in user's courses |
| GET | `/api/courses/{courseId}` | Course detail (members only) |
| PATCH | `/api/courses/{courseId}` | Owner updates name/description/color |
| DELETE | `/api/courses/{courseId}` | Owner deletes course + its tasks/resources |

### Tasks

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/tasks` | Create a task (`courseId` required) |
| GET | `/api/tasks` | List tasks in the user's courses (filters: `status`, `assignee`, `courseId`, `limit`) |
| GET | `/api/courses/{courseId}/tasks` | Tasks for one course (nested variant) |
| POST | `/api/courses/{courseId}/tasks` | Create a task in one course (nested variant) |
| GET | `/api/tasks/{taskId}` | Task detail |
| PATCH | `/api/tasks/{taskId}` | Update title/description/dueDate/assignee/status |
| DELETE | `/api/tasks/{taskId}` | Delete a task |

Task statuses: `not-started`, `in-progress`, `completed`.

### Resources

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET/POST | `/api/courses/{courseId}/resources` | List/add resources (links or files) |
| GET/PATCH/DELETE | `/api/resources/{resourceId}` | Read/update/delete one resource |
| GET | `/api/resources/{resourceId}/file` | Download an uploaded file |

The MVP primarily uses **link resources** (URL + metadata). File uploads still work but full
file-storage infrastructure is not part of the MVP focus.

## Dashboard and course workspace

- **Dashboard** (`/`) — course count, active vs completed tasks, overall progress bar, upcoming
  tasks, course list with per-course task summaries, quick actions (new course / new task), and
  the signed-in user's assigned tasks.
- **Course workspace** (`/courses/{courseId}`) — course info, member list (owner can add members),
  task board with statuses and progress, study resources (links + files), empty states, and
  owner-only course settings (rename, edit description, delete).

## Metadata

- `app/layout.tsx` — site-wide title template, description, keywords, Open Graph, and Twitter tags.
- `app/opengraph-image.tsx` — generated 1200×630 social preview image.
- `app/courses/[courseId]/layout.tsx` — `generateMetadata()` builds a title and description from the
  course, but only for members; everyone else gets a generic, `noindex` title.
- `app/robots.ts` and `app/sitemap.ts` — file-based metadata conventions.

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run lint    # ESLint
```
