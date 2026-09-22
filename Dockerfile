FROM node:24.12.0-bookworm-slim AS build
WORKDIR /app
COPY src/package*.json ./src/
RUN cd src && npm ci
COPY src ./src
COPY scripts ./scripts
# Never bake the checked-in site's environment or local operator configuration.
RUN rm -f src/.env src/.env.*
ENV SOURCEDAO_BACKEND_URL=http://backend:3333
RUN cd src && npm run build

FROM node:24.12.0-bookworm-slim
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3050
WORKDIR /app
COPY --from=build --chown=node:node /app/src/.next/standalone ./
COPY --from=build --chown=node:node /app/src/.next/static ./.next/static
COPY --from=build --chown=node:node /app/src/public ./public
USER node
EXPOSE 3050
CMD ["node", "server.js"]
