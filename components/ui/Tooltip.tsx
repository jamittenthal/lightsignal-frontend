import React, { useState, useRef, useEffect } from 'react';

export type TooltipProps = {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
};

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0, left = 0;
      
      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + 8;
          break;
      }

      // Keep tooltip within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

      setTooltipStyle({ top, left, position: 'fixed' });
    }
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`cursor-help ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          style={tooltipStyle}
          className="z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg max-w-xs animate-in fade-in duration-200"
        >
          {content}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
            position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
            'left-[-4px] top-1/2 -translate-y-1/2'
          }`} />
        </div>
      )}
    </>
  );
}

export function ProvenanceBadge({ 
  sources, 
  confidence, 
  usedPriors,
  className = ''
}: { 
  sources?: string[]; 
  confidence?: string; 
  usedPriors?: boolean;
  className?: string;
}) {
  if (!sources && !confidence) return null;

  const tooltipContent = (
    <div className="space-y-1">
      {sources && sources.length > 0 && (
        <div>
          <div className="font-medium">Data Sources:</div>
          <div>{sources.join(', ')}</div>
        </div>
      )}
      {confidence && (
        <div>
          <div className="font-medium">Confidence:</div>
          <div className="capitalize">{confidence}</div>
        </div>
      )}
      {usedPriors && (
        <div className="text-gray-300 text-xs">
          Includes historical patterns
        </div>
      )}
    </div>
  );

  const confidenceColor = 
    confidence === 'high' ? 'bg-green-100 text-green-800' :
    confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
    confidence === 'low' ? 'bg-red-100 text-red-800' :
    'bg-gray-100 text-gray-800';

  return (
    <Tooltip content={tooltipContent}>
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${confidenceColor} ${className}`}>
        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1" />
        {confidence ? confidence[0].toUpperCase() : 'P'}
      </span>
    </Tooltip>
  );
}

export function InfoTooltip({ content, className = '' }: { content: string | React.ReactNode; className?: string }) {
  return (
    <Tooltip content={content}>
      <span className={`inline-flex items-center justify-center w-4 h-4 bg-gray-200 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-300 ${className}`}>
        ?
      </span>
    </Tooltip>
  );
}