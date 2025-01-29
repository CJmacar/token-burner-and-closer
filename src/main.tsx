import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if (typeof globalThis.TextDecoder === 'undefined') {
    globalThis.TextDecoder = require('util').TextDecoder;
  }
  
createRoot(document.getElementById("root")!).render(<App />);
