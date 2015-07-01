#!/bin/bash

set -e

pushd $( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
godep go build -a github.com/GoogleCloudPlatform/dashboard

docker build -t afein/dashboard:latest .
popd
