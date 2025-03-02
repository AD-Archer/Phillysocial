'use client';
import { useState } from 'react';
import { FaTimes, FaKey, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Channel } from '@/types/Channel';
import { useToast } from '../layouts/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface JoinChannelModalProps {
  onClose: () => void;
  onChannelJoined: (channel: Channel) => void;
}

const JoinChannelModal: React.FC<JoinChannelModalProps> = ({ onClose, onChannelJoined }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to join a channel');
      showToast('You must be logged in to join a channel', 'error');
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
      
      // Check if the channel is deleted
      if (channelData.deleted) {
        setError('This channel no longer exists.');
        setIsLoading(false);
        return;
      }
      
      // Check if invite code has expired
      if (channelData.inviteCodeExpiry) {
        const expiryDate = new Date(channelData.inviteCodeExpiry.toDate());
        const now = new Date();
        
        if (expiryDate < now) {
          setError('This invite code has expired.');
          setIsLoading(false);
          return;
        }
      }
      
      // Check if user is already a member
      if (channelData.members && channelData.members.includes(user.uid)) {
        setError('You are already a member of this channel.');
        setIsLoading(false);
        return;
      }
      
      // Check if user is banned
      if (channelData.bannedUsers && channelData.bannedUsers.includes(user.uid)) {
        setError('You cannot join this channel.');
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
        isPublic: channelData.isPublic,
        createdBy: channelData.createdBy,
        createdAt: channelData.createdAt ? channelData.createdAt.toDate() : new Date(),
        members: channelData.members || [],
        admins: channelData.admins || [],
        bannedUsers: channelData.bannedUsers || [],
        mutedUsers: channelData.mutedUsers || [],
        invitedUsers: channelData.invitedUsers || [],
        inviteCode: channelData.inviteCode,
        imageUrl: channelData.imageUrl || null,
        deleted: channelData.deleted || false
      };
      
      showToast(`Successfully joined ${channel.name}!`, 'success');
      onChannelJoined(channel);
    } catch (error: Error | unknown) {
      console.error('Error joining channel:', error);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while joining the channel');
      }
      
      showToast('Failed to join channel', 'error');
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-[#003940] to-[#046A38] text-white rounded-t-lg sticky top-0 z-10">
            <h2 className="text-lg font-semibold">Join Private Channel</h2>
            <motion.button 
              onClick={onClose} 
              className="text-white hover:text-[#A5ACAF] p-1 rounded-full hover:bg-black/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes />
            </motion.button>
          </div>
          
          <form id="joinChannelForm" onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1">
            <div className="mb-4">
              <label htmlFor="inviteCode" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <FaKey className="mr-2 text-[#004C54]" />
                Invite Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
                  placeholder="Enter the channel invite code"
                  required
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the invite code you received to join a private channel
              </p>
            </div>
            
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
          </form>
          
          <div className="flex justify-end space-x-3 p-4 border-t sticky bottom-0 bg-white">
            <motion.button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              form="joinChannelForm"
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-[#004C54] text-white rounded-md hover:bg-[#003940] disabled:bg-gray-400 transition-colors flex items-center shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                'Join Channel'
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default JoinChannelModal;
