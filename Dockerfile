FROM node:8-alpine
COPY . /usr/src/
WORKDIR /usr/src
RUN yarn
EXPOSE 4000
CMD [ "ls" ]
CMD [ "yarn", "start:prod" ]
