'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaUserMinus, FaUserCog, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Event } from '@/types/Event';
import { User } from '@/types/User';
import { useToast } from '../layouts/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ManageEventAttendeesModalProps {
  isOpen: boolean;
  event: Event;
  onClose: () => void;
  onUpdate?: (updatedEvent: Event) => void;
}

const ManageEventAttendeesModal: React.FC<ManageEventAttendeesModalProps> = ({ isOpen, event, onClose, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [attendees, setAttendees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Check if the current user is an admin of the event
  const isUserAdmin = user && event.admins?.includes(user.uid);

  // Fetch attendee details
  useEffect(() => {
    const fetchAttendees = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        if (!event.attendees || event.attendees.length === 0) {
          setAttendees([]);
          setIsLoading(false);
          return;
        }
        
        const attendeePromises = event.attendees.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              uid,
              displayName: userData.displayName || 'Anonymous',
              email: userData.email || '',
              photoURL: userData.photoURL || null,
            };
          }
          return null;
        });
        
        const attendeeResults = await Promise.all(attendeePromises);
        setAttendees(attendeeResults.filter((user): user is User => user !== null));
      } catch (error) {
        console.error('Error fetching attendees:', error);
        setError('Failed to load attendees');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttendees();
  }, [event.attendees]);

  // Filter attendees based on search query
  const filteredAttendees = searchQuery.trim() === '' 
    ? attendees 
    : attendees.filter(attendee => 
        attendee.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Remove attendee from event
  const handleRemoveAttendee = async (attendeeId: string) => {
    if (!user || !isUserAdmin) {
      showToast('You do not have permission to manage attendees', 'error');
      return;
    }
    
    // Don't allow removing the creator
    if (attendeeId === event.createdBy) {
      showToast('Cannot remove the event creator', 'error');
      return;
    }
    
    setProcessingUser(attendeeId);
    
    try {
      const eventRef = doc(db, 'events', event.id);
      
      // Remove from attendees
      await updateDoc(eventRef, {
        attendees: arrayRemove(attendeeId)
      });
      
      // If they're an admin, remove from admins too
      if (event.admins?.includes(attendeeId)) {
        await updateDoc(eventRef, {
          admins: arrayRemove(attendeeId)
        });
      }
      
      // Update local state
      const updatedEvent = {
        ...event,
        attendees: event.attendees.filter(id => id !== attendeeId),
        admins: event.admins?.filter(id => id !== attendeeId) || []
      };
      
      if (onUpdate) {
        onUpdate(updatedEvent);
      }
      showToast('Attendee removed successfully', 'success');
    } catch (error) {
      console.error('Error removing attendee:', error);
      showToast('Failed to remove attendee', 'error');
    } finally {
      setProcessingUser(null);
    }
  };

  // Toggle admin status for an attendee
  const handleToggleAdmin = async (attendeeId: string) => {
    if (!user || !isUserAdmin) {
      showToast('You do not have permission to manage admins', 'error');
      return;
    }
    
    // Don't allow changing the creator's admin status
    if (attendeeId === event.createdBy) {
      showToast('Cannot change admin status of the event creator', 'error');
      return;
    }
    
    setProcessingUser(attendeeId);
    
    try {
      const eventRef = doc(db, 'events', event.id);
      const isAdmin = event.admins?.includes(attendeeId) || false;
      
      if (isAdmin) {
        // Remove admin status
        await updateDoc(eventRef, {
          admins: arrayRemove(attendeeId)
        });
        
        // Update local state
        const updatedEvent = {
          ...event,
          admins: event.admins?.filter(id => id !== attendeeId) || []
        };
        
        if (onUpdate) {
          onUpdate(updatedEvent);
        }
        showToast('Admin status removed', 'success');
      } else {
        // Add admin status
        await updateDoc(eventRef, {
          admins: arrayUnion(attendeeId)
        });
        
        // Update local state
        const updatedEvent = {
          ...event,
          admins: [...(event.admins || []), attendeeId]
        };
        
        if (onUpdate) {
          onUpdate(updatedEvent);
        }
        showToast('Admin status granted', 'success');
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      showToast('Failed to update admin status', 'error');
    } finally {
      setProcessingUser(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] flex flex-col my-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-[#003940] to-[#046A38] text-white rounded-t-lg">
              <h2 className="text-lg font-semibold">Manage Event Attendees</h2>
              <motion.button 
                onClick={onClose} 
                className="text-white hover:text-[#A5ACAF] p-1 rounded-full hover:bg-black/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes />
              </motion.button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search attendees..."
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start"
                  >
                    <FaExclamationTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <FaSpinner className="animate-spin text-[#004C54] text-2xl" />
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery.trim() !== '' ? 'No matching attendees found' : 'No attendees yet'}
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredAttendees.map((attendee) => {
                    const isAdmin = event.admins?.includes(attendee.uid) || false;
                    const isCreator = attendee.uid === event.createdBy;
                    const isProcessing = processingUser === attendee.uid;
                    
                    return (
                      <motion.li 
                        key={attendee.uid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-center justify-between p-2 rounded-md ${
                          isAdmin ? 'bg-[#004C54]/10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          {attendee.photoURL ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                              <Image 
                                src={attendee.photoURL} 
                                alt={attendee.displayName}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-3">
                              {attendee.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-800 flex items-center">
                              {attendee.displayName}
                              {isCreator && (
                                <span className="ml-2 text-xs bg-[#046A38] text-white px-1.5 py-0.5 rounded">
                                  Creator
                                </span>
                              )}
                              {isAdmin && !isCreator && (
                                <span className="ml-2 text-xs bg-[#004C54] text-white px-1.5 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                            {attendee.email && (
                              <div className="text-xs text-gray-500">{attendee.email}</div>
                            )}
                          </div>
                        </div>
                        
                        {isUserAdmin && !isCreator && (
                          <div className="flex space-x-1">
                            <motion.button
                              onClick={() => handleToggleAdmin(attendee.uid)}
                              className={`p-1.5 rounded-full ${
                                isAdmin 
                                  ? 'bg-[#004C54] text-white hover:bg-[#003940]' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isProcessing}
                              title={isAdmin ? 'Remove admin status' : 'Make admin'}
                            >
                              <FaUserCog size={14} />
                            </motion.button>
                            <motion.button
                              onClick={() => handleRemoveAttendee(attendee.uid)}
                              className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isProcessing}
                              title="Remove from event"
                            >
                              {isProcessing ? (
                                <FaSpinner className="animate-spin" size={14} />
                              ) : (
                                <FaUserMinus size={14} />
                              )}
                            </motion.button>
                          </div>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {filteredAttendees.length} {filteredAttendees.length === 1 ? 'attendee' : 'attendees'}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManageEventAttendeesModal; 