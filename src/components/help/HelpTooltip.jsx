import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function HelpTooltip({ content, title, children, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div className="relative inline-block group">
      {children ? (
        <div
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          className="cursor-help"
        >
          {children}
        </div>
      ) : (
        <HelpCircle
          className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help inline-block"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        />
      )}

      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-900 text-white text-sm rounded-lg shadow-lg`}
        >
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-slate-200 text-xs leading-relaxed">{content}</p>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-2 h-2 bg-slate-900 rotate-45" />
        </div>
      )}
    </div>
  );
}