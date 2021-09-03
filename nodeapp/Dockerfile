FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ .
USER ubuntu
ENV PORT=5000
EXPOSE 5000
CMD ["npm", "run", "start"]
