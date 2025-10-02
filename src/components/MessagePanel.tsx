'use client';

import { useState } from 'react';
import { useACARS } from '@/hooks/useACARS';
import { useAuth } from '@/hooks/useAuth';
import { Send, Clock, Plane } from 'lucide-react';
import { format } from 'date-fns';

export default function MessagePanel() {
  const { messages, sendMessage, isLoading } = useACARS();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState({
    to: '',
    type: 'telex' as 'telex' | 'loadsheet' | 'report',
    packet: ''
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.to || !newMessage.packet) return;

    const success = await sendMessage({
      from: user?.callsign || 'JALV',
      to: newMessage.to,
      type: newMessage.type,
      packet: newMessage.packet
    });

    if (success) {
      setNewMessage({ to: '', type: 'telex', packet: '' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'normal': return 'text-blue-400 bg-blue-900/20';
      case 'low': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-400';
      case 'sent': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Message List */}
      <div className="lg:col-span-2">
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Message History</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Send your first ACARS message to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {messages.map((message) => (
                  <div key={message.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">{message.from}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-white">{message.to}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{format(message.timestamp, 'HH:mm:ss')}</span>
                        <span className={`${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 font-mono bg-gray-900/50 p-2 rounded">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Message Panel */}
      <div className="lg:col-span-1">
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Send Message</h3>
          </div>
          <form onSubmit={handleSendMessage} className="p-4 space-y-4">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-300 mb-1">
                To (Callsign)
              </label>
              <input
                id="to"
                type="text"
                value={newMessage.to}
                onChange={(e) => setNewMessage(prev => ({ ...prev, to: e.target.value.toUpperCase() }))}
                placeholder="e.g., JAL123"
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                Message Type
              </label>
              <select
                id="type"
                value={newMessage.type}
                onChange={(e) => setNewMessage(prev => ({ ...prev, type: e.target.value as 'telex' | 'loadsheet' | 'report' }))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="telex">Telex</option>
                <option value="loadsheet">Loadsheet</option>
                <option value="report">Report</option>
              </select>
            </div>

            <div>
              <label htmlFor="packet" className="block text-sm font-medium text-gray-300 mb-1">
                Message Content
              </label>
              <textarea
                id="packet"
                value={newMessage.packet}
                onChange={(e) => setNewMessage(prev => ({ ...prev, packet: e.target.value }))}
                placeholder="Enter your message..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !newMessage.to || !newMessage.packet}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              <span>{isLoading ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => setNewMessage(prev => ({ ...prev, packet: 'REQUEST POSITION REPORT' }))}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                Request Position Report
              </button>
              <button
                onClick={() => setNewMessage(prev => ({ ...prev, packet: 'REQUEST WEATHER' }))}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                Request Weather
              </button>
              <button
                onClick={() => setNewMessage(prev => ({ ...prev, packet: 'REQUEST CLEARANCE' }))}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                Request Clearance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
