FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY athli-app/package*.json ./athli-app/

WORKDIR /app/athli-app
RUN npm install

WORKDIR /app
COPY athli-app/ ./athli-app/

WORKDIR /app/athli-app

EXPOSE 8081 19000 19006

CMD ["npx", "expo", "start", "--web", "--host", "lan"]
