FROM node:12-alpine3.14
WORKDIR /app
COPY package*.json ./
ARG NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; \
        then npm install; \
        else npm install --only=production; \
        fi
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start"]