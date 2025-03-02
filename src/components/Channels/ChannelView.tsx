'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import ChannelHeader from './ChannelHeader';
import ManageChannelMembersModal from '../../models/ManageChannelMembersModal';
import InviteCodeBanner from './InviteCodeBanner';
import ChannelManagementPanel from './ChannelManagementPanel';
import { FaUserFriends, FaExclamationTriangle } from 'react-icons/fa';
import { useToast } from '../../layouts/Toast';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
          isPublic: data.isPublic,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          members: data.members || [],
          admins: data.admins || [],
          bannedUsers: data.bannedUsers || [],
          mutedUsers: data.mutedUsers || [],
          invitedUsers: data.invitedUsers || [],
          inviteCode: data.inviteCode,
          imageUrl: data.imageUrl || null,
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

  // Function to check if the current user is a member
  const isUserMember = () => {
    if (!user || !channel) return false;
    return channel.members.includes(user.uid);
  };
  
  // Function to check if the current user is an admin
  const isUserAdmin = () => {
    if (!user || !channel) return false;
    return channel.admins?.includes(user.uid) || false;
  };
  
  // Function to handle channel updates
  const handleChannelUpdate = (updatedChannel: Channel) => {
    setChannel(updatedChannel);
  };
  
  // Function to handle auto-joining a public channel
  const handleAutoJoin = async () => {
    if (!user || !channel) return;
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
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
  
  // Function to handle channel deletion
  const handleDeleteChannel = async () => {
    if (!user || !channel || !isUserAdmin()) return;
    
    if (window.confirm(`Are you sure you want to delete the channel "${channel.name}"? This action cannot be undone and will permanently delete all channel data.`)) {
      try {
        await deleteDoc(doc(db, 'channels', channel.id));
        showToast('Channel deleted successfully', 'success');
        router.push('/dashboard');
      } catch (error) {
        console.error('Error deleting channel:', error);
        showToast('Failed to delete channel', 'error');
      }
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

  return (
    <div className="flex flex-col">
      <ChannelHeader 
        channel={channel} 
        onShowMembers={() => setShowMembersModal(true)}
        onUpdate={handleChannelUpdate}
        onShowManagement={() => setShowManagementPanel(!showManagementPanel)}
        onDeleteChannel={handleDeleteChannel}
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
      
      {/* Channel Actions */}
      <div className="p-4 flex flex-wrap justify-center gap-3">
        {/* Join button for non-members */}
        {!isUserMember() && channel.isPublic && (
          <button
            onClick={handleAutoJoin}
            className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] flex items-center justify-center"
          >
            <FaUserFriends className="mr-2" />
            Join Channel
          </button>
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