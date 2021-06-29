FROM mhart/alpine-node:14 as build

COPY . /
RUN yarn install
RUN sh /scripts/build-dockerfile

FROM rancher/library-nginx:1.19.2-alpine as production
COPY --from=build dist/latest/ /usr/share/nginx/html/
EXPOSE 8081

CMD ["/bin/sh", "-c", "exec nginx -g 'daemon off;'"]
