import React, { createContext, useContext, useState, useCallback } from 'react';

export interface InvestigationEntity {
  id?: string | number;
  type: 'ip' | 'ipv4' | 'domain' | 'url' | 'hash' | 'sha256' | 'md5' | 'cve' | 'actor' | 'malware' | 'campaign' | string;
  value: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  confidence?: number;
  source?: string;
  firstSeen?: string;
  lastSeen?: string;
  malware?: string;
  threatType?: string;
  threatActor?: string;
  country?: string;
  tags?: string[];
  details?: Record<string, any>;
}

interface InvestigationContextType {
  activeEntity: InvestigationEntity | null;
  isDrawerOpen: boolean;
  openInvestigation: (entity: InvestigationEntity) => void;
  closeInvestigation: () => void;
  
  isCopilotOpen: boolean;
  copilotPrompt: string | null;
  copilotEntity: InvestigationEntity | null;
  openCopilot: (prompt?: string, entity?: InvestigationEntity) => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
}

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

export const InvestigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEntity, setActiveEntity] = useState<InvestigationEntity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState<string | null>(null);
  const [copilotEntity, setCopilotEntity] = useState<InvestigationEntity | null>(null);

  const openInvestigation = useCallback((entity: InvestigationEntity) => {
    setActiveEntity(entity);
    setIsDrawerOpen(true);
  }, []);

  const closeInvestigation = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const openCopilot = useCallback((prompt?: string, entity?: InvestigationEntity) => {
    if (prompt) setCopilotPrompt(prompt);
    if (entity) setCopilotEntity(entity);
    setIsCopilotOpen(true);
  }, []);

  const closeCopilot = useCallback(() => {
    setIsCopilotOpen(false);
  }, []);

  const toggleCopilot = useCallback(() => {
    setIsCopilotOpen(prev => !prev);
  }, []);

  return (
    <InvestigationContext.Provider
      value={{
        activeEntity,
        isDrawerOpen,
        openInvestigation,
        closeInvestigation,
        isCopilotOpen,
        copilotPrompt,
        copilotEntity,
        openCopilot,
        closeCopilot,
        toggleCopilot,
      }}
    >
      {children}
    </InvestigationContext.Provider>
  );
};

export const useInvestigation = (): InvestigationContextType => {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};
