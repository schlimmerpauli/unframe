package page

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Register(r *gin.Engine) {
	r.GET("/", func(c *gin.Context) {
		// Render our SSR component

		widget, err := Prerender("hello-widget", map[string]any{
			"message": "Hello from Web Component!",
		})
		if err != nil {
			c.String(http.StatusInternalServerError, err.Error())
			return
		}
		ssr_widget, err := Prerender("ssr-hello-widget", map[string]any{
			"message": "Hello from SSR Web Component!",
		})
		if err != nil {
			c.String(http.StatusInternalServerError, err.Error())
			return
		}

		// Serve our HTML template, injecting the prerendered widget
		c.HTML(http.StatusOK, "hello.html", gin.H{
			"Title":        "SSR + Web Component Demo",
			"Description":  "A Go + Gin page with SSR’d Web Component.",
			"URL":          "https://example.com/",
			"Message":      "Hello, World!",
			"WidgetRaw":    widget,
			"WidgetSSRRaw": ssr_widget,
		})
	})

	r.GET("/dashboard", func(c *gin.Context) {
		items, err := PrerenderBatch([]renderReq{
			{Tag: "ssr-hello-widget", Props: map[string]any{"name": "Alice"}},
			{Tag: "ssr-hello-widget", Props: map[string]any{"name": "Bob"}},
			// {Tag: "stats-widget", Props: map[string]any{"period": "7d"}},
		})
		if err != nil {
			c.String(500, err.Error())
			return
		}
		c.HTML(200, "dashboard.html", gin.H{
			"W1": items["ssr-hello-widget"],
		})
	})

}
