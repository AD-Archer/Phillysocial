'use client';
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Channel } from '@/types/Channel';

interface CreateChannelModalProps {
  onClose: () => void;
  onChannelCreated: (channel: Channel) => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose, onChannelCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a channel');
      return;
    }
    
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create a timestamp that works with Firestore
      const timestamp = new Date();
      
      const channelData = {
        name: name.trim(),
        description: description.trim(),
        createdBy: user.uid,
        createdAt: timestamp,
        members: [user.uid],
        isPublic
      };
      
      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'channels'), {
        ...channelData,
        createdAt: serverTimestamp() // Use serverTimestamp for Firestore
      });
      
      // Create the channel object with the new ID
      const newChannel: Channel = {
        id: docRef.id,
        ...channelData
      };
      
      onChannelCreated(newChannel);
    } catch (error: any) {
      console.error('Error creating channel:', error);
      
      // Provide a more helpful error message
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please check your Firebase rules.');
      } else {
        setError(`Failed to create channel: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-[#004C54]">Create New Channel</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Channel Name*
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="e.g., announcements"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="What's this channel about?"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-[#004C54] focus:ring-[#004C54] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Make this channel public</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Public channels can be discovered and joined by anyone.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-[#004C54] text-white rounded-md hover:bg-[#003940] disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal; 