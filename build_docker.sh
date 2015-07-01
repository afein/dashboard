#!/bin/bash

set -e

godep go build -a github.com/GoogleCloudPlatform/dashboard
docker build -t afein/dashboard:latest .
docker push afein/dashboard:latest
