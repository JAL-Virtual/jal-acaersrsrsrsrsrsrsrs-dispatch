'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useACARS } from '@/hooks/useACARS';
import { 
  Plane, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Activity,
  Signal,
  Radio,
  MessageSquare,
  Calendar,
  Hash,
  Eye,
  EyeOff,
  Zap,
  Bell,
  BellOff
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

interface Aircraft {
  id: string;
  callsign: string;
  lastSeen: Date;
  status: 'online' | 'offline' | 'idle';
  messageCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  connectionTime: Date;
  aircraftType?: string;
  route?: string;
  position?: string;
  altitude?: string;
  speed?: string;
  heading?: string;
  origin?: string;
  destination?: string;
  flightPhase?: 'preflight' | 'taxi' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach' | 'landing' | 'taxi-in';
  fuelStatus?: string;
  weather?: string;
  specialRequests?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  lastPositionUpdate?: Date;
  totalFlightTime?: string;
  estimatedArrival?: Date;
}

interface AircraftFilters {
  status: 'all' | 'online' | 'offline' | 'idle';
  callsign: string;
  timeRange: 'all' | 'today' | 'yesterday' | 'week';
  flightPhase: 'all' | 'preflight' | 'taxi' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach' | 'landing' | 'taxi-in';
  priority: 'all' | 'low' | 'normal' | 'high' | 'urgent';
  aircraftType: string;
}

export default function AircraftPanel() {
  const { user } = useAuth();
  const { messages } = useACARS();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [filters, setFilters] = useState<AircraftFilters>({
    status: 'all',
    callsign: '',
    timeRange: 'all',
    flightPhase: 'all',
    priority: 'all',
    aircraftType: ''
  });

  // Extract aircraft from messages
  const extractAircraftFromMessages = useCallback(() => {
    const aircraftMap = new Map<string, Aircraft>();
    
    messages.forEach(message => {
      const callsign = message.from;
      if (callsign && callsign !== 'JALV' && callsign !== user?.callsign) {
        const existing = aircraftMap.get(callsign);
        const messageTime = message.timestamp;
        
        if (!existing || messageTime > existing.lastSeen) {
          const specialRequests = extractSpecialRequests(message.content);
          const priority = extractPriority(message.content);
          
          aircraftMap.set(callsign, {
            id: callsign,
            callsign,
            lastSeen: messageTime,
            status: messageTime > new Date(Date.now() - 5 * 60 * 1000) ? 'online' : 'idle',
            messageCount: messages.filter(m => m.from === callsign).length,
            lastMessage: message.content,
            lastMessageTime: messageTime,
            connectionTime: existing?.connectionTime || messageTime,
            aircraftType: extractAircraftType(message.content),
            route: extractRoute(message.content),
            position: extractPosition(message.content),
            altitude: extractAltitude(message.content),
            speed: extractSpeed(message.content),
            heading: extractHeading(message.content),
            origin: extractRoute(message.content)?.split(' → ')[0],
            destination: extractRoute(message.content)?.split(' → ')[1],
            flightPhase: extractFlightPhase(message.content),
            fuelStatus: extractFuelStatus(message.content),
            weather: extractWeather(message.content),
            specialRequests,
            priority,
            lastPositionUpdate: messageTime,
            estimatedArrival: extractEstimatedArrival(message.content)
          });
        } else {
          // Update existing aircraft with new data
          const specialRequests = extractSpecialRequests(message.content);
          const priority = extractPriority(message.content);
          
          existing.messageCount = messages.filter(m => m.from === callsign).length;
          existing.lastMessage = message.content;
          existing.lastMessageTime = messageTime;
          existing.lastSeen = messageTime;
          existing.altitude = extractAltitude(message.content) || existing.altitude;
          existing.speed = extractSpeed(message.content) || existing.speed;
          existing.heading = extractHeading(message.content) || existing.heading;
          existing.flightPhase = extractFlightPhase(message.content);
          existing.fuelStatus = extractFuelStatus(message.content) || existing.fuelStatus;
          existing.weather = extractWeather(message.content) || existing.weather;
          existing.specialRequests = [...new Set([...existing.specialRequests || [], ...specialRequests])];
          existing.priority = priority;
          existing.lastPositionUpdate = messageTime;
          existing.estimatedArrival = extractEstimatedArrival(message.content) || existing.estimatedArrival;
        }
      }
    });

    return Array.from(aircraftMap.values()).sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }, [messages, user?.callsign]);

  // Enhanced helper functions to extract aircraft information
  const extractAircraftType = (content: string): string | undefined => {
    const aircraftTypes = ['B777', 'B787', 'B737', 'A320', 'A330', 'A350', 'B747', 'B767', 'B737', 'A321', 'A319', 'A380', 'B747-8', 'B777-300ER', 'B787-9', 'B787-8', 'A350-900', 'A350-1000'];
    const found = aircraftTypes.find(type => content.toUpperCase().includes(type));
    return found;
  };

  const extractRoute = (content: string): string | undefined => {
    const routeMatch = content.match(/([A-Z]{4})\s*[-→]\s*([A-Z]{4})/);
    return routeMatch ? `${routeMatch[1]} → ${routeMatch[2]}` : undefined;
  };

  const extractPosition = (content: string): string | undefined => {
    const positionMatch = content.match(/(\d{2,3}[NS])\s*(\d{2,3}[EW])/);
    return positionMatch ? `${positionMatch[1]} ${positionMatch[2]}` : undefined;
  };

  const extractAltitude = (content: string): string | undefined => {
    const altitudeMatch = content.match(/FL(\d{3})|(\d{4})\s*FT|ALT\s*(\d{3,4})/i);
    if (altitudeMatch) {
      const fl = altitudeMatch[1];
      const ft = altitudeMatch[2] || altitudeMatch[3];
      return fl ? `FL${fl}` : `${ft}FT`;
    }
    return undefined;
  };

  const extractSpeed = (content: string): string | undefined => {
    const speedMatch = content.match(/M(\d\.\d{2})|(\d{3})\s*KTS|SPD\s*(\d{3})/i);
    if (speedMatch) {
      const mach = speedMatch[1];
      const kts = speedMatch[2] || speedMatch[3];
      return mach ? `M${mach}` : `${kts}KTS`;
    }
    return undefined;
  };

  const extractHeading = (content: string): string | undefined => {
    const headingMatch = content.match(/HDG\s*(\d{3})|HEADING\s*(\d{3})/i);
    return headingMatch ? `${headingMatch[1] || headingMatch[2]}°` : undefined;
  };

  const extractFlightPhase = (content: string): Aircraft['flightPhase'] => {
    const contentUpper = content.toUpperCase();
    if (contentUpper.includes('TAXI') || contentUpper.includes('GATE')) return 'taxi';
    if (contentUpper.includes('TAKEOFF') || contentUpper.includes('DEPARTURE')) return 'takeoff';
    if (contentUpper.includes('CLIMB') || contentUpper.includes('CLIMBING')) return 'climb';
    if (contentUpper.includes('CRUISE') || contentUpper.includes('CRUISING')) return 'cruise';
    if (contentUpper.includes('DESCENT') || contentUpper.includes('DESCENDING')) return 'descent';
    if (contentUpper.includes('APPROACH') || contentUpper.includes('APPROACHING')) return 'approach';
    if (contentUpper.includes('LANDING') || contentUpper.includes('ARRIVAL')) return 'landing';
    if (contentUpper.includes('PUSHBACK') || contentUpper.includes('BOARDING')) return 'preflight';
    return 'cruise'; // Default
  };

  const extractFuelStatus = (content: string): string | undefined => {
    const fuelMatch = content.match(/FUEL\s*(\d+)\s*KG|FUEL\s*(\d+)\s*LBS/i);
    return fuelMatch ? `${fuelMatch[1] || fuelMatch[2]}KG` : undefined;
  };

  const extractWeather = (content: string): string | undefined => {
    const weatherMatch = content.match(/WX\s*([A-Z0-9\s]+)|WEATHER\s*([A-Z0-9\s]+)/i);
    return weatherMatch ? (weatherMatch[1] || weatherMatch[2]).trim() : undefined;
  };

  const extractSpecialRequests = (content: string): string[] => {
    const requests: string[] = [];
    const contentUpper = content.toUpperCase();
    
    if (contentUpper.includes('EMERGENCY')) requests.push('Emergency');
    if (contentUpper.includes('MEDICAL')) requests.push('Medical');
    if (contentUpper.includes('DIVERT')) requests.push('Diversion');
    if (contentUpper.includes('HOLDING')) requests.push('Holding');
    if (contentUpper.includes('WEATHER')) requests.push('Weather');
    if (contentUpper.includes('TRAFFIC')) requests.push('Traffic');
    if (contentUpper.includes('FUEL')) requests.push('Fuel');
    if (contentUpper.includes('CLEARANCE')) requests.push('Clearance');
    
    return requests;
  };

  const extractPriority = (content: string): Aircraft['priority'] => {
    const contentUpper = content.toUpperCase();
    if (contentUpper.includes('EMERGENCY') || contentUpper.includes('URGENT')) return 'urgent';
    if (contentUpper.includes('PRIORITY') || contentUpper.includes('HIGH')) return 'high';
    if (contentUpper.includes('LOW') || contentUpper.includes('NORMAL')) return 'low';
    return 'normal';
  };

  const extractEstimatedArrival = (content: string): Date | undefined => {
    const etaMatch = content.match(/ETA\s*(\d{4})|ARRIVAL\s*(\d{4})/i);
    if (etaMatch) {
      const time = etaMatch[1] || etaMatch[2];
      const now = new Date();
      const [hours, minutes] = time.match(/.{1,2}/g) || [];
      if (hours && minutes) {
        const eta = new Date(now);
        eta.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return eta;
      }
    }
    return undefined;
  };

  // Refresh aircraft data
  const refreshAircraft = useCallback(async () => {
    setIsLoading(true);
    try {
      const newAircraft = extractAircraftFromMessages();
      setAircraft(newAircraft);
      
      // Update status based on last seen time
      setAircraft(prev => prev.map(ac => ({
        ...ac,
        status: ac.lastSeen > new Date(Date.now() - 5 * 60 * 1000) ? 'online' : 
                ac.lastSeen > new Date(Date.now() - 30 * 60 * 1000) ? 'idle' : 'offline'
      })));
      
      toast.success(`Found ${newAircraft.length} aircraft`);
    } catch (error) {
      console.error('Error refreshing aircraft:', error);
      toast.error('Failed to refresh aircraft data');
    } finally {
      setIsLoading(false);
    }
  }, [extractAircraftFromMessages]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      refreshAircraft();
      const interval = setInterval(refreshAircraft, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshAircraft]);

  // Filter aircraft
  const filteredAircraft = useMemo(() => {
    return aircraft.filter(ac => {
      const matchesSearch = searchQuery === '' || 
        ac.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ac.aircraftType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ac.route?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ac.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ac.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ac.flightPhase?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || ac.status === filters.status;
      const matchesCallsign = filters.callsign === '' || 
        ac.callsign.toLowerCase().includes(filters.callsign.toLowerCase());
      const matchesFlightPhase = filters.flightPhase === 'all' || ac.flightPhase === filters.flightPhase;
      const matchesPriority = filters.priority === 'all' || ac.priority === filters.priority;
      const matchesAircraftType = filters.aircraftType === '' || 
        ac.aircraftType?.toLowerCase().includes(filters.aircraftType.toLowerCase());
      
      let matchesTimeRange = true;
      if (filters.timeRange !== 'all') {
        const now = new Date();
        switch (filters.timeRange) {
          case 'today':
            matchesTimeRange = isToday(ac.lastSeen);
            break;
          case 'yesterday':
            matchesTimeRange = isYesterday(ac.lastSeen);
            break;
          case 'week':
            matchesTimeRange = ac.lastSeen > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesCallsign && matchesTimeRange && 
             matchesFlightPhase && matchesPriority && matchesAircraftType;
    });
  }, [aircraft, searchQuery, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'idle': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'offline': return 'text-red-400 bg-red-900/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'idle': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'offline': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatLastSeen = (date: Date) => {
    if (isToday(date)) {
      return `Today ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const getConnectionDuration = (connectionTime: Date) => {
    return formatDistanceToNow(connectionTime, { addSuffix: false });
  };

  // Quick actions for aircraft management
  const quickActions = [
    { label: 'Send Position Request', action: 'position' },
    { label: 'Request Weather', action: 'weather' },
    { label: 'Request Clearance', action: 'clearance' },
    { label: 'Send Loadsheet', action: 'loadsheet' },
    { label: 'Emergency Contact', action: 'emergency' },
    { label: 'Fuel Status Check', action: 'fuel' }
  ];

  const handleQuickAction = (action: string, callsign: string) => {
    const { sendMessage } = useACARS();
    const { user } = useAuth();
    
    const actionMessages = {
      position: 'REQUEST POSITION REPORT',
      weather: 'REQUEST WEATHER',
      clearance: 'REQUEST CLEARANCE',
      loadsheet: 'REQUEST LOADSHEET',
      emergency: 'EMERGENCY - ASSISTANCE REQUIRED',
      fuel: 'FUEL STATUS REPORT'
    };

    const message = actionMessages[action as keyof typeof actionMessages];
    if (message) {
      sendMessage({
        from: user?.callsign || 'JALV',
        to: callsign,
        type: 'telex',
        packet: message
      });
      toast.success(`Message sent to ${callsign}`);
    }
  };

  const getFlightPhaseColor = (phase: string) => {
    switch (phase) {
      case 'preflight': return 'text-blue-400 bg-blue-900/20';
      case 'taxi': return 'text-yellow-400 bg-yellow-900/20';
      case 'takeoff': return 'text-orange-400 bg-orange-900/20';
      case 'climb': return 'text-green-400 bg-green-900/20';
      case 'cruise': return 'text-purple-400 bg-purple-900/20';
      case 'descent': return 'text-cyan-400 bg-cyan-900/20';
      case 'approach': return 'text-pink-400 bg-pink-900/20';
      case 'landing': return 'text-red-400 bg-red-900/20';
      case 'taxi-in': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
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

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-lg blur-lg"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                <Plane className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Aircraft Tracking</h2>
              <p className="text-sm text-gray-400">Monitor aircraft connected to dispatch</p>
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
            
            {/* Aircraft Count */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <Hash className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">{filteredAircraft.length}</span>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refreshAircraft}
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
              type="text"
              placeholder="Search aircraft, callsigns, or routes..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="idle">Idle</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Flight Phase</label>
                <select
                  value={filters.flightPhase}
                  onChange={(e) => setFilters(prev => ({ ...prev, flightPhase: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Phases</option>
                  <option value="preflight">Preflight</option>
                  <option value="taxi">Taxi</option>
                  <option value="takeoff">Takeoff</option>
                  <option value="climb">Climb</option>
                  <option value="cruise">Cruise</option>
                  <option value="descent">Descent</option>
                  <option value="approach">Approach</option>
                  <option value="landing">Landing</option>
                  <option value="taxi-in">Taxi-in</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Time Range</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Aircraft Type</label>
                <input
                  type="text"
                  placeholder="Filter by type..."
                  value={filters.aircraftType}
                  onChange={(e) => setFilters(prev => ({ ...prev, aircraftType: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Connected Aircraft</h3>
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
          {filteredAircraft.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Plane className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No aircraft found</p>
              <p className="text-sm">
                {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '') 
                  ? 'Try adjusting your search or filters' 
                  : 'No aircraft have connected to dispatch yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {filteredAircraft.map((ac) => (
                <div 
                  key={ac.id} 
                  className={`p-4 hover:bg-gray-700/30 transition-all duration-200 cursor-pointer group ${
                    selectedAircraft === ac.id ? 'bg-gray-700/50 border-l-4 border-red-500' : ''
                  }`}
                  onClick={() => setSelectedAircraft(selectedAircraft === ac.id ? null : ac.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-5 w-5 text-blue-400" />
                        <span className="text-lg font-bold text-white">{ac.callsign}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ac.status)}`}>
                        {ac.status}
                      </span>
                      {ac.aircraftType && (
                        <span className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded">
                          {ac.aircraftType}
                        </span>
                      )}
                      {ac.flightPhase && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFlightPhaseColor(ac.flightPhase)}`}>
                          {ac.flightPhase}
                        </span>
                      )}
                      {ac.priority && ac.priority !== 'normal' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ac.priority)}`}>
                          {ac.priority}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ac.status)}
                      <div className="text-right text-xs text-gray-400">
                        <div>Last seen: {formatLastSeen(ac.lastSeen)}</div>
                        <div>Connected: {getConnectionDuration(ac.connectionTime)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{ac.messageCount} messages</span>
                    </div>
                    
                    {ac.route && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{ac.route}</span>
                      </div>
                    )}
                    
                    {ac.position && (
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{ac.position}</span>
                      </div>
                    )}
                    
                    {ac.altitude && (
                      <div className="flex items-center space-x-2">
                        <Signal className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{ac.altitude}</span>
                      </div>
                    )}
                    
                    {ac.speed && (
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{ac.speed}</span>
                      </div>
                    )}
                    
                    {ac.heading && (
                      <div className="flex items-center space-x-2">
                        <Radio className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{ac.heading}</span>
                      </div>
                    )}
                    
                    {ac.fuelStatus && (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">Fuel: {ac.fuelStatus}</span>
                      </div>
                    )}
                    
                    {ac.estimatedArrival && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">ETA: {format(ac.estimatedArrival, 'HH:mm')}</span>
                      </div>
                    )}
                  </div>
                  
                  {ac.specialRequests && ac.specialRequests.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <div className="flex flex-wrap gap-2">
                        {ac.specialRequests.map((request, index) => (
                          <span key={index} className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded border border-red-500/30">
                            {request}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {ac.lastMessage && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <div className="text-xs text-gray-400 mb-1">Last Message:</div>
                      <div className="text-sm text-gray-300 font-mono bg-gray-900/50 p-2 rounded border border-gray-700/50">
                        {ac.lastMessage}
                      </div>
                    </div>
                  )}
                  
                  {selectedAircraft === ac.id && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Quick Actions</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowQuickActions(!showQuickActions);
                          }}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          {showQuickActions ? 'Hide' : 'Show'} Actions
                        </button>
                      </div>
                      
                      {showQuickActions && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {quickActions.map((action, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction(action.action, ac.callsign);
                              }}
                              className="px-3 py-2 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded border border-gray-600/50 hover:border-gray-500/50 transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                          <div>
                            <span className="font-medium">Connection Time:</span>
                            <div className="text-white">{getConnectionDuration(ac.connectionTime)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Total Messages:</span>
                            <div className="text-white">{ac.messageCount}</div>
                          </div>
                          {ac.lastPositionUpdate && (
                            <div>
                              <span className="font-medium">Last Position Update:</span>
                              <div className="text-white">{formatLastSeen(ac.lastPositionUpdate)}</div>
                            </div>
                          )}
                          {ac.weather && (
                            <div>
                              <span className="font-medium">Weather:</span>
                              <div className="text-white">{ac.weather}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
