'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { ACARSMessage, HoppieMessage } from '@/types';
import { HoppieAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface ACARSContextType {
  messages: ACARSMessage[];
  isLoading: boolean;
  sendMessage: (message: Omit<HoppieMessage, 'logon'>) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
  clearMessages: () => void;
  deleteMessage: (messageId: string) => void;
  updateMessageStatus: (messageId: string, status: 'accepted' | 'rejected') => void;
}

const ACARSContext = createContext<ACARSContextType | undefined>(undefined);

export function ACARSProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ACARSMessage[]>(() => {
    // Load messages from localStorage on initialization
    if (typeof window !== 'undefined') {
      try {
        const savedMessages = localStorage.getItem('jal-acars-messages');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert timestamp strings back to Date objects and fix N/A senders
          return parsedMessages.map((msg: ACARSMessage & { timestamp: string; lastMessageTime?: string; connectionTime?: string; lastPositionUpdate?: string }) => ({
            ...msg,
            from: msg.from === 'N/A' ? 'JALDispatch' : msg.from,
            timestamp: new Date(msg.timestamp),
            lastMessageTime: msg.lastMessageTime ? new Date(msg.lastMessageTime) : undefined,
            connectionTime: msg.connectionTime ? new Date(msg.connectionTime) : undefined,
            lastPositionUpdate: msg.lastPositionUpdate ? new Date(msg.lastPositionUpdate) : undefined
          }));
        }
        return [];
      } catch (error) {
        console.error('Error loading messages from localStorage:', error);
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jal-acars-messages', JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  }, [messages]);

  const hoppieAPI = useMemo(() => {
    const dispatchHoppieId = process.env.HOPPIE_LOGON_CODE;
    const dispatchCallsign = process.env.DISPATCH_CALLSIGN || 'JALV';
    return dispatchHoppieId ? new HoppieAPI(dispatchHoppieId, dispatchCallsign) : null;
  }, []);

  const sendMessage = async (message: Omit<HoppieMessage, 'logon'>): Promise<boolean> => {
    if (!hoppieAPI) {
      toast.error('Hoppie ID not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const response = await hoppieAPI.sendMessage({
        ...message,
        logon: process.env.HOPPIE_LOGON_CODE || ''
      });

      if (response.success) {
        // Add message to local state
        // For ACARS messages, treat as PDC in UI but send as telex to Hoppie
        const isACARSMessage = message.from === (process.env.DISPATCH_CALLSIGN || 'JALV');
        const newMessage: ACARSMessage = {
          id: Date.now().toString(),
          timestamp: new Date(),
          from: message.from,
          to: message.to,
          type: isACARSMessage ? 'pdc' : message.type,
          content: message.packet,
          status: isACARSMessage ? 'pending' : 'sent',
          priority: 'normal'
        };
        
        setMessages(prev => [newMessage, ...prev]);
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

  useEffect(() => {
    if (hoppieAPI) {
      refreshMessages();
      // Set up periodic message refresh
      const interval = setInterval(refreshMessages, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [hoppieAPI, refreshMessages]);

  const clearMessages = () => {
    setMessages([]);
    // Clear from localStorage as well
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('jal-acars-messages');
      } catch (error) {
        console.error('Error clearing messages from localStorage:', error);
      }
    }
    toast.success('Messages cleared');
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast.success('Message deleted');
  };

  const updateMessageStatus = (messageId: string, status: 'accepted' | 'rejected') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
    toast.success(`PDC message ${status}`);
  };

  const value: ACARSContextType = {
    messages,
    isLoading,
    sendMessage,
    refreshMessages,
    clearMessages,
    deleteMessage,
    updateMessageStatus,
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
