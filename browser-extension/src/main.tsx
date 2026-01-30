import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootId = 'excellence-root';

let mounted = false;

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

mountApp();
