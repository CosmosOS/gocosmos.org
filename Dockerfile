FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM php:8.2-apache
RUN echo "ServerName gocosmos.org" > /etc/apache2/conf-available/servername.conf && a2enconf servername
COPY --from=build /app/html /var/www/html
