# Task Manager

## Project structure

```text
task-manager/
├── backend/
│   ├── accounts/              # Registration, login, and user APIs
│   ├── config/                # Django settings and URL configuration
│   ├── tasks/
│   │   ├── management/commands/
│   │   │   └── send_task_reminders.py
│   │   ├── migrations/        # Database schema migrations
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # Backend API clients
│   │   ├── components/        # Shared React components
│   │   ├── context/           # Authentication and toast contexts
│   │   ├── pages/             # Dashboard, task, and account pages
│   │   ├── App.jsx
│   │   └── index.css
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Run with Docker Compose

From the project root, run:

```sh
docker compose up --build
```

The app is available at `http://localhost:5173`; Django runs at
`http://localhost:8000`. The Compose credentials are for local development
only. Set production secrets and email settings outside the Compose defaults.

When deploying against an existing database, apply Django migrations. The
email-uniqueness migration stops with an explicit error if existing user email
addresses are duplicated; resolve those duplicates before retrying it.

## Due-date email reminders

Configure Django's `EMAIL_*` settings, then schedule this command to run once a
day (for example, with cron or your platform's scheduler):

```sh
python manage.py send_task_reminders
```

The command emails outstanding tasks due tomorrow and records successful
reminders so rerunning it does not send duplicates. The default email backend
prints messages to the backend console.
