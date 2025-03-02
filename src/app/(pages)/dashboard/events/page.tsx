'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaFilter, FaChevronDown, FaChevronUp, FaUsers } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/layouts/Toast';

// Event type definition
interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  imageUrl?: string;
  category: EventCategory;
  attendees: string[];
  organizer: {
    id: string;
    name: string;
    photoURL?: string;
  };
}

type EventCategory = 'sports' | 'food' | 'music' | 'arts' | 'tech' | 'community' | 'other';

export default function Events() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [rsvpingEvent, setRsvpingEvent] = useState<string | null>(null);

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

  // Move mockEvents inside useMemo
  const mockEvents = useMemo(() => [
    {
      id: '1',
      title: 'Eagles Watch Party',
      description: 'Join fellow Eagles fans to watch the game against the Cowboys. Food and drinks available for purchase.',
      date: new Date(Date.now() + 86400000 * 3), // 3 days from now
      location: 'Xfinity Live!, 1100 Pattison Ave',
      imageUrl: '/images/eagles-watch.jpg',
      category: 'sports' as EventCategory,
      attendees: ['user1', 'user2', 'user3', 'user4', 'user5'],
      organizer: {
        id: 'org1',
        name: 'Philly Sports Club',
        photoURL: '/images/philly-sports-club.jpg',
      },
    },
    {
      id: '2',
      title: 'Food Truck Festival',
      description: 'Sample the best food trucks in Philadelphia all in one place. Over 20 vendors with cuisines from around the world.',
      date: new Date(Date.now() + 86400000 * 7), // 7 days from now
      location: 'The Navy Yard, 4747 S Broad St',
      imageUrl: '/images/food-truck.jpg',
      category: 'food' as EventCategory,
      attendees: ['user1', 'user3', 'user6', 'user7'],
      organizer: {
        id: 'org2',
        name: 'Philly Foodies',
        photoURL: '/images/philly-foodies.jpg',
      },
    },
    {
      id: '3',
      title: 'Jazz in the Park',
      description: 'Enjoy an evening of live jazz music in Rittenhouse Square. Bring a blanket and picnic basket.',
      date: new Date(Date.now() + 86400000 * 14), // 14 days from now
      location: 'Rittenhouse Square, 210 W Rittenhouse Square',
      imageUrl: '/images/jazz-park.jpg',
      category: 'music' as EventCategory,
      attendees: ['user2', 'user4', 'user8', 'user9', 'user10', 'user11'],
      organizer: {
        id: 'org3',
        name: 'Philly Music Society',
        photoURL: '/images/philly-music.jpg',
      },
    },
    {
      id: '4',
      title: 'Tech Meetup: AI and Machine Learning',
      description: 'Network with tech professionals and learn about the latest developments in AI and machine learning.',
      date: new Date(Date.now() + 86400000 * 1), // 1 day from now
      location: 'WeWork, 1601 Market St',
      imageUrl: '/images/tech-meetup.jpg',
      category: 'tech' as EventCategory,
      attendees: ['user5', 'user12', 'user13'],
      organizer: {
        id: 'org4',
        name: 'Philly Tech Hub',
        photoURL: '/images/philly-tech.jpg',
      },
    },
    {
      id: '5',
      title: 'Art Gallery Opening',
      description: 'Be among the first to see the new exhibition featuring local artists. Wine and cheese will be served.',
      date: new Date(Date.now() + 86400000 * 5), // 5 days from now
      location: 'Philadelphia Museum of Art, 2600 Benjamin Franklin Pkwy',
      imageUrl: '/images/art-gallery.jpg',
      category: 'arts' as EventCategory,
      attendees: ['user7', 'user9', 'user14', 'user15'],
      organizer: {
        id: 'org5',
        name: 'Philly Arts Collective',
        photoURL: '/images/philly-arts.jpg',
      },
    },
    {
      id: '6',
      title: 'Community Cleanup',
      description: 'Help keep our city beautiful by participating in a community cleanup. Supplies will be provided.',
      date: new Date(Date.now() + 86400000 * 2), // 2 days from now
      location: 'FDR Park, 1500 Pattison Ave',
      imageUrl: '/images/community-cleanup.jpg',
      category: 'community' as EventCategory,
      attendees: ['user1', 'user6', 'user16', 'user17', 'user18'],
      organizer: {
        id: 'org6',
        name: 'Clean Philly Initiative',
        photoURL: '/images/clean-philly.jpg',
      },
    },
  ], []);

  const loadInitialEvents = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, [mockEvents]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      // In a real app, you would fetch events from Firestore
      // For now, we'll use mock data
      loadInitialEvents();
    }
  }, [user, loading, router, loadInitialEvents]);

  useEffect(() => {
    // Filter events based on active category, date filter, and search query
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
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) || 
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }
    
    // Sort events by date (closest first)
    filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    setFilteredEvents(filtered);
  }, [events, activeCategory, dateFilter, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect
  };

  const handleRSVP = (eventId: string) => {
    if (!user) return;
    
    setRsvpingEvent(eventId);
    
    // In a real app, you would update the event in Firestore
    setTimeout(() => {
      setEvents(events.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            attendees: [...event.attendees, user.uid]
          };
        }
        return event;
      }));
      
      showToast('Successfully RSVP\'d to event', 'success');
      setRsvpingEvent(null);
    }, 1000);
  };

  const isUserAttending = (eventId: string) => {
    if (!user) return false;
    
    const event = events.find(e => e.id === eventId);
    return event ? event.attendees.includes(user.uid) : false;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="pt-16 flex-1 flex flex-col">
        <main className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 w-full flex-1 flex flex-col">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              <FaCalendarAlt className="mr-3 text-[#004C54]" />
              Events
            </h1>
            <p className="text-gray-600 mt-1">
              Discover and join events happening in and around Philadelphia
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004C54]"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors flex items-center"
              >
                <FaFilter className="mr-1" />
                <span className="hidden sm:inline">Filters</span>
                {showFilters ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
              </button>
            </form>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-4 rounded-lg shadow-md mb-4 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Date</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setDateFilter('all')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            dateFilter === 'all'
                              ? 'bg-[#004C54] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setDateFilter('today')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            dateFilter === 'today'
                              ? 'bg-[#004C54] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Today
                        </button>
                        <button
                          onClick={() => setDateFilter('week')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            dateFilter === 'week'
                              ? 'bg-[#004C54] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          This Week
                        </button>
                        <button
                          onClick={() => setDateFilter('month')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            dateFilter === 'month'
                              ? 'bg-[#004C54] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          This Month
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Show only</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setActiveCategory('all')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            activeCategory === 'all'
                              ? 'bg-[#004C54] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          All
                        </button>
                        <button
                          className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          My Events
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Category Tabs */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id as EventCategory | 'all')}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'bg-[#004C54] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Event */}
          {filteredEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Featured Event</h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3 h-48 md:h-auto relative">
                    {filteredEvents[0].imageUrl ? (
                      <Image
                        src={filteredEvents[0].imageUrl}
                        alt={filteredEvents[0].title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <FaCalendarAlt className="text-gray-400" size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-6 md:w-2/3">
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-1 bg-[#004C54]/10 text-[#004C54] text-xs rounded-full">
                        {filteredEvents[0].category.charAt(0).toUpperCase() + filteredEvents[0].category.slice(1)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 flex items-center">
                        <FaUsers className="mr-1" /> {filteredEvents[0].attendees.length} attending
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{filteredEvents[0].title}</h3>
                    <p className="text-gray-600 mb-4">{filteredEvents[0].description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                      <div className="flex items-center mb-2 sm:mb-0 sm:mr-6">
                        <FaCalendarAlt className="text-[#004C54] mr-2" />
                        <span className="text-sm text-gray-700">{formatDate(filteredEvents[0].date)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="text-[#004C54] mr-2" />
                        <span className="text-sm text-gray-700">{filteredEvents[0].location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {filteredEvents[0].organizer.photoURL ? (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
                            <Image
                              src={filteredEvents[0].organizer.photoURL}
                              alt={filteredEvents[0].organizer.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-2">
                            {filteredEvents[0].organizer.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-gray-700">Organized by {filteredEvents[0].organizer.name}</span>
                      </div>
                      {isUserAttending(filteredEvents[0].id) ? (
                        <button
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Attending
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRSVP(filteredEvents[0].id)}
                          disabled={rsvpingEvent === filteredEvents[0].id}
                          className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors disabled:opacity-70"
                        >
                          {rsvpingEvent === filteredEvents[0].id ? 'RSVPing...' : 'RSVP'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Events */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
              <Link
                href="/create-event"
                className="flex items-center px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] transition-colors"
              >
                <FaCalendarAlt className="mr-1" /> Create Event
              </Link>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004C54]"></div>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.slice(1).map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-40 bg-gray-200 relative">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaCalendarAlt className="text-gray-400" size={32} />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-[#004C54]/80 text-white text-xs rounded-full">
                        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 text-lg mb-2">{event.title}</h3>
                      <div className="flex items-center mb-2">
                        <FaCalendarAlt className="text-[#004C54] mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center mb-3">
                        <FaMapMarkerAlt className="text-[#004C54] mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{event.location}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center">
                          <FaUsers className="mr-1" /> {event.attendees.length} attending
                        </span>
                        {isUserAttending(event.id) ? (
                          <button
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Attending
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRSVP(event.id)}
                            disabled={rsvpingEvent === event.id}
                            className="px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] transition-colors disabled:opacity-70"
                          >
                            {rsvpingEvent === event.id ? 'RSVPing...' : 'RSVP'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <FaCalendarAlt className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No events found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? `No events match "${searchQuery}"`
                    : activeCategory !== 'all'
                    ? `No ${activeCategory} events found`
                    : dateFilter !== 'all'
                    ? `No events found for the selected time period`
                    : 'No events found'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                    setDateFilter('all');
                  }}
                  className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors"
                >
                  Show All Events
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
