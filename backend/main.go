package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type AudioEvent struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

var clients = make(map[chan AudioEvent]bool)
var sounds = []string{
	"sounds/01.mp3",
	"sounds/02.mp3",
	"sounds/03.mp3",
	"sounds/04.mp3",
	"sounds/05.mp3",
	"sounds/06.mp3",
}

func main() {
	// Enable CORS
	corsMiddleware := func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			// Tambahkan header khusus untuk SSE
			if r.URL.Path == "/sse" {
				w.Header().Set("Content-Type", "text/event-stream")
				w.Header().Set("Cache-Control", "no-cache")
				w.Header().Set("Connection", "keep-alive")
				w.Header().Set("X-Accel-Buffering", "no") // Untuk NGINX
			}

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			handler.ServeHTTP(w, r)
		})
	}

	// Routes
	mux := http.NewServeMux()
	mux.HandleFunc("/sse", handleSSE)
	mux.HandleFunc("/play", handlePlay)

	// Start server
	fmt.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}

func handleSSE(w http.ResponseWriter, r *http.Request) {
	// Create a new client channel
	events := make(chan AudioEvent)
	clients[events] = true

	// Clean up on client disconnect
	defer func() {
		delete(clients, events)
		close(events)
	}()

	// Send initial connection message
	fmt.Fprintf(w, "event: connected\ndata: Connected to SSE server\n\n")
	w.(http.Flusher).Flush()

	// Start heartbeat goroutine
	go func() {
		for {
			select {
			case <-r.Context().Done():
				return
			default:
				// Send heartbeat every 15 seconds
				fmt.Fprintf(w, "event: heartbeat\ndata: ping\n\n")
				w.(http.Flusher).Flush()
				time.Sleep(15 * time.Second)
			}
		}
	}()

	// Keep connection alive and handle events
	for {
		select {
		case event := <-events:
			fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event.Type, event.Data)
			w.(http.Flusher).Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func handlePlay(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Stream each audio file sequentially
	for _, soundPath := range sounds {
		// Read audio file
		data, err := os.ReadFile(soundPath)
		if err != nil {
			log.Printf("Error reading file %s: %v", soundPath, err)
			continue
		}

		// Convert to base64
		base64Data := base64.StdEncoding.EncodeToString(data)

		// Broadcast to all connected clients
		event := AudioEvent{
			Type: "audio",
			Data: base64Data,
		}

		for client := range clients {
			client <- event
		}

		// Add small delay between files to prevent overwhelming the client
		time.Sleep(100 * time.Millisecond)
	}

	w.WriteHeader(http.StatusOK)
}
