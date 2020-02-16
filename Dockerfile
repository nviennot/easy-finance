FROM node:alpine3.10

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY components components
COPY lib lib
COPY pages pages

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
