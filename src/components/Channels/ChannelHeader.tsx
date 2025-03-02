'use client';
import { useState, useRef, useEffect } from 'react';
import { FaLock, FaHashtag, FaKey, FaCopy, FaUserPlus, FaUserShield, FaCog, FaVolumeMute, FaEllipsisV, FaEdit, FaUserFriends, FaTrash } from 'react-icons/fa';
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
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ 
  channel, 
  onShowMembers,
  onUpdate,
  onShowManagement
}) => {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!channel) return null;

  // Function to check if the current user is an admin
  const isUserAdmin = () => {
    if (!user) return false;
    return channel.admins?.includes(user.uid) || false;
  };
  
  const isUserMuted = channel.mutedUsers?.includes(user?.uid || '');

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
            <div className="relative w-10 h-10 mr-3 rounded-md overflow-hidden">
              <Image 
                src={channel.imageUrl} 
                alt={`${channel.name} icon`}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 mr-3 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
              {channel.isPublic ? <FaHashtag size={20} /> : <FaLock size={20} />}
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-semibold text-[#004C54] flex items-center">
              {channel.name}
              {!channel.isPublic && (
                <FaLock className="ml-2 text-gray-500" size={14} />
              )}
              {isUserMuted && (
                <div className="ml-2 flex items-center text-yellow-500" title="You are muted in this channel">
                  <FaVolumeMute size={14} />
                </div>
              )}
            </h2>
            <p className="text-sm text-gray-600 truncate max-w-md">
              {channel.description || 'No description provided'}
            </p>
            {isUserMuted && (
              <p className="text-xs text-yellow-600 mt-1">
                You are muted in this channel. You can view messages but cannot post.
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          {isUserAdmin() && onShowManagement && (
            <button
              onClick={onShowManagement}
              className="mr-2 p-2 bg-[#046A38] text-white rounded-full hover:bg-[#035C2F] transition-colors"
              title="Channel Management"
              aria-label="Channel Management"
            >
              <FaCog size={16} />
            </button>
          )}
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              title="Channel options"
              aria-label="Channel options"
            >
              <FaEllipsisV size={16} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                <button
                  onClick={() => {
                    onShowMembers && onShowMembers();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaUserFriends className="mr-2" size={14} />
                  {isUserAdmin() ? 'Manage Members' : 'View Members'}
                </button>
                
                {isUserAdmin() && onShowManagement && (
                  <button
                    onClick={() => {
                      onShowManagement();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FaCog className="mr-2" size={14} />
                    Channel Management
                  </button>
                )}
                
                {isUserAdmin() && (
                  <>
                    <button
                      onClick={() => {
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
                        onClick={() => {
                          setShowInviteCode(!showInviteCode);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaKey className="mr-2" size={14} />
                        {showInviteCode ? 'Hide Invite Code' : 'Show Invite Code'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Invite code section for private channels */}
      {!channel.isPublic && showInviteCode && (
        <div className="mt-4">
          {isUserAdmin() && (
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <FaKey className="mr-2 text-[#004C54]" size={14} />
                  Invite Code
                </div>
                <button
                  onClick={() => setShowInviteCode(!showInviteCode)}
                  className="text-xs text-[#004C54] hover:underline"
                >
                  {showInviteCode ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showInviteCode ? (
                <div className="mt-2 flex items-center">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {channel.inviteCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(channel.inviteCode || '');
                      showToast('Invite code copied to clipboard!', 'success');
                    }}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                    title="Copy to clipboard"
                    aria-label="Copy invite code to clipboard"
                  >
                    <FaCopy size={14} />
                  </button>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-500">
                  Click &quot;Show&quot; to view the invite code
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                Share this code with people you want to invite to this channel
              </div>
            </div>
          )}
          
          {/* Member count */}
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium">{channel.members.length}</span> {channel.members.length === 1 ? 'member' : 'members'}
            {channel.invitedUsers && channel.invitedUsers.length > 0 && (
              <span className="ml-2">• <span className="font-medium">{channel.invitedUsers.length}</span> invited</span>
            )}
          </div>
        </div>
      )}
      
      {/* Edit Channel Modal */}
      {showEditModal && (
        <EditChannelModal
          channel={channel}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleChannelUpdate}
        />
      )}
    </div>
  );
};

export default ChannelHeader; 