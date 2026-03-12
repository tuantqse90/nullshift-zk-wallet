// React import not needed with jsx: "react-jsx"
import { createRoot } from 'react-dom/client';
import { PopupApp } from './App';
import '../shared/styles.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}
