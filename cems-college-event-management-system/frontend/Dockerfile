# Stage 1: Build React static assets with Node.js
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve static files using NGINX web server
FROM nginx:alpine

# Copy built frontend assets to NGINX HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy NGINX configuration for routing SPA routes to index.html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } location /api/ { proxy_pass http://cems-backend:5000; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
