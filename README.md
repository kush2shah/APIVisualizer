# API Visualizer

An AI-powered API testing and visualization tool that automatically generates beautiful, insightful visualizations from your API responses using Claude AI.

## Features

- **🚀 Import OpenAPI Specs** - Upload OpenAPI 3.0/3.1 or Swagger 2.0 specs (JSON/YAML)
- **📁 Smart Collections** - Organize endpoints in a Bruno-like sidebar
- **🎯 Context-Aware Forms** - Request builder auto-populated from OpenAPI schema
- **🤖 AI Visualizations** - Claude 3.5 Haiku generates charts, tables, and custom visualizations
- **💾 Local Caching** - Visualization templates cached in IndexedDB for instant reuse
- **🔄 Environment Variables** - Support for `{{baseUrl}}` style variable substitution
- **🌐 CORS Proxy** - Built-in proxy to bypass browser CORS restrictions
- **📊 Multiple View Modes** - Toggle between Visualization, Raw Data, and Headers tabs

## Getting Started

### Prerequisites

- Node.js 20+ (required for Next.js 15)
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Add your Anthropic API key to `.env`:**
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Import an OpenAPI Spec

- Click "Import OpenAPI Spec" on the welcome screen
- Upload a JSON or YAML file, or paste the content directly
- The tool will automatically parse and create a collection with all endpoints

**Try the example:** Use `/public/examples/petstore.json` to test the app

### 2. Select an Endpoint

- Browse your collections in the sidebar
- Click on any endpoint to load it in the request builder

### 3. Make a Request

- Fill in required path parameters (e.g., `{petId}`)
- Add query parameters if needed
- Edit the request body for POST/PUT requests
- Click "Send" to execute the request

### 4. View AI-Generated Visualizations

- After the first request, Claude AI analyzes the response structure
- Automatically generates appropriate visualizations:
  - **Tables** for arrays of objects
  - **Charts** for numerical/categorical data
  - **Cards** for single objects
  - **Custom layouts** for complex nested data
- Visualization is cached for faster subsequent requests
- Click "Regenerate" to create a different visualization

### 5. Environment Variables

Coming soon! Define variables like `{{baseUrl}}` and switch between dev/staging/prod environments.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── proxy/          # CORS proxy for API requests
│   │   └── generate-viz/   # Claude AI integration
│   ├── layout.tsx
│   └── page.tsx            # Main application
├── components/
│   ├── ui/                 # Radix UI components
│   ├── EmptyState.tsx      # Welcome screen
│   ├── ImportSpecDialog.tsx
│   ├── RequestBuilder.tsx   # Smart request form
│   ├── ResponseViewer.tsx   # Tabbed response display
│   ├── Sidebar.tsx          # Collections tree
│   └── VisualizationRenderer.tsx  # react-live renderer
├── hooks/
│   ├── useCollections.ts
│   ├── useEndpoints.ts
│   └── useEnvironments.ts
├── lib/
│   ├── api.ts              # API request helpers
│   ├── db.ts               # IndexedDB schema (Dexie)
│   ├── openapi-parser.ts   # OpenAPI parsing logic
│   ├── store.ts            # Zustand global state
│   └── utils.ts            # Utility functions
└── types/
    └── index.ts            # TypeScript types
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **OpenAPI:** swagger-parser for parsing and validation
- **State:** Zustand for global state, Dexie for IndexedDB
- **Visualization:** Recharts (AI generates components using this)
- **AI:** Claude 3.5 Haiku via Anthropic SDK
- **Code Rendering:** react-live for safe dynamic component execution

## How It Works

1. **Import:** OpenAPI spec is parsed and endpoints are extracted
2. **Request:** User fills smart form → request sent through CORS proxy
3. **First Response:** Sent to Claude Haiku with prompt to generate visualization
4. **AI Generation:** Claude creates a React component using Recharts
5. **Rendering:** react-live safely executes and renders the component
6. **Caching:** Component code saved to IndexedDB for instant reuse
7. **Future Requests:** Cached visualization reused with new data

## Roadmap

- [ ] Environment management UI
- [ ] Authentication configuration (API Key, Bearer, Basic Auth)
- [ ] Request history viewer
- [ ] Collection import/export
- [ ] Request chaining (use response from one request in another)
- [ ] Dark mode
- [ ] Desktop app (Electron/Tauri wrapper)

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT License - see LICENSE file for details
