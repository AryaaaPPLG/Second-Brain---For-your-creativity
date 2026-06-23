<div align="center">
  <!-- TIPS: Ganti URL_GAMBAR_LU dengan link screenshot dashboard Second Brain lu yang keren itu! -->
  <img alt="Second Brain Dashboard" src="URL_GAMBAR_LU" width="1000" />
</div>

# 🧠 Second Brain: Production-Grade Productivity Workspace

A full-stack, containerized productivity application designed to function as a highly secure, personal "Second Brain". Built to handle dynamic note management, strict data isolation, and AI-driven workflow optimization.

## ✨ Key Features
* **Strict Tenant Isolation:** Robust backend logic leveraging PostgreSQL and Prisma to ensure absolute user data privacy.
* **AI-Powered Workspace:** Integrated with Gemini AI for dynamic content summarization, automated tagging, and structural refinement.
* **Aesthetic UI/UX:** Engineered with Tailwind CSS and Shadcn UI, featuring a responsive, grid-based dark mode dashboard.
* **Production-Ready Infrastructure:** Fully containerized utilizing Docker and Docker Compose (Node Alpine) for optimized builds and seamless deployment consistency.

## ⚙️ Core Tech Stack
* **Frontend:** Next.js (App Router), React.js, Tailwind CSS, Shadcn UI, Framer Motion
* **Backend:** Next.js Server Actions, NextAuth.js (Google OAuth 2.0)
* **Database:** PostgreSQL managed via Prisma ORM
* **DevOps:** Docker, Docker Compose, Linux Administration

## 🚀 Quick Start (Containerized Deployment)

This application is fully containerized for a seamless, cross-platform deployment experience.

### Prerequisites
Ensure you have [Docker](https://www.docker.com/) and Docker Compose installed on your local machine.

### Installation Steps

1. **Clone the repository:**
```bash
   git clone [https://github.com/aryaaapplg/second-brain.git](https://github.com/aryaaapplg/second-brain.git)
   cd second-brain

```
2. ***Environment Configuration:***
Create a .env file in the root directory based on .env.example and insert your credentials:

Cuplikan kode
   # Database Configuration
   DATABASE_URL="postgresql://USER:PASSWORD@postgres:5432/second_brain?schema=public"

   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secure-random-string"

   # Google OAuth 2.0 Credentials
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
Spin up the infrastructure:
Build and start the containers in the background:

Bash
   sudo docker-compose up -d --build
Access the application:
Open your web browser and navigate to http://localhost:3000.

👨‍💻 Architect
Arya Prana Jaya

<a href="www.linkedin.com/in/arya-prana-jaya-754500385">LinkedIn</a>
<a href="https://github.com/aryaaapplg">Github</a>
