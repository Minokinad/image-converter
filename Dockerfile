FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && exec node server.js"]
