# Use Node.js Alpine base image
FROM node:20-alpine

# Install OpenSSL and compatibility libraries required by Prisma engine on Alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and Prisma files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose backend port
EXPOSE 5000

# Entrypoint script: Push schema, seed DB if needed, and start server
CMD ["sh", "-c", "npx prisma db push && npm run seed && node src/server.js"]
