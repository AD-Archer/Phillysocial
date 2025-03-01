'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import ChannelHeader from './ChannelHeader';
import ManageChannelMembersModal from '../../models/ManageChannelMembersModal';
import InviteCodeBanner from './InviteCodeBanner';
import { FaUserFriends, FaExclamationTriangle } from 'react-icons/fa';

interface ChannelViewProps {
  channelId: string | null;
}

const ChannelView: React.FC<ChannelViewProps> = ({ channelId }) => {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const { user } = useAuth();

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
          invitedUsers: data.invitedUsers || []
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
    return channel.admins?.includes(user.uid);
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

  return (
    <div className="flex flex-col h-full">
      <ChannelHeader channel={channel} />
      
      {/* Show invitation banner if user is invited but not a member */}
      {channel && <InviteCodeBanner channel={channel} onJoin={handleChannelUpdate} />}
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Channel content will go here */}
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 mb-4">Channel content will be displayed here</p>
          
          <button
            onClick={() => setShowMembersModal(true)}
            className="flex items-center px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
          >
            <FaUserFriends className="mr-2" />
            {isUserAdmin() ? 'Manage Members' : 'View Members'}
          </button>
        </div>
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