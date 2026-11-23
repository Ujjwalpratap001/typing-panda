import { useEffect, useRef } from 'react';

const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim();
const slotId = import.meta.env.VITE_ADSENSE_SLOT_ID?.trim();

type AdsWindow = Window & { adsbygoogle?: Record<string, unknown>[] };

export default function AdSlot() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!clientId || !slotId) return;
    const adElement = adRef.current;
    if (!adElement || adElement.dataset.adInitialized === 'true') return;
    adElement.dataset.adInitialized = 'true';

    const adsWindow = window as AdsWindow;
    const pushAd = () => {
      try {
        adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
        adsWindow.adsbygoogle.push({});
      } catch (error) {
        console.error('Typing Panda ad initialization failed:', error);
      }
    };

    let script = document.getElementById('google-adsense-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-adsense-script';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      script.onload = () => {
        script!.dataset.loaded = 'true';
        pushAd();
      };
      script.onerror = () => console.error('Google AdSense script could not be loaded.');
      document.head.appendChild(script);
    } else if (script.dataset.loaded === 'true') {
      pushAd();
    } else {
      script.addEventListener('load', pushAd, { once: true });
    }
  }, []);

  if (!clientId || !slotId) return null;

  return (
    <aside
      className="typing-panda-ad"
      aria-label="Advertisement"
      style={{ width: 'min(calc(100% - 32px), 970px)', margin: '48px auto', textAlign: 'center', color: '#777', fontSize: 10 }}
    >
      <span className="typing-panda-ad-label">ADVERTISEMENT</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 90 }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
