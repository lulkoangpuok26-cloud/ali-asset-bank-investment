# Ali Asset Bank Investment

A sleek English-first banking and investment web application with:

- invite-link-only registration
- investment plans with real yield percentages
- dividend tracking and returns
- referral-based promotion rewards
- JWT authentication and PIN protection
- React + Tailwind frontend
- Express + Prisma + SQLite backend

## Tech stack

- Frontend: React, Tailwind CSS, Lucide icons
- Backend: Node.js, Express
- Database: SQLite + Prisma
- Security: bcrypt + JWT + PIN checks

## Demo login

- Email: admin@aliassetbank.com
- Password: Password123!
- PIN: 123456

## Setup

```bash
npm install
npm install --workspace server
npm install --workspace client
npx prisma migrate dev --name init
node server/data/seed.js
npm run dev
```

Open:
- frontend: http://localhost:5173
- API: http://localhost:4000/api/health
