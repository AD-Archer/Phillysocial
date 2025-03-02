'use client';
import { useState, useEffect, FormEvent } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import ChannelHeader from './ChannelHeader';
import ManageChannelMembersModal from '../../models/ManageChannelMembersModal';
import InviteCodeBanner from './InviteCodeBanner';
import ChannelManagementPanel from './ChannelManagementPanel';
import { FaUserFriends, FaExclamationTriangle, FaBan, FaTrash, FaPaperPlane, FaCog } from 'react-icons/fa';
import Link from 'next/link';
import { useToast } from '../../layouts/Toast';

interface ChannelViewProps {
  channelId: string | null;
}

const ChannelView: React.FC<ChannelViewProps> = ({ channelId }) => {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId) {
        setChannel(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const channelDoc = await getDoc(doc(db, 'channels', channelId));
        
        if (!channelDoc.exists()) {
          setError('Channel not found');
          setChannel(null);
          return;
        }
        
        const data = channelDoc.data();
        const channelData: Channel = {
          id: channelDoc.id,
          name: data.name,
          description: data.description,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(),
          members: data.members || [],
          admins: data.admins || [data.createdBy],
          isPublic: data.isPublic,
          inviteCode: data.inviteCode,
          imageUrl: data.imageUrl,
          invitedUsers: data.invitedUsers || [],
          bannedUsers: data.bannedUsers || [],
          mutedUsers: data.mutedUsers || [],
          deleted: data.deleted,
          deletedAt: data.deletedAt?.toDate(),
          deletedBy: data.deletedBy
        };
        
        setChannel(channelData);
      } catch (error) {
        console.error('Error fetching channel:', error);
        setError('Failed to load channel');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChannel();
  }, [channelId]);

  const handleChannelUpdate = (updatedChannel: Channel) => {
    setChannel(updatedChannel);
  };

  const isUserMember = () => {
    if (!channel || !user) return false;
    return channel.members.includes(user.uid);
  };

  const isUserAdmin = () => {
    if (!channel || !user) return false;
    return channel.admins?.includes(user.uid) || false;
  };

  const isUserBanned = () => {
    if (!channel || !user) return false;
    return channel.bannedUsers?.includes(user.uid);
  };

  // Function to handle auto-joining a channel when interacting
  const handleAutoJoin = async () => {
    if (!channel || !user || isUserMember() || isUserBanned()) return;
    
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
      
      setChannel(updatedChannel);
      showToast('You have joined the channel', 'success');
    } catch (error) {
      console.error('Error joining channel:', error);
      showToast('Failed to join channel', 'error');
    }
  };

  // This function would be called when a user interacts with the channel
  const handleInteraction = () => {
    if (!isUserMember() && channel?.isPublic) {
      handleAutoJoin();
    }
  };

  // Function to handle sending a message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !channel || !user) return;
    
    // Don't allow banned or muted users to send messages
    if (isUserBanned() || channel.mutedUsers?.includes(user.uid)) {
      showToast('You cannot send messages in this channel', 'error');
      return;
    }
    
    // If user is not a member and channel is public, join the channel first
    if (!isUserMember() && channel.isPublic) {
      try {
        await handleAutoJoin();
      } catch (error) {
        console.error('Error joining channel:', error);
        showToast('Failed to join channel', 'error');
        return;
      }
    }
    
    // If user is still not a member and channel is not public, show error
    if (!isUserMember() && !channel.isPublic) {
      showToast('You need to join this channel to send messages', 'error');
      return;
    }
    
    try {
      // Here you would add the message to Firestore
      // For now, we'll just show a toast and clear the input
      showToast('Message sent successfully', 'success');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    }
  };

  if (!channelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a channel</h2>
        <p className="text-gray-500 max-w-md">
          Choose a channel from the sidebar or create a new one to get started
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FaExclamationTriangle className="text-yellow-500 mb-4" size={32} />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Error</h2>
        <p className="text-gray-500 max-w-md">{error}</p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FaExclamationTriangle className="text-yellow-500 mb-4" size={32} />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Channel not found</h2>
        <p className="text-gray-500 max-w-md">
          The channel you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it
        </p>
      </div>
    );
  }

  // Check if user has access to this channel
  if (!channel.isPublic && !isUserMember() && !channel.invitedUsers?.includes(user?.email || '')) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FaExclamationTriangle className="text-yellow-500 mb-4" size={32} />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Private Channel</h2>
        <p className="text-gray-500 max-w-md mb-4">
          This is a private channel. You need an invite code to join.
        </p>
      </div>
    );
  }

  // Check if user is banned from this channel
  if (isUserBanned()) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FaBan className="text-red-500 mb-4" size={32} />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">You've Been Banned</h2>
        <p className="text-gray-500 max-w-md mb-4">
          You have been banned from the channel "{channel.name}". 
          If you believe this is a mistake, please contact a channel administrator.
        </p>
      </div>
    );
  }

  // Check if channel has been deleted
  if (channel && channel.deleted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FaTrash className="text-red-500 mb-4" size={32} />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Channel Deleted</h2>
        <p className="text-gray-500 max-w-md mb-4">
          This channel has been deleted by an administrator.
        </p>
        <Link href="/dashboard" className="text-[#004C54] hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChannelHeader 
        channel={channel} 
        onShowMembers={() => setShowMembersModal(true)}
        onUpdate={handleChannelUpdate}
        onShowManagement={() => setShowManagementPanel(!showManagementPanel)}
      />
      
      {/* Show invitation banner if user is invited but not a member */}
      {channel && <InviteCodeBanner channel={channel} onJoin={handleChannelUpdate} />}
      
      {/* Channel Management Panel */}
      {showManagementPanel && (
        <ChannelManagementPanel
          channel={channel}
          onUpdate={handleChannelUpdate}
          onClose={() => setShowManagementPanel(false)}
        />
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Channel content will go here */}
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 mb-4">Channel content will be displayed here</p>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {!isUserMember() && channel.isPublic ? (
              <button
                onClick={handleAutoJoin}
                className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] flex items-center justify-center"
              >
                <FaUserFriends className="mr-2" />
                Join Channel
              </button>
            ) : (
              <button
                onClick={() => setShowMembersModal(true)}
                className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] flex items-center justify-center"
              >
                <FaUserFriends className="mr-2" />
                {isUserAdmin() ? 'Manage Members' : 'View Members'}
              </button>
            )}
            
            {/* Channel Management Button */}
            <button
              onClick={() => setShowManagementPanel(!showManagementPanel)}
              className="px-4 py-2 bg-[#046A38] text-white rounded-md hover:bg-[#035C2F] flex items-center justify-center"
            >
              <FaCog className="mr-2" />
              {showManagementPanel ? 'Hide Management Panel' : 'Channel Management'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isUserBanned() 
                ? "You've been banned from this channel" 
                : channel?.mutedUsers?.includes(user?.uid || '') 
                  ? "You've been muted in this channel"
                  : "Type a message..."
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
            disabled={isUserBanned() || channel?.mutedUsers?.includes(user?.uid || '')}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-r-md flex items-center justify-center ${
              isUserBanned() || channel?.mutedUsers?.includes(user?.uid || '')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#004C54] text-white hover:bg-[#003940]'
            }`}
            disabled={isUserBanned() || channel?.mutedUsers?.includes(user?.uid || '')}
          >
            <FaPaperPlane />
          </button>
        </form>
        {!isUserMember() && channel?.isPublic && (
          <p className="text-xs text-gray-500 mt-1">
            Sending a message will automatically add you to this channel
          </p>
        )}
      </div>
      
      {showMembersModal && (
        <ManageChannelMembersModal
          channel={channel}
          onClose={() => setShowMembersModal(false)}
          onUpdate={handleChannelUpdate}
        />
      )}
    </div>
  );
};

export default ChannelView; 