FROM progrium/busybox
MAINTAINER almavrog@google.com

ADD templates /templates
ADD static /static
ADD dashboard /dashboard
ENTRYPOINT ["/dashboard"]
