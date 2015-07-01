// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	"github.com/GoogleCloudPlatform/kubernetes/pkg/client"
	"github.com/gin-gonic/gin"
	"github.com/golang/glog"
)

var (
	argPort              = flag.Int("port", 8289, "Port to listen to")
	argIp                = flag.String("listen_ip", "", "IP to listen on, defaults to all IPs")
	argHeadless          = flag.Bool("headless", false, "Headless mode should be enabled if the dashboard is running outside of a Kubernetes cluster")
	argHeapsterURL       = flag.String("heapster_url", "", "URL of the Heapster API. Used only during headless mode")
	argHeapsterService   = flag.String("heapster_service", "monitoring-heapster2", "Name of the Heapster service")
	argHeapsterNamespace = flag.String("heapster_namespace", "default", "Namespace where Heapster is operating")
)

// heapster_url is a package variable, initialized by main() and available to all request handlers
var heapster_url string

func getKubeHeapsterURL() string {
	cl, err := client.NewInCluster()
	if err != nil {
		glog.Fatalf("unable to create Kubernetes API client: %s", err)
	}

	services := cl.Services(*argHeapsterNamespace)
	heapster_service, err := services.Get(*argHeapsterService)
	if err != nil {
		glog.Fatalf("unable to locate Heapster service: %s", *argHeapsterService)
	}

	heap_ip := heapster_service.Spec.ClusterIP
	if strings.Count(heap_ip, ".") != 3 {
		glog.Fatalf("invalid cluster IP address for the Heapster Service: %s", heap_ip)
	}
	if len(heapster_service.Spec.Ports) == 0 {
		glog.Fatalf("no heapster Ports registered")
	}

	heap_port := heapster_service.Spec.Ports[0].Port
	if heap_port == 0 {
		glog.Fatalf("heapster port is 0")
	}

	heapster_root := fmt.Sprintf("http://%s:%d", heap_ip, heap_port)
	resp, err := http.Get(heapster_root)
	if err != nil {
		glog.Fatalf("unable to GET %s", heapster_root)
	}
	if resp.StatusCode != 200 {
		glog.Fatalf("GET %s responded with status code: %d", heapster_root, resp.StatusCode)
	}

	return heapster_root
}

func getHeapsterAvailableMetrics() []string {
	var metrics []string
	metric_url := heapster_url + "/api/v1/schema/metrics"
	resp, err := http.Get(metric_url)
	if err != nil {
		glog.Fatalf("unable to GET %s", metric_url)
	}
	if resp.StatusCode != 200 {
		glog.Fatalf("GET %s responded with status code: %d", metric_url, resp.StatusCode)
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		glog.Fatalf("unable to read response body from %s", metric_url)
	}
	json.Unmarshal(body, &metrics)
	glog.Infof("%s", metrics)
	return metrics
}

func main() {
	defer glog.Flush()
	flag.Parse()
	glog.Infof(strings.Join(os.Args, " "))
	glog.Infof("Dashboard version 0.1alpha")
	glog.Infof("Starting dashboard on port %d", *argPort)

	if !*argHeadless {
		heapster_url = getKubeHeapsterURL()
	} else {
		heapster_url = *argHeapsterURL
	}

	r := setupHandlers()

	addr := fmt.Sprintf("%s:%d", *argIp, *argPort)
	r.Run(addr)
	os.Exit(0)
}

func setupHandlers() *gin.Engine {
	r := gin.Default()
	r.Static("/static", "./static")

	// Load templates
	r.LoadHTMLGlob("templates/*.html")

	// Configure routes
	r.GET("/", homeController)
	r.GET("/api/*uri", apiController)
	r.GET("/metrics/", metricsController)
	return r
}

func metricsController(c *gin.Context) {
	c.JSON(200, gin.H{"metrics": getHeapsterAvailableMetrics()})
}

func homeController(c *gin.Context) {
	vars := gin.H{}
	c.HTML(200, "home.html", vars)
}

func apiController(c *gin.Context) {
	uri := c.Request.RequestURI
	metric_url := heapster_url + uri
	resp, err := http.Get(metric_url)
	if err != nil {
		glog.Fatalf("unable to GET %s", metric_url)
	}
	if resp.StatusCode != 200 {
		glog.Errorf("GET %s responded with status code: %d", metric_url, resp.StatusCode)
		return
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		glog.Errorf("unable to read response body from %s", metric_url)
		return
	}

	_, err = c.Writer.Write(body)
	if err != nil {
		glog.Errorf("unable to write body to response for %s", uri)
	}
}
