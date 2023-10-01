FROM node:19-alpine
ADD . /app
WORKDIR /app
RUN cd /app && npm install
EXPOSE 8000
CMD [ "node" , "index.js"]
