'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { ACARSMessage, HoppieMessage } from '@/types';
import { HoppieAPI } from '@/lib/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface ACARSContextType {
  messages: ACARSMessage[];
  isLoading: boolean;
  sendMessage: (message: Omit<HoppieMessage, 'logon'>) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
  clearMessages: () => void;
}

const ACARSContext = createContext<ACARSContextType | undefined>(undefined);

export function ACARSProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ACARSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const hoppieAPI = useMemo(() => {
    return user?.hoppieId ? new HoppieAPI(user.hoppieId) : null;
  }, [user?.hoppieId]);

  useEffect(() => {
    if (user?.hoppieId) {
      refreshMessages();
      // Set up periodic message refresh
      const interval = setInterval(refreshMessages, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.hoppieId, refreshMessages]);

  const sendMessage = async (message: Omit<HoppieMessage, 'logon'>): Promise<boolean> => {
    if (!hoppieAPI) {
      toast.error('Hoppie ID not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const response = await hoppieAPI.sendMessage({
        ...message,
        logon: user?.hoppieId || ''
      });

      if (response.success) {
        // Add message to local state
        const newMessage: ACARSMessage = {
          id: Date.now().toString(),
          timestamp: new Date(),
          from: message.from,
          to: message.to,
          type: message.type,
          content: message.packet,
          status: 'sent',
          priority: 'normal'
        };
        
        setMessages(prev => [newMessage, ...prev]);
        toast.success('Message sent successfully');
        return true;
      } else {
        toast.error(response.error || 'Failed to send message');
        return false;
      }
    } catch {
      toast.error('Error sending message');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMessages = useCallback(async (): Promise<void> => {
    if (!hoppieAPI) return;

    setIsLoading(true);
    try {
      const newMessages = await hoppieAPI.receiveMessages();
      setMessages(prev => {
        // Merge new messages with existing ones, avoiding duplicates
        const existingIds = new Set(prev.map(msg => msg.id));
        const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
        return [...uniqueNewMessages, ...prev];
      });
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hoppieAPI]);

  const clearMessages = () => {
    setMessages([]);
    toast.success('Messages cleared');
  };

  const value: ACARSContextType = {
    messages,
    isLoading,
    sendMessage,
    refreshMessages,
    clearMessages,
  };

  return <ACARSContext.Provider value={value}>{children}</ACARSContext.Provider>;
}

export function useACARS() {
  const context = useContext(ACARSContext);
  if (context === undefined) {
    throw new Error('useACARS must be used within an ACARSProvider');
  }
  return context;
}
