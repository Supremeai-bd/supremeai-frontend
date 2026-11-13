import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useAuthStore } from './stores/useAuthStore';

// Integration plan Phase 1: validate any stored session against the deployed
// API at startup instead of trusting localStorage blindly.
useAuthStore.getState().restoreSession();

createRoot(document.getElementById('root')!).render(<App />);
