'use client';
import { useState } from 'react';
import { FaTimes, FaLock, FaGlobe, FaExclamationTriangle, FaSpinner, FaHashtag, FaImage } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useToast } from '../layouts/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EditChannelModalProps {
  channel: Channel;
  onClose: () => void;
  onUpdate: (updatedChannel: Channel) => void;
}

const EditChannelModal: React.FC<EditChannelModalProps> = ({ 
  channel, 
  onClose,
  onUpdate
}) => {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description);
  const [isPublic, setIsPublic] = useState(channel.isPublic);
  const [imageUrl, setImageUrl] = useState(channel.imageUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [error, setError] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const checkChannelNameExists = async (channelName: string): Promise<boolean> => {
    if (channelName === channel.name) return false; // Same name as current, no conflict
    
    setIsCheckingName(true);
    try {
      const channelsRef = collection(db, 'channels');
      const q = query(channelsRef, where('name', '==', channelName));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking channel name:', error);
      return false;
    } finally {
      setIsCheckingName(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast('You must be logged in to edit a channel', 'error');
      return;
    }
    
    // Validate inputs
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Check if channel name already exists
      const nameExists = await checkChannelNameExists(name.trim());
      if (nameExists) {
        setError('A channel with this name already exists. Please choose a different name.');
        setIsLoading(false);
        return;
      }
      
      const channelRef = doc(db, 'channels', channel.id);
      
      const updates: Partial<Channel> = {
        name: name.trim(),
        description: description.trim(),
        isPublic,
      };
      
      // Handle imageUrl properly to avoid undefined values
      if (imageUrl !== channel.imageUrl) {
        const trimmedImageUrl = imageUrl.trim();
        if (trimmedImageUrl) {
          updates.imageUrl = trimmedImageUrl;
        } else {
          // Use empty string instead of null or undefined for empty values
          updates.imageUrl = '';
        }
      }
      
      await updateDoc(channelRef, updates);
      
      // Update local state
      const updatedChannel = {
        ...channel,
        ...updates,
      };
      
      onUpdate(updatedChannel);
      showToast('Channel updated successfully', 'success');
      onClose();
    } catch (error) {
      console.error('Error updating channel:', error);
      setError('Failed to update channel. Please try again.');
      showToast('Failed to update channel', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setImagePreviewError(true);
    showToast('Invalid image URL', 'error');
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-[#004C54]">Edit Channel</h2>
            <motion.button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
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
              <label htmlFor="channel-name" className="block text-sm font-medium text-gray-700 mb-1">
                Channel Name*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isPublic ? <FaHashtag className="text-gray-400" /> : <FaLock className="text-gray-400" />}
                </div>
                <input
                  id="channel-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                  placeholder="Enter channel name"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Choose a unique name for your channel
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="channel-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="channel-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                placeholder="Enter channel description"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="channel-image" className="block text-sm font-medium text-gray-700 mb-1">
                Channel Image URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaImage className="text-gray-400" />
                </div>
                <input
                  id="channel-image"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreviewError(false);
                  }}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                  placeholder="Enter image URL (optional)"
                />
              </div>
              
              <AnimatePresence>
                {imageUrl && !imagePreviewError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="mt-2 relative w-16 h-16 rounded-md overflow-hidden border border-gray-200"
                  >
                    <Image 
                      src={imageUrl}
                      alt="Channel preview"
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <p className="mt-1 text-xs text-gray-500">
                Provide a URL to an image for your channel (optional)
              </p>
            </div>
            
            <div className="mb-6">
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Privacy Setting
              </span>
              
              <div className="flex space-x-4">
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
              
              <p className="mt-1 text-xs text-gray-500">
                {isPublic 
                  ? 'Public channels can be joined by anyone' 
                  : 'Private channels require an invite code to join'}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 border-t pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors flex items-center"
                disabled={isLoading || isCheckingName}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading || isCheckingName ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {isCheckingName ? 'Checking...' : 'Saving...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditChannelModal; 