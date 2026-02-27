import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootId = 'excellence-root';

let mounted = false;

const isIssuePage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /\/issues\/\d+/.test(window.location.pathname);
};

const isRedmineSite = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname;

    if (host.includes('redmine')) return true;
    if (/\/projects(\/|$)/.test(path) || /\/issues(\/|$)/.test(path)) return true;
    if (document.querySelector('#project_quick_jump_box')) return true;
    if (document.querySelector('.subject h3')) return true;
    if (document.querySelector('.attributes')) return true;

    return false;
  } catch {
    return false;
  }
};

const mountApp = () => {
  if (mounted) return;
  mounted = true;

  if (document.getElementById(rootId)) {
    return;
  }

  // 从 localStorage 读取主题设置
  const stored = localStorage.getItem('issuer-color-scheme');
  const isDark = stored === 'dark';

  const root = document.createElement('div');
  root.id = rootId;
  root.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
  document.body.appendChild(root);

  // 应用暗黑模式到 document
  if (isDark) {
    document.documentElement.classList.add('dark');
  }

  const rootContainer = createRoot(root);
  rootContainer.render(
    <App />
  );
};

// Only mount on Redmine pages
if (isRedmineSite()) {
  mountApp();
}
