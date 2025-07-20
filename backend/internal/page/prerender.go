package page

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"time"
)

type renderReq struct {
	Tag   string         `json:"tag"`
	Props map[string]any `json:"props"`
}

type renderRes struct {
	HTML string `json:"html"`
}

var client = &http.Client{
	Timeout: 2 * time.Second,
}

// Prerender calls your SSR service to render <tag ssr ...> and returns its outerHTML.
func Prerender(tag string, props map[string]any) (template.HTML, error) {
	// build request payload
	reqBody, err := json.Marshal(renderReq{
		Tag:   tag,
		Props: props,
	})
	if err != nil {
		return "", fmt.Errorf("marshal prerender request: %w", err)
	}

	// POST to SSR endpoint
	resp, err := client.Post(
		"http://localhost:3001/render",
		"application/json",
		bytes.NewReader(reqBody),
	)
	if err != nil {
		return "", fmt.Errorf("POST to SSR service failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("SSR service returned status %d", resp.StatusCode)
	}

	// decode response
	var rr renderRes
	if err := json.NewDecoder(resp.Body).Decode(&rr); err != nil {
		return "", fmt.Errorf("decode prerender response: %w", err)
	}

	// return as safe HTML (already includes ssr attr + template)
	return template.HTML(rr.HTML), nil
}
