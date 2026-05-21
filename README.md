# INTPROG Final Project — Backend API

## Live URLs
- Backend API: https://node-mysql-api-ndpr.onrender.com
- Swagger Docs: https://node-mysql-api-ndpr.onrender.com/api-docs
- Frontend: https://angular-21-auth-boilerplate-g0qk.onrender.com

## Local Development

### Install dependencies
```bash
npm install
```

### Configure locally
Create a `config.json` file (do NOT commit this to GitHub):
```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "node_mysql_api"
  },
  "secret": "your-local-jwt-secret",
  "emailFrom": "info@example.com",
  "smtpOptions": {
    "host": "smtp.ethereal.email",
    "port": 587,
    "auth": {
      "user": "your-ethereal-user",
      "pass": "your-ethereal-pass"
    }
  }
}
```

### Run locally
```bash
npm run dev
```

Server: `http://localhost:4000`
Swagger: `http://localhost:4000/api-docs`

## Production Deployment (Render)

Set these Environment Variables in Render:

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host from your DB provider |
| `DB_PORT` | MySQL port (usually 3306) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Long random secret string |
| `CORS_ORIGIN` | Your frontend URL on Render |
| `COOKIE_SECURE` | Set to `true` |
| `EMAIL_FROM` | Sender email address |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

### Build & Start commands on Render
- **Build:** `npm install && npm run build`
- **Start:** `npm start`
