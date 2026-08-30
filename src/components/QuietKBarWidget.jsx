import { useEffect } from 'react';
import kbar from 'kbar';
const { KBarProvider, KBar, useKBar } = kbar;
import { actions } from './QuietKBarActions';

function QuietKBarControls() {
  const { open, toggle } = useKBar();

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();

        if (typeof toggle === 'function') {
          toggle();
        } else if (typeof open === 'function') {
          open();
        }
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, toggle]);

  return (
    <>
      <KBar />
      <button
        type="button"
        onClick={() => {
          if (typeof toggle === 'function') {
            toggle();
          } else if (typeof open === 'function') {
            open();
          }
        }}
        title="Open command menu (⌘K / Ctrl+K)"
        aria-label="Open command menu"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 9999,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.9)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          cursor: 'pointer',
        }}
      >
        ⌘K
      </button>
    </>
  );
}

export default function QuietKBarWidget() {
  return (
    <KBarProvider actions={actions}>
      <QuietKBarControls />
    </KBarProvider>
  );
}
