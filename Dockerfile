# Upgrade ke Node 22 Alpine
FROM node:22-alpine

WORKDIR /app

# Copy dependency list dulu
COPY package.json package-lock.json* ./

# Install dependency (clean install biar ga bentrok)
RUN npm install

# Copy sisa source code (sekarang aman karena node_modules host di-ignore)
COPY . .

# Generate Prisma
RUN npx prisma generate

# Build aplikasi
RUN npm run build

EXPOSE 3000

# Karena lu pake Vite/React (berdasarkan package.json lu), gunakan command ini:
CMD ["npm", "run", "dev"]