import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'sm',
});

const rootId = 'excellence-root';

let mounted = false;

const mountApp = () => {
  if (mounted) return;
  mounted = true;

  if (document.getElementById(rootId)) {
    return;
  }

  const root = document.createElement('div');
  root.id = rootId;
  root.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
  document.body.appendChild(root);

  const rootContainer = createRoot(root);
  rootContainer.render(
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>,
  );
};

mountApp();
