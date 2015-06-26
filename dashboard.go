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
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang/glog"
)

var (
	argPort     = flag.Int("port", 8080, "port to listen to")
	argIp       = flag.String("listen_ip", "", "IP to listen on, defaults to all IPs")
	argMaxProcs = flag.Int("max_procs", 0, "max number of CPUs that can be used simultaneously. Less than 1 for default (number of cores).")
)

func main() {
	defer glog.Flush()
	flag.Parse()
	glog.Infof(strings.Join(os.Args, " "))
	glog.Infof("Dashboard version 0.1alpha")
	glog.Infof("Starting dashboard on port %d", *argPort)

	r := setupHandlers()
	addr := fmt.Sprintf("%s:%d", *argIp, *argPort)
	r.Run(addr)
	os.Exit(0)
}

func setupHandlers() *gin.Engine {
	r := gin.Default()
	r.LoadHTMLGlob("templates/*.html")
	r.GET("/", homeController)
	return r
}
