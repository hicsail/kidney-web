FROM node:21-alpine

WORKDIR /app

COPY . .

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown nextjs:nodejs .
USER nextjs

RUN npm ci
RUN npm run build

ENV NODE_ENV production
EXPOSE 3000

CMD PORT=3000 HOSTNAME=0.0.0.0 npm run start
