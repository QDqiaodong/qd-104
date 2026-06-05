FROM docker.m.daocloud.io/library/node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html postcss.config.js tailwind.config.js tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM docker.m.daocloud.io/library/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
