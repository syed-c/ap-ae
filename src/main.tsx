import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Signal to Prerender.io that the page is ready for capture
// Individual pages will set this to true after data loads using usePrerenderReady hook
declare global {
  interface Window {
    prerenderReady: boolean;
  }
}

// Set prerenderReady to false initially - pages will set it to true when data is ready
window.prerenderReady = false;

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Fallback: Set prerenderReady to true after 8 seconds if not already set
// This ensures pages without the hook still get prerendered eventually
setTimeout(() => {
  if (!window.prerenderReady) {
    window.prerenderReady = true;
    console.log('[Prerender] Fallback: Page ready after timeout');
  }
}, 8000);
