FROM node:10-alpine
COPY . /usr/src/
WORKDIR /usr/src
RUN yarn
EXPOSE 4000
CMD [ "yarn", "start:prod" ]
