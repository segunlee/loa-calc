# BUILD
FROM node:17.7.1-alpine AS build
RUN mkdir -p /app
WORKDIR /app

COPY package*.json /app
RUN npm install
RUN npm install -g @angular/cli

COPY . /app
RUN ng build

# RUN
FROM nginx:1.17.1-alpine
COPY --from=build app/dist/loa-calc /usr/share/nginx/html

# docker build -t segunleedev/loa-calc:lastest .
# docker save segunleedev/loa-calc | gzip > ./Dockerfile/loa-calc.tar.gz