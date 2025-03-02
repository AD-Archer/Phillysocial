'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaImage, FaExclamationTriangle, FaSpinner, FaRandom, FaLock, FaGlobe } from 'react-icons/fa';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Event, EventCategory } from '@/types/Event';
import { useToast } from '../layouts/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: Event) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<EventCategory>('community');
  const [isPublic, setIsPublic] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const { user } = useAuth();
  const { showToast } = useToast();

  // Categories for events
  const categories = [
    { id: 'sports', name: 'Sports' },
    { id: 'food', name: 'Food & Dining' },
    { id: 'music', name: 'Music' },
    { id: 'arts', name: 'Arts & Culture' },
    { id: 'tech', name: 'Technology' },
    { id: 'community', name: 'Community' },
    { id: 'other', name: 'Other' },
  ];

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!user) {
      setError('You must be logged in to create an event.');
      setIsLoading(false);
      return;
    }

    try {
      // Validate inputs
      if (!title.trim()) {
        setError('Event title is required.');
        setIsLoading(false);
        return;
      }

      if (!date) {
        setError('Event date is required.');
        setIsLoading(false);
        return;
      }

      if (!time) {
        setError('Event time is required.');
        setIsLoading(false);
        return;
      }

      if (!location.trim()) {
        setError('Event location is required.');
        setIsLoading(false);
        return;
      }

      // Combine date and time into a single Date object
      const eventDateTime = new Date(`${date}T${time}`);
      
      // Check if the date is in the past
      if (eventDateTime < new Date()) {
        setError('Event date and time cannot be in the past.');
        setIsLoading(false);
        return;
      }

      let imageUrl = null;

      // Upload image if one was selected
      if (imageFile) {
        const imageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const eventData: Omit<Event, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        date: eventDateTime,
        location: location.trim(),
        category,
        isPublic,
        createdBy: user.uid,
        createdAt: new Date(),
        attendees: [user.uid],
        admins: [user.uid],
        comments: [],
        ...(imageUrl && { imageUrl }),
        ...(capacity !== '' && { capacity: Number(capacity) }),
        organizer: {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          ...(user.photoURL && { photoURL: user.photoURL }),
        }
      };

      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        createdAt: serverTimestamp(), // Use serverTimestamp for Firestore
        date: eventDateTime, // Store as Firestore timestamp
      });

      // Create the event object with the new ID
      const newEvent: Event = {
        id: docRef.id,
        ...eventData
      };

      onEventCreated(newEvent);
      showToast('Event created successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];

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
              <h2 className="text-lg font-semibold">Create New Event</h2>
              <motion.button 
                onClick={onClose} 
                className="text-white hover:text-[#A5ACAF] p-1 rounded-full hover:bg-black/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes />
              </motion.button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
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
              
              <div className="mb-4">
                <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title*
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                  placeholder="Enter event title"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="text-gray-400" />
                    </div>
                    <input
                      id="event-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={today}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="event-time" className="block text-sm font-medium text-gray-700 mb-1">
                    Time*
                  </label>
                  <input
                    id="event-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    id="event-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                    placeholder="Enter event location"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="event-capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (optional)
                </label>
                <input
                  id="event-capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseInt(val) >= 0) {
                      setCapacity(val === '' ? '' : parseInt(val));
                    }
                  }}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                  placeholder="Maximum number of attendees (leave empty for unlimited)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for unlimited capacity
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="event-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Setting
                </span>
                <div className="flex space-x-4 mb-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="privacy"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="mr-2 text-[#046A38] focus:ring-[#046A38]"
                    />
                    <div className="flex items-center group-hover:text-[#046A38] transition-colors">
                      <FaGlobe className="mr-1 text-[#046A38]" />
                      <span>Public</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="mr-2 text-[#004C54] focus:ring-[#004C54]"
                    />
                    <div className="flex items-center group-hover:text-[#004C54] transition-colors">
                      <FaLock className="mr-1 text-[#004C54]" />
                      <span>Private</span>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  {isPublic 
                    ? 'Public events can be seen and joined by anyone' 
                    : 'Private events are only visible to invited users'}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Image (optional)
                </label>
                
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden mb-2">
                    <Image 
                      src={imagePreview} 
                      alt="Event preview" 
                      width={400} 
                      height={200} 
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#004C54] transition-colors">
                    <input
                      type="file"
                      id="event-image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label htmlFor="event-image" className="cursor-pointer flex flex-col items-center">
                      <FaImage className="text-gray-400 text-3xl mb-2" />
                      <span className="text-sm text-gray-500">Click to upload an image</span>
                      <span className="text-xs text-gray-400 mt-1">(Max size: 5MB)</span>
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaCalendarAlt className="mr-2" />
                      Create Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateEventModal; 