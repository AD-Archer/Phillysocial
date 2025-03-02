'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Event, EventCategory } from '@/types/Event';
import { useAuth } from '@/lib/context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaSearch, FaFilter, FaChevronDown, FaChevronUp, FaSpinner } from 'react-icons/fa';
import { useToast } from '../../layouts/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import CreateEventModal from '../../models/CreateEventModal';

interface EventListProps {
  onSelectEvent: (eventId: string) => void;
  selectedEventId: string | null;
}

const EventList: React.FC<EventListProps> = ({ onSelectEvent, selectedEventId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'past'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Categories for events
  const categories = [
    { id: 'all', name: 'All Events' },
    { id: 'sports', name: 'Sports' },
    { id: 'food', name: 'Food & Dining' },
    { id: 'music', name: 'Music' },
    { id: 'arts', name: 'Arts & Culture' },
    { id: 'tech', name: 'Technology' },
    { id: 'community', name: 'Community' },
    { id: 'other', name: 'Other' },
  ];

  // Wrap fetchEvents in useCallback
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a query to get all public events and private events where the user is an attendee
      const publicEventsQuery = query(
        collection(db, 'events'),
        where('isPublic', '==', true),
        orderBy('date', 'asc')
      );
      
      const userEventsQuery = query(
        collection(db, 'events'),
        where('attendees', 'array-contains', user.uid),
        orderBy('date', 'asc')
      );
      
      // Execute both queries
      const [publicEventsSnapshot, userEventsSnapshot] = await Promise.all([
        getDocs(publicEventsQuery),
        getDocs(userEventsQuery)
      ]);
      
      // Combine results, removing duplicates
      const eventMap = new Map();
      
      // Add public events
      publicEventsSnapshot.forEach((doc) => {
        const data = doc.data();
        eventMap.set(doc.id, {
          id: doc.id,
          title: data.title,
          description: data.description || '',
          date: data.date ? data.date.toDate() : new Date(),
          location: data.location,
          category: data.category,
          isPublic: data.isPublic !== false, // Default to true if not specified
          imageUrl: data.imageUrl || null,
          capacity: data.capacity || null,
          attendees: data.attendees || [],
          admins: data.admins || [],
          createdBy: data.createdBy,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          lastEdited: data.lastEdited ? data.lastEdited.toDate() : null,
          comments: data.comments || [],
          organizer: data.organizer || {
            id: data.createdBy,
            name: 'Anonymous',
          },
        });
      });
      
      // Add user's private events
      userEventsSnapshot.forEach((doc) => {
        if (!eventMap.has(doc.id)) {
          const data = doc.data();
          eventMap.set(doc.id, {
            id: doc.id,
            title: data.title,
            description: data.description || '',
            date: data.date ? data.date.toDate() : new Date(),
            location: data.location,
            category: data.category,
            isPublic: data.isPublic !== false, // Default to true if not specified
            imageUrl: data.imageUrl || null,
            capacity: data.capacity || null,
            attendees: data.attendees || [],
            admins: data.admins || [],
            createdBy: data.createdBy,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            lastEdited: data.lastEdited ? data.lastEdited.toDate() : null,
            comments: data.comments || [],
            organizer: data.organizer || {
              id: data.createdBy,
              name: 'Anonymous',
            },
          });
        }
      });
      
      // Convert map to array and sort by date
      const eventsArray = Array.from(eventMap.values());
      eventsArray.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      setEvents(eventsArray);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
      showToast('Failed to load events', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  // Fetch events on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  // Apply filters and search
  useEffect(() => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    let filtered = [...events];
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(event => event.category === activeCategory);
    }
    
    // Filter by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    const monthFromNow = new Date(today);
    monthFromNow.setDate(today.getDate() + 30);
    
    if (dateFilter === 'today') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate < new Date(today.getTime() + 86400000);
      });
    } else if (dateFilter === 'week') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= weekFromNow;
      });
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= monthFromNow;
      });
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < today;
      });
    } else if (dateFilter === 'all') {
      // For 'all', we still want to show upcoming events first, then past events
      filtered.sort((a, b) => {
        const aIsPast = a.date < today;
        const bIsPast = b.date < today;
        
        if (aIsPast && !bIsPast) return 1;
        if (!aIsPast && bIsPast) return -1;
        
        // If both are past or both are upcoming, sort by date
        return a.date.getTime() - b.date.getTime();
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) || 
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }
    
    setFilteredEvents(filtered);
  }, [events, activeCategory, dateFilter, searchQuery]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect
  };

  // Handle event creation
  const handleEventCreated = (newEvent: Event) => {
    setEvents(prevEvents => {
      const updatedEvents = [...prevEvents, newEvent];
      // Sort by date
      updatedEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      return updatedEvents;
    });
    
    // Select the newly created event
    onSelectEvent(newEvent.id);
    
    showToast('Event created successfully', 'success');
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date >= today && date < tomorrow) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    if (date >= tomorrow && date < new Date(tomorrow.getTime() + 86400000)) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if an event is in the past
  const isEventPast = (date: Date) => {
    return date < new Date();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#003940] to-[#046A38] text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FaCalendarAlt className="mr-2" />
            Events
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-white text-[#004C54] rounded-md hover:bg-gray-100 flex items-center text-sm"
          >
            <FaCalendarAlt className="mr-1" />
            Create Event
          </button>
        </div>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-10 p-2 bg-white/10 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
          />
        </form>
      </div>
      
      {/* Filters */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-3 flex justify-between items-center text-gray-700 hover:bg-gray-50"
        >
          <div className="flex items-center">
            <FaFilter className="mr-2 text-[#004C54]" />
            <span>Filters</span>
            {(activeCategory !== 'all' || dateFilter !== 'all') && (
              <span className="ml-2 px-1.5 py-0.5 bg-[#004C54] text-white text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          {showFilters ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 border-t border-gray-100">
                <h3 className="font-medium mb-2">Category</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id as EventCategory | 'all')}
                      className={`px-3 py-1 text-sm rounded-full ${
                        activeCategory === category.id
                          ? 'bg-[#004C54] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                
                <h3 className="font-medium mb-2">Date</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDateFilter('all')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      dateFilter === 'all'
                        ? 'bg-[#004C54] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDateFilter('today')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      dateFilter === 'today'
                        ? 'bg-[#004C54] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateFilter('week')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      dateFilter === 'week'
                        ? 'bg-[#004C54] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setDateFilter('month')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      dateFilter === 'month'
                        ? 'bg-[#004C54] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setDateFilter('past')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      dateFilter === 'past'
                        ? 'bg-[#004C54] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Past Events
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <FaSpinner className="animate-spin text-[#004C54] text-2xl" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery || activeCategory !== 'all' || dateFilter !== 'all'
              ? 'No events match your filters'
              : 'No events found. Create your first event!'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredEvents.map((event) => {
              const isPast = isEventPast(event.date);
              const isSelected = selectedEventId === event.id;
              const isAttending = user && event.attendees.includes(user.uid);
              
              return (
                <motion.li
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`relative ${
                    isSelected ? 'bg-[#004C54]/10' : isPast ? 'bg-gray-50' : 'hover:bg-gray-50'
                  } ${isPast ? 'opacity-75' : ''}`}
                >
                  <button
                    onClick={() => onSelectEvent(event.id)}
                    className="w-full text-left p-4 focus:outline-none"
                  >
                    {isPast && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                        Past
                      </div>
                    )}
                    
                    {isAttending && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#046A38] text-white text-xs rounded-full">
                        Attending
                      </div>
                    )}
                    
                    <div className="flex">
                      {event.imageUrl ? (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          <Image 
                            src={event.imageUrl} 
                            alt={event.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-16 h-16 rounded-md mr-3 flex-shrink-0 flex items-center justify-center ${
                          event.category === 'sports' ? 'bg-blue-100 text-blue-500' :
                          event.category === 'food' ? 'bg-orange-100 text-orange-500' :
                          event.category === 'music' ? 'bg-purple-100 text-purple-500' :
                          event.category === 'arts' ? 'bg-pink-100 text-pink-500' :
                          event.category === 'tech' ? 'bg-indigo-100 text-indigo-500' :
                          event.category === 'community' ? 'bg-green-100 text-green-500' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          <FaCalendarAlt size={24} />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{event.title}</h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <FaCalendarAlt className="mr-1 flex-shrink-0" />
                          <span className="truncate">{formatDate(event.date)}</span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <FaMapMarkerAlt className="mr-1 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <FaUsers className="mr-1 flex-shrink-0" />
                          <span>{event.attendees.length} {event.attendees.length === 1 ? 'attendee' : 'attendees'}</span>
                          {event.capacity && (
                            <span className="ml-1">
                              (max: {event.capacity})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
      
      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

export default EventList; 