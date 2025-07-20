package api

import "github.com/gin-gonic/gin"

func Register(r *gin.RouterGroup) {
	r.GET("/hello", func(c *gin.Context) { c.JSON(200, gin.H{"msg": "Hello from Go API"}) })
	r.GET("/foobar", func(c *gin.Context) { c.JSON(200, gin.H{"msg": "Hot Reload works!"}) })
}
