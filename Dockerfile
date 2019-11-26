FROM node:8-alpine
COPY . /usr/src/
WORKDIR /usr/src
RUN yarn
WORKDIR ./
EXPOSE 4000
CMD [ "yarn", "start:prod" ]
