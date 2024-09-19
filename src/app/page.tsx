/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Xumm } from 'xumm';
import styles from './main.module.css';

const CocosGame: React.FC = () => {
  const webviewRef = useRef<HTMLIFrameElement>(null);
  const [windowSize, setWindowSize] = useState({ width: '100vw', height: '100vh' });
  const [bearer, setBearer] = useState<string | null>(null);
  const [xumm, setXumm] = useState<Xumm | null>(null);

  useEffect(() => {
    const initializeXumm = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const xAppToken = urlParams.get('xAppToken');

        if (!xAppToken) {
          throw new Error("No xAppToken found in URL");
        }

        const xumm = new Xumm(process.env.NEXT_PUBLIC_XUMM_API_KEY, xAppToken);
        
        await xumm.authorize();

        const bearerToken = await xumm.environment.bearer;
        if (bearerToken) {
          setBearer(bearerToken);
        } else {
          throw new Error("Failed to obtain bearer token");
        }

        setXumm(xumm);

      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    const handleResize = () => {
      setWindowSize({ width: `${window.innerWidth}px`, height: `${window.innerHeight}px` });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'FROM_COCOS') {
        // ここでCocosからのメッセージを処理
        console.log('Received message from Cocos:', event.data.message);
        xumm?.payload?.create({
          TransactionType: 'Payment',
          Destination: 'rPJuukGFu7Awm2c2fBY8jcAndfEZQngbpD',
          Amount: String(1)
        }).then((payload:any) => {
          console.log('openSignRequest');
          xumm.xapp?.openSignRequest(payload)
        })
      }
    };

    window.addEventListener('message', handleMessage);
    initializeXumm();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [xumm,bearer]);

  const sendMessageToCocos = (message: string) => {
    console.log('sendMessageToCocos');
    if (webviewRef.current) {
      webviewRef.current.contentWindow?.postMessage({ type: 'FROM_NEXTJS', message }, '*');
      console.log('sendMessageToCocos:OK');
    }
  };

  return (
  <div id="Cocos-container" className={styles.fullscreen} style={windowSize}>
    <iframe
      ref={webviewRef}
      src="https://cocos-cvx.pages.dev/"
      className={styles.fullscreenIframe}
      allow="autoplay; fullscreen; encrypted-media"
    />
    <button onClick={() => sendMessageToCocos('Hello from Next.js!')}>
      Send Message to Cocos
    </button>
  </div>
  );
};

export default CocosGame;