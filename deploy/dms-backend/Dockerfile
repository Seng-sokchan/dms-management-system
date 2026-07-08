FROM node:21.5.0-alpine

WORKDIR /app

RUN npm install -g pm2

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./
RUN rm -f .env .env.*

# Remove leftover configurable-rules code if an outdated backend/ was copied.
COPY deploy/dms-backend/strip-legacy-rules.sh /tmp/strip-legacy-rules.sh
RUN chmod +x /tmp/strip-legacy-rules.sh \
  && /tmp/strip-legacy-rules.sh /app \
  && rm -f /tmp/strip-legacy-rules.sh

COPY deploy/dms-backend/ecosystem.config.js ./ecosystem.config.js

RUN mkdir -p logs

ENV NODE_ENV=production
EXPOSE 4000

CMD ["pm2-runtime", "ecosystem.config.js"]
