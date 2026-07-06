import React, { useEffect, useRef } from 'react';
import vegaEmbed from 'vega-embed';
import { usePortal } from '../../context/PortalContext';

interface VegaLiteRendererProps {
  spec: any;
  className?: string;
}

export const VegaLiteRenderer: React.FC<VegaLiteRendererProps> = ({ spec, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = usePortal();

  useEffect(() => {
    if (!containerRef.current || !spec) return;

    // Clone spec so vegaEmbed doesn't mutate state or props
    const specCopy = JSON.parse(JSON.stringify(spec));

    // Ensure responsive width if not already bounded
    if (!specCopy.width && !specCopy.config?.view?.continuousWidth) {
      specCopy.width = 'container';
    }

    // Ensure transparent background and stroke-free view plot area
    specCopy.background = 'transparent';
    if (!specCopy.config) specCopy.config = {};
    specCopy.config.background = 'transparent';
    if (!specCopy.config.view) specCopy.config.view = {};
    specCopy.config.view.stroke = 'transparent';
    specCopy.config.view.fill = 'transparent';

    const isDark = theme === 'dark';

    const embedPromise = vegaEmbed(containerRef.current, specCopy, {
      mode: 'vega-lite',
      actions: false, // Clean UI without editor links
      theme: isDark ? 'dark' : 'latimes',
      config: {
        background: 'transparent',
        view: {
          stroke: 'transparent',
          fill: 'transparent',
        },
      },
    });

    return () => {
      embedPromise.then((res) => {
        try {
          res.view.finalize();
        } catch (e) {
          // Ignore cleanup errors on unmount
        }
      }).catch(() => {});
    };
  }, [spec, theme]);

  if (!spec) return null;

  return (
    <div 
      ref={containerRef} 
      className={`agents-vega-container ${className || ''}`}
      style={{
        width: '100%',
        overflowX: 'auto',
        margin: '8px 0 16px 0',
        background: 'transparent',
      }}
    />
  );
};
