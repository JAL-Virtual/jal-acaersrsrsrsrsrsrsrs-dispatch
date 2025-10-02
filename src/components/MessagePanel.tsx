'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useACARS } from '@/hooks/useACARS';
import { 
  Send, 
  Clock, 
  Plane, 
  Search, 
  Filter, 
  RefreshCw, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  User,
  Hash,
  Calendar,
  Zap
} from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface MessageFilters {
  type: 'all' | 'telex' | 'pdc';
  status: 'all' | 'sent' | 'delivered' | 'failed' | 'pending' | 'accepted' | 'rejected';
  priority: 'all' | 'low' | 'normal' | 'high' | 'urgent';
  callsign: string;
}

export default function MessagePanel() {
  const { messages, sendMessage, isLoading, refreshMessages, deleteMessage } = useACARS();
  const [newMessage, setNewMessage] = useState({
    to: '',
    type: 'telex' as const,
    packet: ''
  });
  
  const [filters, setFilters] = useState<MessageFilters>({
    type: 'all',
    status: 'all',
    priority: 'all',
    callsign: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isConnected] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = searchQuery === '' || 
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.to.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filters.type === 'all' || message.type === filters.type;
      const matchesStatus = filters.status === 'all' || message.status === filters.status;
      const matchesPriority = filters.priority === 'all' || message.priority === filters.priority;
      const matchesCallsign = filters.callsign === '' || 
        message.from.toLowerCase().includes(filters.callsign.toLowerCase()) ||
        message.to.toLowerCase().includes(filters.callsign.toLowerCase());
      
      return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesCallsign;
    });
  }, [messages, searchQuery, filters]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: typeof filteredMessages } = {};
    
    filteredMessages.forEach(message => {
      const date = message.timestamp.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  }, [filteredMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.to || !newMessage.packet) return;

    const success = await sendMessage({
      from: process.env.DISPATCH_CALLSIGN || 'JALV',
      to: newMessage.to,
      type: newMessage.type,
      packet: newMessage.packet
    });

    if (success) {
      setNewMessage({ to: '', type: 'telex', packet: '' });
      toast.success('Message sent successfully');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'normal': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'low': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'sent': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'telex': return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case 'loadsheet': return <Hash className="h-4 w-4 text-green-400" />;
      case 'report': return <User className="h-4 w-4 text-purple-400" />;
      case 'notification': return <Bell className="h-4 w-4 text-yellow-400" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };


  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-lg"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ACARS Messages</h2>
              <p className="text-sm text-gray-400">Real-time aircraft communications</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600/50">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-sm text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Message Count */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <Hash className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">{messages.length}</span>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refreshMessages}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages, callsigns, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors border border-gray-600/50"
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm">Filters</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as 'all' | 'telex' | 'pdc' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Types</option>
                  <option value="telex">Telex</option>
                  <option value="pdc">PDC (CPDLC)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'sent' | 'delivered' | 'failed' | 'pending' | 'accepted' | 'rejected' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as 'all' | 'low' | 'normal' | 'high' | 'urgent' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Callsign</label>
                <input
                  type="text"
                  placeholder="Filter by callsign..."
                  value={filters.callsign}
                  onChange={(e) => setFilters(prev => ({ ...prev, callsign: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
      {/* Message List */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Message History</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`p-2 rounded-lg transition-colors ${
                      autoRefresh 
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                        : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                    }`}
                    title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`p-2 rounded-lg transition-colors ${
                      notifications 
                        ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                        : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                    }`}
                    title={notifications ? 'Notifications enabled' : 'Notifications disabled'}
                  >
                    {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
          </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                  <Plane className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No messages found</p>
                  <p className="text-sm">
                    {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '') 
                      ? 'Try adjusting your search or filters' 
                      : 'Send your first ACARS message to get started'
                    }
                  </p>
              </div>
            ) : (
                <div className="divide-y divide-gray-700/50">
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      <div className="sticky top-0 bg-gray-800/80 backdrop-blur-sm px-4 py-2 border-b border-gray-700/50">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-300">{formatMessageDate(new Date(date))}</span>
                          <span className="text-xs text-gray-500">({dateMessages.length} messages)</span>
                        </div>
                      </div>
                      
                      {dateMessages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`p-4 hover:bg-gray-700/30 transition-all duration-200 cursor-pointer group ${
                            selectedMessage === message.id ? 'bg-gray-700/50 border-l-4 border-red-500' : ''
                          }`}
                          onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                                {getTypeIcon(message.type)}
                        <span className="text-sm font-medium text-white">{message.from}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-white">{message.to}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </span>
                      </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{format(message.timestamp, 'HH:mm:ss')}</span>
                              </div>
                              {getStatusIcon(message.status)}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(message.content);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600/50 rounded transition-all"
                                title="Copy message"
                              >
                                <Copy className="h-3 w-3 text-gray-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMessage(message.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/50 rounded transition-all"
                                title="Delete message"
                              >
                                <Trash2 className="h-3 w-3 text-red-400" />
                              </button>
                      </div>
                    </div>
                          
                          <div className="text-sm text-gray-300 font-mono bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                          
                          {selectedMessage === message.id && (
                            <div className="mt-3 pt-3 border-t border-gray-700/50">
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>ID: {message.id}</span>
                                <span>Sent {formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
                              </div>
                            </div>
                          )}
                  </div>
                ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Message Panel */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700/50">
            <h3 className="text-lg font-semibold text-white">Send Message</h3>
          </div>
            
            <form onSubmit={handleSendMessage} className="p-4 space-y-4 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-300 mb-1">
                To (Callsign)
              </label>
              <input
                id="to"
                type="text"
                value={newMessage.to}
                onChange={(e) => setNewMessage(prev => ({ ...prev, to: e.target.value.toUpperCase() }))}
                    placeholder=""
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                Message Type
              </label>
              <div className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white">
                Telex
              </div>
            </div>

                <div className="flex-1">
              <label htmlFor="packet" className="block text-sm font-medium text-gray-300 mb-1">
                Message Content
              </label>
              <textarea
                id="packet"
                value={newMessage.packet}
                onChange={(e) => setNewMessage(prev => ({ ...prev, packet: e.target.value }))}
                placeholder="Enter your message..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm resize-none"
                required
              />
                </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !newMessage.to || !newMessage.packet}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              <Send className="h-4 w-4" />
                <span className="font-medium">{isLoading ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>

          </div>
        </div>
      </div>
    </div>
  );
}
