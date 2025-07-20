package main

import (
	"log"

	"rbyte.eu/example/go-web-components-ssr/internal"
)

func main() {
	if err := internal.BuildRouter().Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
