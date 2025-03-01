'use client';
import { useState } from 'react';
import { FaTimes, FaKey } from 'react-icons/fa';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Channel } from '@/types/Channel';

interface JoinChannelModalProps {
  onClose: () => void;
  onChannelJoined: (channel: Channel) => void;
}

const JoinChannelModal: React.FC<JoinChannelModalProps> = ({ onClose, onChannelJoined }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to join a channel');
      return;
    }
    
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Query for the channel with this invite code
      const channelsRef = collection(db, 'channels');
      const q = query(channelsRef, where('inviteCode', '==', inviteCode.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Invalid invite code. Please check and try again.');
        setIsLoading(false);
        return;
      }
      
      // Get the first matching channel
      const channelDoc = querySnapshot.docs[0];
      const channelData = channelDoc.data();
      
      // Check if user is already a member
      if (channelData.members && channelData.members.includes(user.uid)) {
        setError('You are already a member of this channel.');
        setIsLoading(false);
        return;
      }
      
      // Add user to the channel members
      const channelRef = doc(db, 'channels', channelDoc.id);
      await updateDoc(channelRef, {
        members: arrayUnion(user.uid)
      });
      
      // Create channel object to return
      const channel: Channel = {
        id: channelDoc.id,
        name: channelData.name,
        description: channelData.description,
        createdBy: channelData.createdBy,
        createdAt: channelData.createdAt.toDate(),
        members: [...(channelData.members || []), user.uid],
        admins: channelData.admins || [channelData.createdBy],
        isPublic: channelData.isPublic,
        inviteCode: channelData.inviteCode,
        imageUrl: channelData.imageUrl
      };
      
      onChannelJoined(channel);
    } catch (error: Error | unknown) {
      console.error('Error joining channel:', error);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while joining the channel');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-[#004C54]">Join Private Channel</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="inviteCode" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <FaKey className="mr-2 text-[#004C54]" />
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="Enter the channel invite code"
              required
            />
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
              {isLoading ? 'Joining...' : 'Join Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinChannelModal;
