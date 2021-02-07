FROM node:14-alpine

RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json /opt/app/
RUN npm install

COPY index.js /opt/app/

EXPOSE 443
ENTRYPOINT [ "node", "index.js" ]