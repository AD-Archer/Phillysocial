'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaEllipsisH, FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection, addDoc, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Event } from '@/types/Event';
import { useToast } from '@/layouts/Toast';
import EditEventModal from '@/models/EditEventModal';
import ManageEventAttendeesModal from '@/models/ManageEventAttendeesModal';

interface EventViewProps {
  eventId: string | null;
}

export default function EventView({ eventId }: EventViewProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setEvent(null);
    setError(null);
    setShowMenu(false);
    
    if (!eventId) return;
    
    setIsLoading(true);
    
    const eventRef = doc(db, 'events', eventId);
    const unsubscribe = onSnapshot(
      eventRef,
      (docSnapshot) => {
        setIsLoading(false);
        if (docSnapshot.exists()) {
          const eventData = docSnapshot.data();
          setEvent({
            id: docSnapshot.id,
            ...eventData,
            date: eventData.date instanceof Timestamp ? eventData.date.toDate() : new Date(eventData.date),
            createdAt: eventData.createdAt instanceof Timestamp ? eventData.createdAt.toDate() : new Date(eventData.createdAt),
            lastEdited: eventData.lastEdited instanceof Timestamp ? eventData.lastEdited.toDate() : new Date(eventData.lastEdited),
          } as Event);
        } else {
          setError('Event not found');
        }
      },
      (err) => {
        console.error('Error fetching event:', err);
        setIsLoading(false);
        setError('Failed to load event details');
      }
    );
    
    return () => unsubscribe();
  }, [eventId]);

  const isUserAttending = () => {
    if (!user || !event) return false;
    return event.attendees?.includes(user.uid);
  };

  const isUserAdmin = () => {
    if (!user || !event) return false;
    return event.admins?.includes(user.uid);
  };

  const isEventCreator = () => {
    if (!user || !event) return false;
    return event.createdBy === user.uid;
  };

  const handleJoinEvent = async () => {
    if (!user || !event) return;
    
    setIsJoining(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        attendees: arrayUnion(user.uid)
      });
      showToast('You have joined the event', 'success');
    } catch (err) {
      console.error('Error joining event:', err);
      showToast('Failed to join event', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!user || !event) return;
    
    // Don't allow the creator to leave their own event
    if (isEventCreator()) {
      showToast('Event creators cannot leave their own events', 'error');
      return;
    }
    
    setIsLeaving(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        attendees: arrayRemove(user.uid),
        admins: arrayRemove(user.uid) // Also remove from admins if they were an admin
      });
      showToast('You have left the event', 'success');
    } catch (err) {
      console.error('Error leaving event:', err);
      showToast('Failed to leave event', 'error');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!user || !event) return;
    
    if (!isEventCreator() && !isUserAdmin()) {
      showToast('You do not have permission to delete this event', 'error');
      return;
    }
    
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'events', event.id));
        showToast('Event deleted successfully', 'success');
      } catch (err) {
        console.error('Error deleting event:', err);
        showToast('Failed to delete event', 'error');
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !event || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const commentsRef = collection(db, 'events', event.id, 'comments');
      await addDoc(commentsRef, {
        content: newComment.trim(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || null
      });
      
      setNewComment('');
      showToast('Comment added', 'success');
    } catch (err) {
      console.error('Error adding comment:', err);
      showToast('Failed to add comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  if (!eventId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center h-full flex items-center justify-center">
        <div>
          <FaCalendarAlt className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No event selected</h3>
          <p className="text-gray-500">
            Select an event from the list to view details
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004C54]"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <FaCalendarAlt className="mx-auto text-red-300 mb-4" size={48} />
        <h3 className="text-xl font-medium text-red-700 mb-2">Error</h3>
        <p className="text-gray-500 mb-4">
          {error || 'Failed to load event details'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Event Header */}
      <div className="relative h-48 md:h-64 bg-gray-200">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#003038] to-[#004C54]">
            <FaCalendarAlt className="text-white opacity-30" size={64} />
          </div>
        )}
        
        {/* Event Actions */}
        <div className="absolute top-4 right-4">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-colors"
            >
              <FaEllipsisH className="text-gray-700" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
                >
                  <div className="py-1">
                    {(isUserAdmin() || isEventCreator()) && (
                      <>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowEditModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <FaEdit className="mr-2" /> Edit Event
                        </button>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowAttendeesModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <FaUserPlus className="mr-2" /> Manage Attendees
                        </button>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            handleDeleteEvent();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <FaTrash className="mr-2" /> Delete Event
                        </button>
                      </>
                    )}
                    {!isEventCreator() && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          isUserAttending() ? handleLeaveEvent() : handleJoinEvent();
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                          isUserAttending()
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <FaUsers className="mr-2" />
                        {isUserAttending() ? 'Leave Event' : 'Join Event'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Event Content */}
      <div className="p-6">
        <div className="flex items-center mb-2">
          <span className="px-2 py-1 bg-[#004C54]/10 text-[#004C54] text-xs rounded-full">
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </span>
          {!event.isPublic && (
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              Private
            </span>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{event.title}</h1>
        
        <div className="flex flex-col md:flex-row md:items-center mb-6">
          <div className="flex items-center mb-2 md:mb-0 md:mr-6">
            <FaCalendarAlt className="text-[#004C54] mr-2" />
            <span className="text-gray-700">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-[#004C54] mr-2" />
            <span className="text-gray-700">{event.location}</span>
          </div>
        </div>
        
        <div className="flex items-center mb-6">
          <div className="flex items-center">
            <FaUsers className="text-[#004C54] mr-2" />
            <span className="text-gray-700">
              {event.attendees?.length || 0} {event.attendees?.length === 1 ? 'person' : 'people'} attending
            </span>
          </div>
          {event.capacity && (
            <span className="ml-2 text-gray-500">
              (Capacity: {event.capacity})
            </span>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">About this event</h2>
          <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-3">
              {event.organizer?.photoURL ? (
                <Image
                  src={event.organizer.photoURL}
                  alt={event.organizer.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                event.organizer?.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Organized by</p>
              <p className="font-medium text-gray-800">{event.organizer?.name}</p>
            </div>
          </div>
          
          {!isEventCreator() && (
            <button
              onClick={isUserAttending() ? handleLeaveEvent : handleJoinEvent}
              disabled={isJoining || isLeaving}
              className={`px-4 py-2 rounded-md transition-colors ${
                isUserAttending()
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-[#004C54] text-white hover:bg-[#003940]'
              } disabled:opacity-70`}
            >
              {isJoining ? 'Joining...' : isLeaving ? 'Leaving...' : isUserAttending() ? 'Leave Event' : 'Join Event'}
            </button>
          )}
        </div>
        
        {/* Comments Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Comments</h2>
          
          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex">
              <div className="w-10 h-10 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  (user?.displayName || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004C54] resize-none"
                  rows={3}
                ></textarea>
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors disabled:opacity-70"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
          
          {/* Comments List */}
          <div className="space-y-4">
            {event.comments && event.comments.length > 0 ? (
              event.comments.map((comment, index) => (
                <div key={index} className="flex">
                  <div className="w-10 h-10 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    {comment.authorPhotoURL ? (
                      <Image
                        src={comment.authorPhotoURL}
                        alt={comment.authorName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      comment.authorName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-gray-800">{comment.authorName}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {comment.createdAt && new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {showEditModal && (
          <EditEventModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            event={event}
          />
        )}
        
        {showAttendeesModal && (
          <ManageEventAttendeesModal
            isOpen={showAttendeesModal}
            onClose={() => setShowAttendeesModal(false)}
            event={event}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 