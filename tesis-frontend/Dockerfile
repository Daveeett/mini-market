FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN npm run build

#produccion
FROM nginx:alpine

# nginx configuracion
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular archivos compilados a Nginx web root
COPY --from=builder /app/dist/tesis-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
