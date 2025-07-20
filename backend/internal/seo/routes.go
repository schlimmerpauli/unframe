package seo

import "github.com/gin-gonic/gin"

func Register(r *gin.Engine) {
	r.GET("/robots.txt", func(c *gin.Context) {
		c.Header("Content-Type", "text/plain")
		c.String(200, "User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml")
	})
	r.GET("/sitemap.xml", func(c *gin.Context) {
		c.Header("Content-Type", "application/xml")
		c.String(200, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>`)
	})
}
