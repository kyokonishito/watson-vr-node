FROM node:10
ARG project_dir=/app/

RUN apt-get update

WORKDIR $project_dir

COPY package*.json ./
RUN npm install

COPY public ./public
COPY app.js ./
COPY routes ./routes

EXPOSE 3000
CMD [ "node", "app.js" ]

