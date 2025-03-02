'use client';
import { useState } from 'react';
import { FaLock, FaHashtag, FaKey, FaCopy, FaCog, FaVolumeMute, FaEdit, FaUserFriends, FaTrash, FaEllipsisH, FaExclamationTriangle } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '../../layouts/Toast';
import EditChannelModal from '../../models/EditChannelModal';
import { motion, AnimatePresence } from 'framer-motion';

interface ChannelHeaderProps {
  channel: Channel | null;
  onShowMembers?: () => void;
  onUpdate?: (updatedChannel: Channel) => void;
  onShowManagement?: () => void;
  onDeleteChannel?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ 
  channel, 
  onShowMembers,
  onUpdate,
  onShowManagement,
  onDeleteChannel,
  isLoading = false,
  error = null
}) => {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Function to check if the current user is an admin
  const isUserAdmin = () => {
    if (!user || !channel) return false;
    return channel.admins?.includes(user.uid) || channel.createdBy === user.uid || false;
  };
  
  const isUserMuted = channel?.mutedUsers?.includes(user?.uid || '') || false;

  const handleChannelUpdate = (updatedChannel: Channel) => {
    if (onUpdate) {
      onUpdate(updatedChannel);
      showToast('Channel updated successfully', 'success');
    }
    setShowEditModal(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    setShowDropdown(false);
  };

  // Add event listener for clicks outside dropdown
  useState(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  const copyInviteCode = () => {
    if (!channel?.inviteCode) return;
    
    navigator.clipboard.writeText(channel.inviteCode)
      .then(() => {
        showToast('Invite code copied to clipboard!', 'success');
      })
      .catch(() => {
        showToast('Failed to copy invite code', 'error');
      });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="animate-pulse flex items-center">
          <div className="rounded-md bg-gray-200 h-10 w-10 mr-3"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-yellow-500"
      >
        <div className="flex items-center text-yellow-700">
          <FaExclamationTriangle className="mr-2" />
          <span>{error}</span>
        </div>
      </motion.div>
    );
  }

  if (!channel) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {channel.imageUrl ? (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-12 h-12 mr-3 rounded-md overflow-hidden"
            >
              <Image 
                src={channel.imageUrl} 
                alt={`${channel.name} icon`}
                fill
                sizes="48px"
                className="object-cover"
              />
            </motion.div>
          ) : (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 mr-3 bg-gradient-to-br from-[#004C54] to-[#046A38]/80 rounded-md flex items-center justify-center text-white"
            >
              {channel.isPublic ? <FaHashtag size={22} /> : <FaLock size={22} />}
            </motion.div>
          )}
          
          <div>
            <h2 className="text-xl font-semibold text-[#004C54] flex items-center">
              {channel.name}
              {!channel.isPublic && (
                <FaLock className="ml-2 text-gray-500" size={14} />
              )}
              {isUserMuted && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 flex items-center text-yellow-500" 
                  title="You are muted in this channel"
                >
                  <FaVolumeMute size={14} />
                </motion.div>
              )}
            </h2>
            <p className="text-sm text-gray-600 truncate max-w-md">
              {channel.description || 'No description provided'}
            </p>
            <AnimatePresence>
              {isUserMuted && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-yellow-600 mt-1"
                >
                  You are muted in this channel. You can view messages but cannot post.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Desktop view: show buttons directly */}
          <div className="hidden md:flex items-center space-x-2">
            {/* View Members button - Always visible */}
            {onShowMembers && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onShowMembers}
                className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                title="View Members"
                aria-label="View Members"
              >
                <FaUserFriends size={16} />
              </motion.button>
            )}
            
            {/* Edit Channel button for admins */}
            {isUserAdmin() && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEditModal(true)}
                className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                title="Edit Channel"
                aria-label="Edit Channel"
              >
                <FaEdit size={16} />
              </motion.button>
            )}
            
            {/* Invite Code button for private channels (admin only) */}
            {isUserAdmin() && !channel.isPublic && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInviteCode(!showInviteCode)}
                className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                title={showInviteCode ? "Hide Invite Code" : "Show Invite Code"}
                aria-label={showInviteCode ? "Hide Invite Code" : "Show Invite Code"}
              >
                <FaKey size={16} />
              </motion.button>
            )}
            
            {/* Channel Management button for admins */}
            {isUserAdmin() && onShowManagement && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onShowManagement}
                className="p-2 bg-[#046A38] text-white rounded-full hover:bg-[#035C2F] transition-colors"
                title="Channel Management"
                aria-label="Channel Management"
              >
                <FaCog size={16} />
              </motion.button>
            )}
            
            {/* Delete Channel button for admins */}
            {isUserAdmin() && onDeleteChannel && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDeleteChannel}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Delete Channel"
                aria-label="Delete Channel"
              >
                <FaTrash size={16} />
              </motion.button>
            )}
          </div>
          
          {/* Mobile view: show dropdown menu */}
          <div className="md:hidden relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDropdown}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Channel options"
            >
              <FaEllipsisH size={16} />
            </motion.button>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 overflow-hidden border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onShowMembers && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowMembers();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FaUserFriends className="mr-2" size={14} />
                      View Members
                    </button>
                  )}
                  
                  {isUserAdmin() && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEditModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaEdit className="mr-2" size={14} />
                        Edit Channel
                      </button>
                      
                      {!channel.isPublic && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowInviteCode(!showInviteCode);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <FaKey className="mr-2" size={14} />
                          {showInviteCode ? "Hide Invite Code" : "Show Invite Code"}
                        </button>
                      )}
                      
                      {onShowManagement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowManagement();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <FaCog className="mr-2" size={14} />
                          Channel Management
                        </button>
                      )}
                      
                      {onDeleteChannel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChannel();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <FaTrash className="mr-2" size={14} />
                          Delete Channel
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Invite code section */}
      <AnimatePresence>
        {!channel.isPublic && showInviteCode && isUserAdmin() && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <FaKey className="mr-2 text-[#004C54]" size={14} />
                Invite Code
              </div>
              <button
                onClick={() => setShowInviteCode(false)}
                className="text-xs text-[#004C54] hover:underline"
              >
                Hide
              </button>
            </div>
            
            <div className="mt-2 flex items-center">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1 overflow-x-auto">
                {channel.inviteCode}
              </code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={copyInviteCode}
                className="ml-2 text-gray-500 hover:text-gray-700 p-1"
                title="Copy to clipboard"
              >
                <FaCopy size={14} />
              </motion.button>
            </div>
            
            <p className="mt-2 text-xs text-gray-500">
              Share this code with people you want to invite to this channel
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Member count */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-3 text-sm text-gray-600"
      >
        <span className="font-medium">{channel.members.length}</span> {channel.members.length === 1 ? 'member' : 'members'}
        {channel.invitedUsers && channel.invitedUsers.length > 0 && (
          <span className="ml-2">• <span className="font-medium">{channel.invitedUsers.length}</span> invited</span>
        )}
      </motion.div>

      {/* Edit Channel Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditChannelModal
            channel={channel}
            onClose={() => setShowEditModal(false)}
            onUpdate={handleChannelUpdate}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChannelHeader; 