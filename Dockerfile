FROM nginx:1.27-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY design.css /usr/share/nginx/html/design.css
COPY script.js /usr/share/nginx/html/script.js

EXPOSE 80
