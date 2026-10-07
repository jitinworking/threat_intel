import React, { useEffect, useState } from 'react';

export const DebugOverlay: React.FC = () => {
  const [debugData, setDebugData] = useState<any>('');

  useEffect(() => {
    setTimeout(() => {
      const layout = document.querySelector('.fixed.inset-0');
      if (!layout) return;
      
      const children = Array.from(layout.children).map((c: any) => {
        const rect = c.getBoundingClientRect();
        return `${c.tagName}.${c.className.substring(0, 20)} y:${Math.round(rect.y)} h:${Math.round(rect.height)}`;
      });
      
      setDebugData(children.join('\n'));
    }, 1000);
  }, []);

  return (
    <div className="fixed top-20 right-4 z-[9999] bg-black text-green-400 p-4 font-mono text-xs whitespace-pre shadow-2xl border border-green-500 rounded">
      DEBUG DOM:\n{debugData}
    </div>
  );
};
