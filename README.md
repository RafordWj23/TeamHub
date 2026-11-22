# TeamHub

TeamHub is a web application where college club and intramural sports teams
manage schedules, rosters, and attendance in one place. It replaces group
chats and spreadsheets with a single source of truth, so captains can plan
quickly and players always know where to be.

## Status

**MVP complete (Sprint 1).** Working features:
- Register and log in
- Create a team (the creator becomes captain) and join a team with an invite code
- Captains can create events (practices, games, meetings)
- Team calendar showing upcoming events
- RSVP to events (Going, Maybe, Not going)

**Planned for Sprint 2 and 3:** roster management, attendance summary, edit and
cancel events, announcements, CI/CD pipeline with automated tests, and UI polish.

## Live Demo

(https://teamhub-frontend-880809135221.us-central1.run.app)

## Technology Stack

- **Frontend:** React (Vite), served with Nginx
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Neon in production, Docker container locally)
- **Containers:** Docker and Docker Compose
- **Hosting:** Google Cloud Run
- **CI/CD:** GitHub Actions (planned for Sprint 2)
- **Project management:** Jira and Confluence

## Getting Started

1. Clone the repository:
   `git clone https://github.com/RafordWj23/teamhub.git`
2. Go into the folder: `cd teamhub`
3. Start everything: `docker compose up --build`
4. Open the app at http://localhost:3000 (the API runs at http://localhost:5000)

Docker must be installed and running. The database tables are created
automatically when the backend starts.

## API Overview

| Method | Route | Description |
|---|---|---|
| POST | /api/register, /api/login | Create an account and log in |
| GET, POST | /api/teams | List your teams or create one |
| POST | /api/teams/join | Join a team with an invite code |
| GET, POST | /api/teams/:id/events | List a team's events or create one (captains only) |
| POST | /api/events/:id/rsvp | RSVP to an event |

## Deployment

The backend and frontend are deployed as separate Google Cloud Run services.
The backend connects to a Neon PostgreSQL database through the `DATABASE_URL`
environment variable. The frontend is built with the backend's URL set as
`VITE_API_URL`. Secrets are not stored in the repository.

## Project Management
- Jira: (https://winstonraford.atlassian.net/jira/software/projects/FP/summary)
- Confluence: (https://winstonraford.atlassian.net/wiki/spaces/~712020596640cbc4a54761821d388ebbe2757c/pages/294913/Project+Overview?atlOrigin=eyJpIjoiMjY3MmMwZTE4MzI1NDkxOTg4NjQ1NTg4YTNiMjMwODMiLCJwIjoiYyJ9)

## Git Workflow

Each feature was built on the `main` branch and updated with clear commit comments 


## How AI Helped
[Claude and GitHub Copilot]

- * Generated the starter Express
  API, the PostgreSQL schema, and the React components. I tested them and fixed problems.

- * Helped debug Docker Compose errors, such as running the compose file from the wrong folder and a missing frontend Dockerfile.

- * Helped with Google Cloud deployment, including fixing a
  storage permissions error and connecting the backend to a Neon database.

- * What I did myself: Planned the epics and user stories in Jira, made design decisions, tested every feature, and managed the git branches and pull requests.



