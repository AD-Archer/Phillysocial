'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaEllipsisH, FaUserPlus, FaEdit, FaTrash, FaComment, FaReply, FaCheck, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebaseConfig';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection, addDoc, onSnapshot, Timestamp, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Event } from '@/types/Event';
import { Comment } from '@/types/Post';
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

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

  // Wrap fetchComments in useCallback
  const fetchComments = useCallback(async (eventId: string) => {
    // Process comments to build the reply structure
    const processComments = (commentsArray: Comment[]): Comment[] => {
      const topLevelComments: Comment[] = [];
      const commentMap = new Map<string, Comment>();
      
      // First, create a map of all comments by ID
      commentsArray.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });
      
      // Then, organize them into a tree structure
      commentsArray.forEach(comment => {
        const processedComment = commentMap.get(comment.id)!;
        
        if (comment.parentId && commentMap.has(comment.parentId)) {
          // This is a reply, add it to its parent's replies
          const parent = commentMap.get(comment.parentId)!;
          parent.replies = [...(parent.replies || []), processedComment];
        } else {
          // This is a top-level comment
          topLevelComments.push(processedComment);
        }
      });
      
      // Sort top-level comments by date (newest first)
      return topLevelComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    };

    try {
      const commentsRef = collection(db, 'events', eventId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      
      // Set up real-time listener for comments
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData: Comment[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const comment: Comment = {
            id: doc.id,
            content: data.content,
            authorId: data.createdBy,
            authorName: data.authorName || 'Anonymous',
            authorPhotoURL: data.authorPhotoURL || null,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            lastEdited: data.lastEdited ? (data.lastEdited instanceof Timestamp ? data.lastEdited.toDate() : new Date(data.lastEdited)) : null,
            isDeleted: data.isDeleted || false,
            parentId: data.parentId || null,
            replies: [],
          };
          
          commentsData.push(comment);
        });
        
        // Process comments to build the reply structure
        const processedComments = processComments(commentsData);
        setComments(processedComments);
      });
      
      return unsubscribe;
    } catch (err) {
      console.error('Error fetching comments:', err);
      showToast('Failed to load comments', 'error');
    }
  }, [showToast]);

  // Add fetchComments to the dependency array
  useEffect(() => {
    setEvent(null);
    setError(null);
    setShowMenu(false);
    setComments([]);
    
    if (!eventId) return;
    
    setIsLoading(true);
    
    // Fetch event data
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
          
          // Fetch comments for this event
          fetchComments(docSnapshot.id);
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
  }, [eventId, fetchComments]);

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
        authorPhotoURL: user.photoURL || null,
        isDeleted: false,
        parentId: null
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

  const handleReplySubmit = async (parentId: string) => {
    if (!user || !event || !replyContent.trim()) return;
    
    try {
      const commentsRef = collection(db, 'events', event.id, 'comments');
      await addDoc(commentsRef, {
        content: replyContent.trim(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || null,
        isDeleted: false,
        parentId: parentId
      });
      
      setReplyContent('');
      setReplyingTo(null);
      showToast('Reply added', 'success');
    } catch (err) {
      console.error('Error adding reply:', err);
      showToast('Failed to add reply', 'error');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!user || !event || !editedCommentContent.trim()) return;
    
    try {
      const commentRef = doc(db, 'events', event.id, 'comments', commentId);
      await updateDoc(commentRef, {
        content: editedCommentContent.trim(),
        lastEdited: serverTimestamp()
      });
      
      setEditingComment(null);
      setEditedCommentContent('');
      showToast('Comment updated', 'success');
    } catch (err) {
      console.error('Error updating comment:', err);
      showToast('Failed to update comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !event) return;
    
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        const commentRef = doc(db, 'events', event.id, 'comments', commentId);
        
        // Mark as deleted instead of actually deleting
        await updateDoc(commentRef, {
          isDeleted: true,
          content: '[This comment has been deleted]'
        });
        
        showToast('Comment deleted', 'success');
      } catch (err) {
        console.error('Error deleting comment:', err);
        showToast('Failed to delete comment', 'error');
      }
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

  const formatCommentDate = (date: Date | null | undefined): string => {
    if (!date) {
      return 'just now';
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'just now';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    return dateObj.toLocaleDateString();
  };

  // Render a single comment with its replies
  const renderComment = (comment: Comment, level = 0) => {
    const isAuthor = user && comment.authorId === user.uid;
    const isAdmin = user && event && (event.admins?.includes(user.uid) || event.createdBy === user.uid);
    const canModify = isAuthor || isAdmin;
    
    return (
      <div 
        key={comment.id} 
        className={`mb-4 ${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {comment.authorPhotoURL ? (
              <Image 
                src={comment.authorPhotoURL} 
                alt={comment.authorName} 
                width={40} 
                height={40} 
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {comment.authorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-grow">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{comment.authorName}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatCommentDate(comment.createdAt)}
                    {comment.lastEdited && !comment.isDeleted && (
                      <span className="ml-1">(edited)</span>
                    )}
                  </span>
                </div>
                
                {canModify && !comment.isDeleted && (
                  <div className="flex space-x-2">
                    {isAuthor && (
                      <button 
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditedCommentContent(comment.content);
                        }}
                        className="text-gray-500 hover:text-blue-500"
                      >
                        <FaEdit size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              {editingComment === comment.id ? (
                <div className="mt-2">
                  <textarea
                    value={editedCommentContent}
                    onChange={(e) => setEditedCommentContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      onClick={() => {
                        setEditingComment(null);
                        setEditedCommentContent('');
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                    >
                      <FaTimes className="mr-1" /> Cancel
                    </button>
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                    >
                      <FaCheck className="mr-1" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`mt-1 ${comment.isDeleted ? 'text-gray-500 italic' : ''}`}>
                  {comment.content}
                </p>
              )}
            </div>
            
            {!comment.isDeleted && user && (
              <div className="mt-1 ml-1">
                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    setReplyContent('');
                    setTimeout(() => {
                      if (replyInputRef.current) {
                        replyInputRef.current.focus();
                      }
                    }, 0);
                  }}
                  className="text-sm text-gray-500 hover:text-blue-500 flex items-center"
                >
                  <FaReply className="mr-1" /> Reply
                </button>
              </div>
            )}
            
            {replyingTo === comment.id && (
              <div className="mt-2 ml-1">
                <div className="flex">
                  <div className="flex-shrink-0 mr-2">
                    {user?.photoURL ? (
                      <Image 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        width={32} 
                        height={32} 
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <textarea
                      ref={replyInputRef}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${comment.authorName}...`}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyContent.trim()}
                        className={`px-3 py-1 text-sm bg-blue-500 text-white rounded-md ${
                          replyContent.trim() ? 'hover:bg-blue-600' : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Render replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, level + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
                          if (isUserAttending()) {
                            handleLeaveEvent();
                          } else {
                            handleJoinEvent();
                          }
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
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <FaComment className="mr-2" /> Comments
            </h3>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-sm text-gray-500 hover:text-blue-500"
            >
              {showComments ? 'Hide' : 'Show'} Comments
            </button>
          </div>
          
          {showComments && (
            <>
              {/* Comment Form */}
              {user && (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      {user.photoURL ? (
                        <Image 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          width={40} 
                          height={40} 
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {user.displayName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <textarea
                        ref={commentInputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!newComment.trim() || isSubmittingComment}
                          className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
                            newComment.trim() && !isSubmittingComment
                              ? 'hover:bg-blue-600'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
              
              {/* Comments List */}
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map(comment => renderComment(comment))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {showEditModal && (
          <EditEventModal
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