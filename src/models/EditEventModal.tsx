'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaImage, FaExclamationTriangle, FaSpinner, FaCheck, FaLock, FaGlobe } from 'react-icons/fa';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Event, EventCategory } from '@/types/Event';
import { useToast } from '../layouts/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface EditEventModalProps {
  event: Event;
  onClose: () => void;
  onUpdate?: (updatedEvent: Event) => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ event, onClose, onUpdate }) => {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState(event.location);
  const [category, setCategory] = useState<EventCategory>(event.category);
  const [isPublic, setIsPublic] = useState(event.isPublic !== false); // Default to true if not specified
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event.imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [capacity, setCapacity] = useState<number | ''>(event.capacity || '');
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
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

  // Initialize date and time from event date
  useEffect(() => {
    if (event.date) {
      const eventDate = new Date(event.date);
      
      // Format date as YYYY-MM-DD
      const formattedDate = eventDate.toISOString().split('T')[0];
      setDate(formattedDate);
      
      // Format time as HH:MM
      const hours = eventDate.getHours().toString().padStart(2, '0');
      const minutes = eventDate.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  }, [event.date]);

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
      setRemoveCurrentImage(true);
      
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
    setRemoveCurrentImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!user) {
      setError('You must be logged in to edit an event.');
      setIsLoading(false);
      return;
    }

    // Check if user is authorized to edit (admin or creator)
    if (user.uid !== event.createdBy && !event.admins?.includes(user.uid)) {
      setError('You do not have permission to edit this event.');
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

      let imageUrl = removeCurrentImage ? null : event.imageUrl;

      // Handle image changes
      if (imageFile) {
        // Upload new image
        const imageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
        
        // Delete old image if it exists and we're replacing it
        if (event.imageUrl && event.imageUrl.includes('firebase')) {
          try {
            // Extract the path from the URL
            const oldImagePath = event.imageUrl.split('events%2F')[1].split('?')[0];
            const oldImageRef = ref(storage, `events/${oldImagePath}`);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.error('Error deleting old image:', error);
            // Continue with the update even if image deletion fails
          }
        }
      } else if (removeCurrentImage && event.imageUrl) {
        // Just delete the old image without replacing it
        try {
          // Extract the path from the URL
          const oldImagePath = event.imageUrl.split('events%2F')[1].split('?')[0];
          const oldImageRef = ref(storage, `events/${oldImagePath}`);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue with the update even if image deletion fails
        }
      }

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date: eventDateTime,
        location: location.trim(),
        category,
        isPublic,
        lastEdited: new Date(),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(capacity !== '' ? { capacity: Number(capacity) } : { capacity: null }),
      };

      // Update the document in Firestore
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, eventData);

      // Create the updated event object
      const updatedEvent: Event = {
        ...event,
        ...eventData,
      };

      onUpdate?.(updatedEvent);
      showToast('Event updated successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event. Please try again.');
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
      <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto pt-20">
        <motion.div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] flex flex-col my-4"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-[#003940] to-[#046A38] text-white rounded-t-lg">
            <h2 className="text-lg font-semibold">Edit Event</h2>
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
                    Updating...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Update Event
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditEventModal; 