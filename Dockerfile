FROM mhart/alpine-node:14 as build

COPY . /
RUN yarn install
RUN sh /scripts/build-dockerfile

FROM nginx:stable as production
RUN rm -rf /etc/nginx/nginx.conf
ADD nginx.conf  /etc/nginx/nginx.conf
COPY --from=build dist/latest/ /usr/share/nginx/html/
EXPOSE 80

CMD ["/bin/sh", "-c", "exec nginx -g 'daemon off;'"]
