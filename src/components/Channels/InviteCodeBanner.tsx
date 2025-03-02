'use client';
import { useState } from 'react';
import { FaKey, FaCheck, FaTimes, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '../../layouts/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface InviteCodeBannerProps {
  channel: Channel;
  onJoin: (updatedChannel: Channel) => void;
}

const InviteCodeBanner: React.FC<InviteCodeBannerProps> = ({ channel, onJoin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Check if user is invited but not a member
  const isInvited = user && channel.invitedUsers?.includes(user.email || '') && !channel.members.includes(user.uid);

  if (!isInvited || !isVisible) return null;

  const handleJoin = async () => {
    if (!user) {
      showToast('You must be logged in to join a channel', 'error');
      return;
    }
    
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
      showToast(`You've joined ${channel.name}!`, 'success');
      setIsVisible(false);
    } catch (error) {
      console.error('Error joining channel:', error);
      setError('Failed to join channel. Please try again.');
      showToast('Failed to join channel', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!user) {
      showToast('You must be logged in to decline an invitation', 'error');
      return;
    }
    
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
      showToast('Invitation declined', 'info');
      setIsVisible(false);
    } catch (error) {
      console.error('Error declining invitation:', error);
      setError('Failed to decline invitation. Please try again.');
      showToast('Failed to decline invitation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 mb-4 rounded-md shadow-sm"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <motion.div
              initial={{ rotate: -20 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FaKey className="text-blue-500 text-lg" />
            </motion.div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Channel Invitation</h3>
            <div className="mt-1 text-sm text-blue-700">
              You&apos;ve been invited to join <strong className="font-semibold">{channel.name}</strong>
              {channel.description && (
                <p className="mt-1 text-xs text-blue-600 italic">
                  &quot;{channel.description}&quot;
                </p>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Use invite code &quot;{channel.inviteCode}&quot; to invite others
            </p>
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center"
                >
                  <FaExclamationCircle className="mr-1" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-3 flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJoin}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Joining...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-1" />
                    Accept
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDecline}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaTimes className="mr-1" />
                    Decline
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InviteCodeBanner; 