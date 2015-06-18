all: build

TAG = v0.14.2
PREFIX = gcr.io/google_containers
FLAGS = 

deps:
	go get github.com/tools/godep

build: clean deps
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go generate github.com/GoogleCloudPlatform/dashboard
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 godep go build -a github.com/GoogleCloudPlatform/dashboard/...
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 godep go build -a github.com/GoogleCloudPlatform/dashboard

sanitize:
	hooks/check_boilerplate.sh
	hooks/check_gofmt.sh
	hooks/run_vet.sh

test-unit: clean deps sanitize build
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 godep go test --test.short github.com/GoogleCloudPlatform/dashboard/... $(FLAGS)

test-unit-cov: clean deps sanitize build
	hooks/coverage.sh

test-integration: clean deps build
	godep go test -v --timeout=30m github.com/GoogleCloudPlatform/dashboard/integration/... --vmodule=*=2 $(FLAGS)

container: build
	cp ./dashboard ./deploy/docker/dashboard
	docker build -t $(PREFIX)/dashboard:$(TAG) ./deploy/docker/

clean:
	rm -f dashboard
	rm -f ./deploy/docker/dashboard


