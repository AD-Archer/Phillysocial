'use client';
import { useState, useEffect } from 'react';
import { FaPlus, FaHashtag, FaExclamationTriangle, FaLock, FaKey, FaCopy } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '../../layouts/Toast';
import CreateChannelModal from '../../models/CreateChannelModal';
import JoinChannelModal from '../../models/JoinChannelModal';

interface ChannelListProps {
  onSelectChannel: (channelId: string) => void;
  selectedChannelId: string | null;
}

const ChannelList: React.FC<ChannelListProps> = ({ onSelectChannel, selectedChannelId }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const { showToast } = useToast();

  // Set up real-time listener for channels
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const channelsRef = collection(db, 'channels');
      const q = query(channelsRef);
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedChannels: Channel[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            // Make sure createdAt is properly handled
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            
            const channel = {
              id: doc.id,
              name: data.name || 'Unnamed Channel',
              description: data.description || '',
              createdBy: data.createdBy || '',
              createdAt: createdAt,
              members: data.members || [],
              admins: data.admins || [data.createdBy],
              isPublic: data.isPublic !== undefined ? data.isPublic : true,
              imageUrl: data.imageUrl,
              invitedUsers: data.invitedUsers || [],
              inviteCode: data.inviteCode,
              bannedUsers: data.bannedUsers || [],
              mutedUsers: data.mutedUsers || [],
              deleted: data.deleted
            };
            
            // Skip deleted channels
            if (channel.deleted) return;
            
            // Skip channels where the user is banned
            if (channel.bannedUsers?.includes(user.uid)) return;
            
            // Only include channels that:
            // 1. Are public, OR
            // 2. User is a member, OR
            // 3. User is invited
            if (
              channel.isPublic || 
              channel.members.includes(user.uid) || 
              (channel.invitedUsers && channel.invitedUsers.includes(user.email))
            ) {
              fetchedChannels.push(channel);
            }
          });
          
          setChannels(fetchedChannels.sort((a, b) => a.name.localeCompare(b.name)));
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching channels:', err);
          setError('Failed to load channels. Please check your permissions.');
          setIsLoading(false);
        }
      );
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up channels listener:', error);
      setError('Failed to set up real-time updates for channels.');
      setIsLoading(false);
    }
  }, [user]);

  // Set up real-time listener for selected channel
  useEffect(() => {
    if (!selectedChannelId || !user) return;
    
    const channelRef = doc(db, 'channels', selectedChannelId);
    
    const unsubscribe = onSnapshot(
      channelRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSelectedChannel({
            id: doc.id,
            name: data.name,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: data.createdAt.toDate(),
            members: data.members || [],
            admins: data.admins || [data.createdBy],
            isPublic: data.isPublic,
            inviteCode: data.inviteCode,
            imageUrl: data.imageUrl
          });
        } else {
          setSelectedChannel(null);
        }
      },
      (error) => {
        console.error('Error fetching selected channel:', error);
      }
    );
    
    return () => unsubscribe();
  }, [selectedChannelId, user]);

  const handleCreateChannel = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel].sort((a, b) => a.name.localeCompare(b.name)));
    setShowCreateModal(false);
    // Automatically select the new channel
    onSelectChannel(newChannel.id);
    setSelectedChannel(newChannel);
  };

  const handleJoinChannel = (channel: Channel) => {
    // Add the channel to the list if it's not already there
    if (!channels.some(c => c.id === channel.id)) {
      setChannels(prev => [...prev, channel].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      // Update the existing channel in the list
      setChannels(prev => 
        prev.map(c => c.id === channel.id ? channel : c)
      );
    }
    setShowJoinModal(false);
    // Automatically select the joined channel
    onSelectChannel(channel.id);
    setSelectedChannel(channel);
  };

  const isUserAdmin = (channel: Channel) => {
    return channel.admins?.includes(user?.uid || '');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-2 mb-6">
      <div className="flex justify-between items-center mb-4 pl-0">
        <h2 className="text-lg font-semibold text-[#004C54]">Channels</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowJoinModal(true)}
            className="p-2 bg-[#046A38] text-white rounded-full hover:bg-[#035C2F] transition-colors"
            title="Join channel with invite code"
            aria-label="Join channel with invite code"
          >
            <FaKey size={14} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-[#004C54] text-white rounded-full hover:bg-[#003940] transition-colors"
            title="Create new channel"
            aria-label="Create new channel"
          >
            <FaPlus size={14} />
          </button>
        </div>
      </div>
      
      {/* Display invite code for selected channel if user is admin */}
      {selectedChannel && !selectedChannel.isPublic && isUserAdmin(selectedChannel) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">Invite Code:</div>
            <button
              onClick={() => setShowInviteCode(!showInviteCode)}
              className="text-xs text-[#004C54] hover:underline"
            >
              {showInviteCode ? 'Hide' : 'Show'}
            </button>
          </div>
          {showInviteCode ? (
            <div className="mt-1 flex items-center">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                {selectedChannel.inviteCode}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedChannel.inviteCode || '');
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
            <div className="mt-1 text-sm text-gray-500">
              Click &quot;Show&quot; to view the invite code
            </div>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#004C54]"></div>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <FaExclamationTriangle className="mx-auto text-yellow-500 mb-2" size={24} />
          <p className="text-sm text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-[#004C54] hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pl-0">
          {channels.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-2">No channels available. Create your first channel!</p>
          ) : (
            channels.map(channel => (
              <li key={channel.id}>
                <button
                  onClick={() => {
                    onSelectChannel(channel.id);
                    setSelectedChannel(channel);
                  }}
                  className={`w-full flex items-center p-2 pl-0 rounded-md transition-colors ${
                    selectedChannelId === channel.id 
                      ? 'bg-[#e6f0f0] text-[#004C54]' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {channel.isPublic ? (
                    <FaHashtag className="ml-0 mr-2 flex-shrink-0" />
                  ) : (
                    <FaLock className="ml-0 mr-2 flex-shrink-0 text-gray-500" />
                  )}
                  
                  {/* Display channel image if available */}
                  {channel.imageUrl && (
                    <div className="relative w-6 h-6 mr-2 rounded-full overflow-hidden flex-shrink-0">
                      <Image 
                        src={channel.imageUrl} 
                        alt={`${channel.name} icon`}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <span className="truncate text-left">{channel.name}</span>
                  
                  {/* Show admin badge if user is an admin */}
                  {isUserAdmin(channel) && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  
                  {/* Show "Invited" badge if user is invited but not a member */}
                  {!channel.members.includes(user?.uid || '') && 
                   channel.invitedUsers?.includes(user?.email || '') && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Invited
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      
      {showCreateModal && (
        <CreateChannelModal 
          onClose={() => setShowCreateModal(false)} 
          onChannelCreated={handleCreateChannel}
        />
      )}
      
      {showJoinModal && (
        <JoinChannelModal
          onClose={() => setShowJoinModal(false)}
          onChannelJoined={handleJoinChannel}
        />
      )}
    </div>
  );
};

export default ChannelList; 