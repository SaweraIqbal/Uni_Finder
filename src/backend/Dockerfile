# Backend (Express + MySQL) container
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the backend source
COPY . .

# Uploaded files live here (mounted as a volume in docker-compose)
RUN mkdir -p uploads

EXPOSE 5000

# Run directly with node (nodemon is only for local dev)
CMD ["node", "server.js"]
