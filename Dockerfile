FROM node:latest

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install -g typescript && npm install -g tsx

COPY . .

EXPOSE 3000
CMD ["npm", "start"]