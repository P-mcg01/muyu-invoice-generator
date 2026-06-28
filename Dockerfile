FROM node:24.16.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json .
COPY . .
RUN npm install --omit=dev

EXPOSE 3000
CMD ["npm", "start"]
