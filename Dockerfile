FROM node:alpine
# Install app dependencies
WORKDIR /app
ENV NODE_ENV production
COPY package.json ./package.json
RUN npm install --verbose

# FROM alpine-node:base-alpine

COPY gstock-6dab8-firebase-adminsdk-ql4io-4840376e3f.json ./


COPY ./build/webpack.prod.config.js ./build/
COPY log ./log
COPY tsconfig.json ./
COPY src ./src

RUN npm run build
# Bundle app source
EXPOSE 3000
VOLUME [ "/app/dist/uploads" ]
VOLUME [ "/app/log" ]
VOLUME [ "/app" ]
# Run app
CMD [ "npm","run","serve" ]

