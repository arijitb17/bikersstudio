'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function PageLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Enforce a small minimum display time so the loader never just "flashes"
    const minTime = new Promise<void>((resolve) => setTimeout(resolve, 700));

    // Resolve once the browser has finished loading everything on the page
    // (images, fonts, scripts, stylesheets) — the same signal window.onload uses.
    const pageLoad = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve(), { once: true });
      }
    });

    Promise.all([minTime, pageLoad]).then(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Splash overlay — sits above everything until the page is fully ready */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-out ${
          loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!loading}
        role="status"
        aria-live="polite"
      >
        <div className="relative w-20 h-20 flex items-center justify-center mb-6">
          <div className="absolute inset-0 border-[3px] border-neutral-800 rounded-full" />
          <div className="absolute inset-0 border-[3px] border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <Image
            src="/logo.png"
            alt="Biker's Studio"
            width={44}
            height={44}
            priority
            className="object-contain"
          />
        </div>

        <p className="text-yellow-400 font-black uppercase tracking-[0.2em] text-sm">
          Biker&apos;s Studio
        </p>

        <div className="w-40 h-0.5 bg-neutral-800 rounded-full mt-4 overflow-hidden">
          <div className="h-full w-1/3 bg-yellow-400 rounded-full animate-[loaderbar_1.2s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Real content stays mounted and loading normally underneath the overlay */}
      {children}

      <style jsx global>{`
        @keyframes loaderbar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(150%);
          }
          100% {
            transform: translateX(150%);
          }
        }
      `}</style>
    </>
  );
}