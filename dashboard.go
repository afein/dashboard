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
	"flag"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/GoogleCloudPlatform/kubernetes/pkg/client"
	"github.com/gin-gonic/gin"
	"github.com/golang/glog"
)

var (
	argPort            = flag.Int("port", 8289, "port to listen to")
	argIp              = flag.String("listen_ip", "", "IP to listen on, defaults to all IPs")
	argHeadless        = flag.Bool("headless", false, "True if the dashboard is running outside of a Kubernetes cluster")
	argHeapsterService = flag.String("heapster_service", "monitoring-heapster", "Name of the Heapster service")
)

func main() {
	defer glog.Flush()
	flag.Parse()
	glog.Infof(strings.Join(os.Args, " "))
	glog.Infof("Dashboard version 0.1alpha")
	glog.Infof("Starting dashboard on port %d", *argPort)

	if !*argHeadless {
		cl, err := client.NewInCluster()
		if err != nil {
			glog.Errorf("Unable to create internal Kube client")
		}
		services := cl.Services("default")
		heapster_service, err := services.Get(*argHeapsterService)
		if err != nil {
			glog.Errorf("Unable to locate Heapster service: %s", *argHeapsterService)
		}
		glog.Infof("heapster service: %s", heapster_service)
		heap_ip := heapster_service.Spec.ClusterIP
		glog.Infof("heapster ip: %s", heap_ip)
		if len(heapster_service.Spec.Ports) == 0 {
			glog.Errorf("No Heapster Ports registered")
		}
		heap_port := heapster_service.Spec.Ports[0].Port
		glog.Infof("heapster nodeport: %d", heap_port)

		resp, err := http.Get(fmt.Sprintf("http://%s:%d", heap_ip, heap_port))
		if err != nil {
			glog.Errorf("Unable to GET root")
		}
		glog.Infof("root heapster: %s", resp)

		resp, err = http.Get(fmt.Sprintf("http://%s:%d/api/v1/metric-export", heap_ip, heap_port))
		if err != nil {
			glog.Errorf("Unable to GET root")
		}
		glog.Infof("metric-export: %s", resp)
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
	r.GET("/", homeController)
	return r
}
