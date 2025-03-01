'use client';
import { useState } from 'react';
import { FaLock, FaHashtag, FaKey, FaCopy, FaUserPlus, FaUserShield, FaCog } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '../../layouts/Toast';

interface ChannelHeaderProps {
  channel: Channel | null;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel }) => {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  if (!channel) return null;

  const isUserAdmin = channel.admins?.includes(user?.uid || '');

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
            </h2>
            <p className="text-sm text-gray-600 truncate max-w-md">
              {channel.description || 'No description provided'}
            </p>
          </div>
        </div>
        
        {isUserAdmin && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              title="Channel settings"
              aria-label="Channel settings"
            >
              <FaCog size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Invite code section for private channels */}
      {!channel.isPublic && (
        <div className="mt-4">
          {isUserAdmin && (
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
      
      {/* Admin panel */}
      {isUserAdmin && showAdminPanel && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaUserShield className="mr-2 text-[#004C54]" size={14} />
            Admin Controls
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50">
              <FaUserPlus className="mr-2" size={14} />
              Invite Members
            </button>
            <button className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50">
              <FaUserShield className="mr-2" size={14} />
              Manage Admins
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelHeader; 