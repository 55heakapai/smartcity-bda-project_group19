FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
RUN mkdir -p logs
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
