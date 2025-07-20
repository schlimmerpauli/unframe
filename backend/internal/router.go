package internal

import (
	"github.com/gin-gonic/gin"
	"rbyte.eu/example/go-web-components-ssr/internal/api"
	"rbyte.eu/example/go-web-components-ssr/internal/page"
	"rbyte.eu/example/go-web-components-ssr/internal/seo"
)

func BuildRouter() *gin.Engine {
	router := gin.Default()

	/* templates & static */

	router.LoadHTMLGlob("templates/*.html")
	router.Static("/static", "./static")

	/* feature groups */
	page.Register(router)
	seo.Register(router)
	api.Register(router.Group("/api"))

	return router
}
