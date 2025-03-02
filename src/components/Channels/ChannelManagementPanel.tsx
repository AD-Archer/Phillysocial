'use client';
import { useState, useEffect } from 'react';
import { FaUsers, FaCog, FaLock, FaGlobe, FaTrash, FaEdit, FaUserShield, FaRandom, FaCalendarAlt, FaTimes, FaExclamationTriangle, FaSpinner, FaClipboard, FaCheck } from 'react-icons/fa';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import ManageChannelMembersModal from '../../models/ManageChannelMembersModal';
import EditChannelModal from '../../models/EditChannelModal';
import { doc, updateDoc, deleteDoc, } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useToast } from '../../layouts/Toast';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ChannelManagementPanelProps {
  channel: Channel;
  onUpdate: (updatedChannel: Channel) => void;
  onClose?: () => void;
}

const ChannelManagementPanel: React.FC<ChannelManagementPanelProps> = ({
  channel,
  onUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [inviteCodeExpiry, setInviteCodeExpiry] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (channel.inviteCodeExpiry) {
      const expiryDate = new Date(channel.inviteCodeExpiry);
      setInviteCodeExpiry(expiryDate.toISOString().split('T')[0]);
    }
  }, [channel]);

  const isUserAdmin = () => {
    if (!user) return false;
    return channel.admins?.includes(user.uid) || channel.createdBy === user.uid || false;
  };

  const handleTogglePrivacy = async () => {
    if (!isUserAdmin()) {
      showToast('Only admins can change channel privacy settings', 'error');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      // If making private, generate an invite code
      const updates: { isPublic: boolean; inviteCode?: string } = {
        isPublic: !channel.isPublic
      };
      
      // If switching to private, generate an invite code if one doesn't exist
      if (!channel.isPublic === false && !channel.inviteCode) {
        const inviteCode = generateRandomInviteCode();
        updates.inviteCode = inviteCode;
      }
      
      await updateDoc(channelRef, updates);
      
      // Update local state
      const updatedChannel = {
        ...channel,
        ...updates
      };
      
      onUpdate(updatedChannel);
      showToast(`Channel is now ${updatedChannel.isPublic ? 'public' : 'private'}`, 'success');
    } catch (error) {
      console.error('Error updating channel privacy:', error);
      showToast('Failed to update channel privacy', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const generateRandomInviteCode = () => {
    // Generate a random 10-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateNewInviteCode = async () => {
    if (!isUserAdmin()) {
      showToast('Only admins can generate invite codes', 'error');
      return;
    }
    
    setIsGeneratingCode(true);
    
    try {
      const newInviteCode = generateRandomInviteCode();
      const channelRef = doc(db, 'channels', channel.id);
      
      const updates: { inviteCode: string; inviteCodeExpiry: Date | undefined } = {
        inviteCode: newInviteCode,
        inviteCodeExpiry: inviteCodeExpiry ? new Date(inviteCodeExpiry) : undefined
      };
      
      await updateDoc(channelRef, updates);
      
      // Update local state
      const updatedChannel = {
        ...channel,
        ...updates
      };
      
      onUpdate(updatedChannel);
      showToast('New invite code generated successfully', 'success');
    } catch (error) {
      console.error('Error generating new invite code:', error);
      showToast('Failed to generate new invite code', 'error');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleUpdateInviteCodeExpiry = async () => {
    if (!isUserAdmin()) {
      showToast('Only admins can update invite code expiry', 'error');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      const updates: { inviteCodeExpiry: Date | undefined } = {
        inviteCodeExpiry: inviteCodeExpiry ? new Date(inviteCodeExpiry) : undefined
      };
      
      await updateDoc(channelRef, updates);
      
      // Update local state
      const updatedChannel = {
        ...channel,
        ...updates
      };
      
      onUpdate(updatedChannel);
      showToast('Invite code expiry updated', 'success');
    } catch (error) {
      console.error('Error updating invite code expiry:', error);
      showToast('Failed to update invite code expiry', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!isUserAdmin()) {
      showToast('Only admins can delete channels', 'error');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Permanently delete the channel
      const channelRef = doc(db, 'channels', channel.id);
      await deleteDoc(channelRef);
      
      showToast('Channel permanently deleted', 'success');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting channel:', error);
      showToast('Failed to delete channel', 'error');
      setIsDeleting(false);
    }
  };

  const copyInviteCode = () => {
    if (!channel.inviteCode) return;
    
    navigator.clipboard.writeText(channel.inviteCode)
      .then(() => {
        setCodeCopied(true);
        showToast('Invite code copied to clipboard!', 'success');
        setTimeout(() => setCodeCopied(false), 2000);
      })
      .catch(() => {
        showToast('Failed to copy invite code', 'error');
      });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#004C54]">Channel Management</h2>
        {onClose && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close panel"
          >
            <FaTimes />
          </motion.button>
        )}
      </div>
      
      <div className="flex border-b mb-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setActiveTab('members')}
          className={`flex items-center px-4 py-2 ${
            activeTab === 'members' 
              ? 'border-b-2 border-[#004C54] text-[#004C54]' 
              : 'text-gray-500 hover:text-gray-700'
          } transition-colors`}
        >
          <FaUsers className="mr-2" />
          Members
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setActiveTab('settings')}
          className={`flex items-center px-4 py-2 ${
            activeTab === 'settings' 
              ? 'border-b-2 border-[#004C54] text-[#004C54]' 
              : 'text-gray-500 hover:text-gray-700'
          } transition-colors`}
        >
          <FaCog className="mr-2" />
          Settings
        </motion.button>
      </div>
      
      <AnimatePresence mode="wait">
        {activeTab === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Member Management</h3>
              <p className="text-sm text-gray-600 mb-3">
                View and manage channel members, assign admin roles, or moderate users.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowMembersModal(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors shadow-sm"
              >
                <FaUserShield className="mr-2" />
                {isUserAdmin() ? 'Manage Members' : 'View Members'}
              </motion.button>
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Channel Stats</h3>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-md shadow-sm"
              >
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-gray-600">Total Members:</span>
                  <span className="text-sm font-medium">{channel.members.length}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-gray-600">Admins:</span>
                  <span className="text-sm font-medium">{channel.admins?.length || 1}</span>
                </div>
                {channel.invitedUsers && (
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-gray-600">Invited Users:</span>
                    <span className="text-sm font-medium">{channel.invitedUsers.length}</span>
                  </div>
                )}
                {channel.bannedUsers && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Banned Users:</span>
                    <span className="text-sm font-medium">{channel.bannedUsers.length}</span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Channel Information</h3>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowEditModal(true)}
                disabled={!isUserAdmin()}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-md shadow-sm mb-3 ${
                  isUserAdmin() 
                    ? 'bg-[#004C54] text-white hover:bg-[#003940]' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                } transition-colors`}
              >
                <FaEdit className="mr-2" />
                Edit Channel Details
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTogglePrivacy}
                disabled={!isUserAdmin() || isUpdating}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-md shadow-sm ${
                  isUserAdmin() 
                    ? 'bg-[#046A38] text-white hover:bg-[#035C2F]' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                } transition-colors`}
              >
                {isUpdating ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    {channel.isPublic ? <FaLock className="mr-2" /> : <FaGlobe className="mr-2" />}
                    {channel.isPublic ? 'Make Channel Private' : 'Make Channel Public'}
                  </>
                )}
              </motion.button>
            </div>
            
            {!channel.isPublic && (
              <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">Invite Code</h3>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Current Code:</span>
                    <div className="flex items-center">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {channel.inviteCode}
                      </code>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={copyInviteCode}
                        className="ml-2 text-gray-500 hover:text-gray-700 p-1"
                        title="Copy to clipboard"
                      >
                        {codeCopied ? <FaCheck className="text-green-500" /> : <FaClipboard />}
                      </motion.button>
                    </div>
                  </div>
                  
                  {channel.inviteCodeExpiry && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium">
                        {new Date(channel.inviteCodeExpiry).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateNewInviteCode}
                    disabled={!isUserAdmin() || isGeneratingCode}
                    className={`flex items-center justify-center px-4 py-2 rounded-md shadow-sm ${
                      isUserAdmin() 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } transition-colors`}
                  >
                    {isGeneratingCode ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaRandom className="mr-2" />
                        Generate New Invite Code
                      </>
                    )}
                  </motion.button>
                  
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label htmlFor="inviteCodeExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                        Set Expiry Date
                      </label>
                      <div className="flex">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaCalendarAlt className="text-gray-400" />
                          </div>
                          <input
                            type="date"
                            id="inviteCodeExpiry"
                            value={inviteCodeExpiry}
                            onChange={(e) => setInviteCodeExpiry(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#004C54] focus:border-[#004C54] sm:text-sm"
                            disabled={!isUserAdmin()}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleUpdateInviteCodeExpiry}
                          disabled={!isUserAdmin() || isUpdating}
                          className={`ml-2 px-3 py-2 rounded-md ${
                            isUserAdmin() 
                              ? 'bg-[#004C54] text-white hover:bg-[#003940]' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          } transition-colors`}
                        >
                          {isUpdating ? <FaSpinner className="animate-spin" /> : 'Update'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 border-t pt-4">
              <h3 className="text-md font-medium text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-3">
                Permanently delete this channel and all its content. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={!isUserAdmin()}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-md ${
                    isUserAdmin() 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } transition-colors shadow-sm`}
                >
                  <FaTrash className="mr-2" />
                  Delete Channel
                </motion.button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-start mb-3">
                    <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600">
                      Are you sure you want to delete this channel? This action cannot be undone and all channel data will be permanently lost.
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteChannel}
                      disabled={isDeleting}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
                    >
                      {isDeleting ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash className="mr-2" />
                          Yes, Delete
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modals */}
      <AnimatePresence>
        {showMembersModal && (
          <ManageChannelMembersModal
            channel={channel}
            onClose={() => setShowMembersModal(false)}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showEditModal && (
          <EditChannelModal
            channel={channel}
            onClose={() => setShowEditModal(false)}
            onUpdate={(updatedChannel) => {
              onUpdate(updatedChannel);
              setShowEditModal(false);
              showToast('Channel updated successfully', 'success');
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChannelManagementPanel; 