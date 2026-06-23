# Auth Backend Setup

Install the backend packages in the real Next.js project:

```bash
npm install next-auth @next-auth/prisma-adapter @prisma/client @googleapis/drive
npm install --save-dev prisma
```

Place the files from `deliverables/src` into the matching `src` paths in the Next.js App Router project, then place `deliverables/schema.prisma` at `prisma/schema.prisma`.

Required environment variables:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/second_brain?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-strong-random-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

Google Cloud Console configuration:

1. Go to `APIs & Services > OAuth consent screen`.
2. Choose External or Internal based on your organization, then fill app name, support email, and developer contact email.
3. Add scopes: `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/drive.file`.
4. Add test users while the app is in Testing mode.
5. Go to `APIs & Services > Credentials > Create Credentials > OAuth client ID`.
6. Choose Web application.
7. Add authorized JavaScript origins:
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.example`
8. Add authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.example/api/auth/callback/google`
9. Enable the Google Drive API from `APIs & Services > Library`.

Run Prisma after the env vars are present:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

