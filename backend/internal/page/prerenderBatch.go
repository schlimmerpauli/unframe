package page

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
)

type batchReq struct {
	Components []renderReq `json:"components"`
}
type batchItem struct {
	Tag    string `json:"tag"`
	HTML   string `json:"html"`
	Error  string `json:"error,omitempty"`
	Cached bool   `json:"cached,omitempty"`
	MS     string `json:"ms,omitempty"`
}
type batchRes struct {
	Results []batchItem `json:"results"`
}

func PrerenderBatch(reqs []renderReq) (map[string]template.HTML, error) {
	body, err := json.Marshal(batchReq{Components: reqs})
	if err != nil {
		return nil, fmt.Errorf("marshal batch: %w", err)
	}
	resp, err := client.Post("http://localhost:3001/render-batch",
		"application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("POST batch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("batch status %d", resp.StatusCode)
	}

	var br batchRes
	if err := json.NewDecoder(resp.Body).Decode(&br); err != nil {
		return nil, fmt.Errorf("decode batch: %w", err)
	}

	out := make(map[string]template.HTML, len(br.Results))
	for i, r := range br.Results {
		key := reqs[i].Tag // preserve order mapping
		if r.Error != "" {
			// Decide: skip or store fallback
			continue
		}
		out[key] = template.HTML(r.HTML)
	}
	return out, nil
}
