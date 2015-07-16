FROM progrium/busybox
MAINTAINER almavrog@google.com

ADD pages /pages
ADD static /static
ADD app /static/js/app
ADD dashboard /dashboard
ENTRYPOINT ["/dashboard"]
