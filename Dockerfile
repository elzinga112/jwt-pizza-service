ARG NODE_VERSION=20.11.0

FROM node:${NODE_VERSION}-alpine
WORKDIR /usr/src/app
COPY . .
RUN npm ci
EXPOSE 80
CMD ["node", "index.js", "80"]