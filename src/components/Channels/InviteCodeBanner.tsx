'use client';
import { useState } from 'react';
import { FaKey, FaCheck, FaTimes } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';

interface InviteCodeBannerProps {
  channel: Channel;
  onJoin: (updatedChannel: Channel) => void;
}

const InviteCodeBanner: React.FC<InviteCodeBannerProps> = ({ channel, onJoin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Check if user is invited but not a member
  const isInvited = user && channel.invitedUsers?.includes(user.email || '') && !channel.members.includes(user.uid);

  if (!isInvited) return null;

  const handleJoin = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      // Add user to members
      await updateDoc(channelRef, {
        members: arrayUnion(user.uid)
      });
      
      // Update local state
      const updatedChannel = {
        ...channel,
        members: [...channel.members, user.uid]
      };
      
      onJoin(updatedChannel);
    } catch (error) {
      console.error('Error joining channel:', error);
      setError('Failed to join channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      // Remove user from invited users
      const updatedInvitedUsers = channel.invitedUsers?.filter(email => email !== user.email) || [];
      
      await updateDoc(channelRef, {
        invitedUsers: updatedInvitedUsers
      });
      
      // Update local state
      const updatedChannel = {
        ...channel,
        invitedUsers: updatedInvitedUsers
      };
      
      onJoin(updatedChannel);
    } catch (error) {
      console.error('Error declining invitation:', error);
      setError('Failed to decline invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-md">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <FaKey className="text-blue-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">Channel Invitation</h3>
          <div className="mt-1 text-sm text-blue-700">
            You&apos;ve been invited to join <strong>{channel.name}</strong>
          </div>
          
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : (
                <>
                  <FaCheck className="mr-1" />
                  Accept
                </>
              )}
            </button>
            <button
              onClick={handleDecline}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <FaTimes className="mr-1" />
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteCodeBanner; 