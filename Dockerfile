# Imagen de producción ligera para Node.js
FROM node:20-alpine

WORKDIR /app

# Copiar solo package.json primero para aprovechar la caché de capas de Docker
COPY package.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar código fuente y frontend
COPY src ./src
COPY public ./public

# Variables de entorno
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Ejecutar como usuario no-root por seguridad
USER node

# Health check integrado
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
