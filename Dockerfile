FROM node:22-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY data ./data
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY --from=frontend /app/dist ./dist
COPY data ./data
COPY server/app.py ./server/app.py
ENV PORT=10000
EXPOSE 10000
USER 65534:65534
CMD ["python", "-m", "server.app"]
