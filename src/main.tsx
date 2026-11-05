import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Typing Panda runtime error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', padding: 24, background: '#f4f6f8', color: '#283548', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🐼</div>
          <h1>Something went wrong</h1>
          <p style={{ color: '#687589' }}>Typing Panda could not load this screen. Please refresh the page.</p>
          <button onClick={() => window.location.reload()} style={{ margin: '12px auto', padding: '11px 18px', border: 0, borderRadius: 9, background: '#d7a34b', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Reload Typing Panda</button>
        </main>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<main style="font-family:system-ui;padding:32px">Typing Panda could not find its root element. Please check index.html.</main>';
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>,
  );
}
