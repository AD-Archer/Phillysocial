'use client';
import { useState } from 'react';
import { FaLock, FaHashtag, FaKey, FaCopy, FaCog, FaEdit, FaUserFriends, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '../../layouts/Toast';
import EditChannelModal from '../../models/EditChannelModal';

interface ChannelHeaderProps {
  channel: Channel | null;
  onShowMembers?: () => void;
  onUpdate?: (updatedChannel: Channel) => void;
  onShowManagement?: () => void;
  onDeleteChannel?: () => void;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ 
  channel, 
  onShowMembers,
  onUpdate,
  onShowManagement,
  onDeleteChannel
}) => {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  if (!channel) return null;

  // Function to check if the current user is an admin
  const isUserAdmin = () => {
    if (!user) return false;
    return channel.admins?.includes(user.uid) || false;
  };

  const handleChannelUpdate = (updatedChannel: Channel) => {
    if (onUpdate) {
      onUpdate(updatedChannel);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {channel.imageUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
              <Image 
                src={channel.imageUrl} 
                alt={channel.name} 
                width={40} 
                height={40} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#004C54] text-white flex items-center justify-center mr-3 flex-shrink-0">
              {channel.isPublic ? (
                <FaHashtag size={18} />
              ) : (
                <FaLock size={18} />
              )}
            </div>
          )}
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              {channel.name}
              {!channel.isPublic && (
                <FaLock className="ml-2 text-gray-500" size={14} />
              )}
            </h2>
            {channel.description && (
              <p className="text-sm text-gray-600 line-clamp-1">{channel.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Show members button */}
          {onShowMembers && (
            <button
              onClick={onShowMembers}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              title="View Members"
              aria-label="View Members"
            >
              <FaUserFriends size={16} />
            </button>
          )}
          
          {/* Show invite code button for admins */}
          {!channel.isPublic && isUserAdmin() && !showInviteCode && (
            <button
              onClick={() => setShowInviteCode(true)}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              title="Show Invite Code"
              aria-label="Show Invite Code"
            >
              <FaKey size={16} />
            </button>
          )}
          
          {/* Edit channel button for admins */}
          {isUserAdmin() && (
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              title="Edit Channel"
              aria-label="Edit Channel"
            >
              <FaEdit size={16} />
            </button>
          )}
          
          {/* Channel management button for admins */}
          {isUserAdmin() && onShowManagement && (
            <button
              onClick={onShowManagement}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              title="Channel Management"
              aria-label="Channel Management"
            >
              <FaCog size={16} />
            </button>
          )}
          
          {/* Delete Channel button for admins */}
          {isUserAdmin() && onDeleteChannel && (
            <button
              onClick={onDeleteChannel}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Delete Channel"
              aria-label="Delete Channel"
            >
              <FaTrash size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* Invite code section */}
      {!channel.isPublic && showInviteCode && isUserAdmin() && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
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
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1">
              {channel.inviteCode}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(channel.inviteCode || '');
                showToast('Invite code copied to clipboard!', 'success');
              }}
              className="ml-2 text-gray-500 hover:text-gray-700"
              title="Copy to clipboard"
            >
              <FaCopy size={14} />
            </button>
          </div>
          
          <p className="mt-2 text-xs text-gray-500">
            Share this code with people you want to invite to this channel
          </p>
        </div>
      )}
      
      {/* Edit channel modal */}
      {showEditModal && (
        <EditChannelModal
          channel={channel}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleChannelUpdate}
        />
      )}
    </div>
  );
}

export default ChannelHeader; 