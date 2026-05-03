import React, { createContext, useState, useContext, ReactNode } from 'react';

interface NotebookItem {
  id: string;
  type: 'ioc' | 'report' | 'note' | 'graph_node' | 'news';
  content: string;
  timestamp: Date;
  context?: string;
}

interface NotebookContextType {
  isOpen: boolean;
  toggleNotebook: () => void;
  items: NotebookItem[];
  pinItem: (type: NotebookItem['type'], content: string, context?: string) => void;
  removeItem: (id: string) => void;
  clearNotebook: () => void;
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined);

export const NotebookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotebookItem[]>([]);

  const toggleNotebook = () => setIsOpen(!isOpen);

  const pinItem = (type: NotebookItem['type'], content: string, context?: string) => {
    const newItem: NotebookItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: new Date(),
      context
    };
    setItems(prev => [newItem, ...prev]);
    setIsOpen(true); // Auto-open when pinning
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearNotebook = () => {
    if (confirm('Are you sure you want to clear your entire investigation notebook?')) {
      setItems([]);
    }
  };

  return (
    <NotebookContext.Provider value={{ isOpen, toggleNotebook, items, pinItem, removeItem, clearNotebook }}>
      {children}
    </NotebookContext.Provider>
  );
};

export const useNotebook = () => {
  const context = useContext(NotebookContext);
  if (context === undefined) {
    throw new Error('useNotebook must be used within a NotebookProvider');
  }
  return context;
};
