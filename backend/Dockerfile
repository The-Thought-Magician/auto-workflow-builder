FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other required system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --production

COPY prisma ./prisma
COPY src ./src

ENV NODE_ENV=production

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/index.js"]