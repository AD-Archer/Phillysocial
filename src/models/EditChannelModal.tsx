'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaImage, FaLock, FaGlobe, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useToast } from '../layouts/Toast';

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
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate inputs
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      const updates: Partial<Channel> = {
        name: name.trim(),
        description: description.trim(),
        isPublic,
      };
      
      if (imageUrl !== channel.imageUrl) {
        updates.imageUrl = imageUrl.trim() || null;
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-[#004C54]">Edit Channel</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="channel-name" className="block text-sm font-medium text-gray-700 mb-1">
              Channel Name*
            </label>
            <input
              id="channel-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
              placeholder="Enter channel name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="channel-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
              placeholder="Enter channel description"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="channel-image" className="block text-sm font-medium text-gray-700 mb-1">
              Channel Image URL
            </label>
            <div className="flex">
              <input
                id="channel-image"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
                placeholder="Enter image URL"
              />
              {imageUrl && (
                <div className="relative w-10 h-10 border border-l-0 border-gray-300 rounded-r-md overflow-hidden flex items-center justify-center bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt="Channel image preview"
                    fill
                    sizes="40px"
                    className="object-cover"
                    onError={() => setImageUrl('')}
                  />
                </div>
              )}
              {!imageUrl && (
                <div className="w-10 h-10 border border-l-0 border-gray-300 rounded-r-md flex items-center justify-center bg-gray-100">
                  <FaImage className="text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Provide a URL to an image for your channel (optional)
            </p>
          </div>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Channel Privacy
            </span>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="privacy"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mr-2"
                />
                <FaGlobe className="mr-2 text-gray-600" />
                <span>Public</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="privacy"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mr-2"
                />
                <FaLock className="mr-2 text-gray-600" />
                <span>Private</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isPublic 
                ? 'Public channels can be discovered and joined by anyone' 
                : 'Private channels require an invite code to join'}
            </p>
          </div>
        </form>
        
        <div className="p-4 border-t">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditChannelModal; 