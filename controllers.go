package main

import (
	"github.com/gin-gonic/gin"
)

func homeController(c *gin.Context) {
	vars := gin.H{}
	c.HTML(200, "home.html", vars)
}
