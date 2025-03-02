'use client';
import { useState, useEffect } from 'react';
import { FaPlus, FaHashtag, FaExclamationTriangle, FaLock, FaKey, FaCopy, FaSearch } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { collection, doc, onSnapshot, query, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '../../layouts/Toast';
import CreateChannelModal from '../../models/CreateChannelModal';
import JoinChannelModal from '../../models/JoinChannelModal';

interface UserDetails {
  displayName: string;
  fullName?: string;
  email: string;
  photoURL?: string;
  status: 'online' | 'offline' | 'away' | 'deleted';
  lastActive?: Date;
  role: 'member' | 'admin' | 'creator';
}

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
  const [searchQuery, setSearchQuery] = useState('');
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
        async (snapshot) => {
          try {
            const fetchedChannels: Channel[] = [];
            const seenIds = new Set<string>();
            
            // Create a map to store user data
            const userDataMap = new Map<string, UserDetails>();
            
            // First pass: collect all unique user IDs
            const allUserIds = new Set<string>();
            snapshot.forEach(doc => {
              const data = doc.data();
              if (data.members) {
                data.members.forEach((memberId: string) => allUserIds.add(memberId));
              }
              if (data.createdBy) {
                allUserIds.add(data.createdBy);
              }
              if (data.admins) {
                data.admins.forEach((adminId: string) => allUserIds.add(adminId));
              }
            });

            // Fetch all user data in parallel
            await Promise.all(
              Array.from(allUserIds).map(async (userId) => {
                try {
                  const userDoc = await getDoc(doc(db, 'users', userId));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Only mark as deleted if explicitly set in the database
                    const isDeleted = userData.status === 'deleted' || userData.deleted === true;
                    
                    userDataMap.set(userId, {
                      displayName: isDeleted ? 'Deleted Account' : (userData.displayName || userData.email?.split('@')[0] || 'Anonymous User'),
                      fullName: isDeleted ? undefined : userData.fullName,
                      email: isDeleted ? 'deleted@account' : (userData.email || 'No email'),
                      photoURL: isDeleted ? undefined : userData.photoURL,
                      status: isDeleted ? 'deleted' : (userData.status as UserDetails['status'] || 'offline'),
                      lastActive: isDeleted ? undefined : userData.lastActive?.toDate(),
                      role: 'member'
                    });
                  } else {
                    // Only mark as deleted if the document doesn't exist
                    userDataMap.set(userId, {
                      displayName: 'Deleted Account',
                      email: 'deleted@account',
                      status: 'deleted',
                      role: 'member'
                    });
                  }
                } catch (error) {
                  console.error(`Error fetching user ${userId}:`, error);
                  // Set a temporary user object on error
                  userDataMap.set(userId, {
                    displayName: 'Unknown User',
                    email: 'unknown@user',
                    status: 'offline',
                    role: 'member'
                  });
                }
              })
            );
            
            // Second pass: process channels with complete user data
            snapshot.forEach(doc => {
              if (seenIds.has(doc.id)) {
                console.warn(`Duplicate channel ID found: ${doc.id}`);
                return;
              }
              
              const data = doc.data();
              if (!data.name || !data.createdBy) {
                console.warn(`Invalid channel data found for ID: ${doc.id}`);
                return;
              }

              // Create memberDetails object with complete user data
              const memberDetails: { [key: string]: UserDetails } = {};
              (data.members || []).forEach((memberId: string) => {
                const userData = userDataMap.get(memberId);
                if (userData) {
                  memberDetails[memberId] = {
                    ...userData,
                    role: data.createdBy === memberId ? 'creator' :
                          (data.admins || []).includes(memberId) ? 'admin' : 'member'
                  };
                }
              });

              const channel = {
                id: doc.id,
                name: data.name,
                description: data.description || '',
                createdBy: data.createdBy,
                createdAt: data.createdAt?.toDate() || new Date(),
                members: data.members || [],
                admins: data.admins || [data.createdBy],
                isPublic: data.isPublic !== undefined ? data.isPublic : true,
                imageUrl: data.imageUrl,
                invitedUsers: data.invitedUsers || [],
                inviteCode: data.inviteCode,
                bannedUsers: data.bannedUsers || [],
                mutedUsers: data.mutedUsers || [],
                deleted: data.deleted,
                memberDetails
              };

              if (channel.deleted) return;
              if (channel.bannedUsers?.includes(user.uid)) return;
              
              if (
                channel.isPublic || 
                channel.members.includes(user.uid) || 
                (channel.invitedUsers && channel.invitedUsers.includes(user.email))
              ) {
                seenIds.add(doc.id);
                fetchedChannels.push(channel);
              }
            });
            
            const sortedChannels = fetchedChannels.sort((a, b) => {
              const userInA = a.members.includes(user.uid);
              const userInB = b.members.includes(user.uid);
              if (userInA !== userInB) return userInB ? 1 : -1;
              return a.name.localeCompare(b.name);
            });
            
            setChannels(sortedChannels);
            setIsLoading(false);
          } catch (error) {
            console.error('Error processing channels:', error);
            setError('Failed to process channel information');
            setIsLoading(false);
          }
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

  // Filter channels based on search query
  const filteredChannels = channels.filter(channel => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    return (
      channel.name.toLowerCase().includes(query) || 
      (channel.description && channel.description.toLowerCase().includes(query))
    );
  });

  // Clear search when user selects a channel
  useEffect(() => {
    if (selectedChannelId) {
      setSearchQuery('');
    }
  }, [selectedChannelId]);

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
      
      {/* Search input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#004C54] focus:border-[#004C54] sm:text-sm transition duration-150 ease-in-out"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <span className="text-gray-400 hover:text-gray-600 text-sm">✕</span>
          </button>
        )}
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
          {filteredChannels.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-2">
              {channels.length === 0 
                ? "No channels available. Create your first channel!" 
                : `No channels matching "${searchQuery}"`}
            </p>
          ) : (
            filteredChannels.map((channel, index) => (
              <li key={`channel-${channel.id}-${index}`}>
                <button
                  onClick={() => {
                    onSelectChannel(channel.id);
                    setSelectedChannel(channel);
                  }}
                  className={`w-full flex items-center p-3 rounded-md transition-colors ${
                    selectedChannelId === channel.id 
                      ? 'bg-[#e6f0f0] text-[#004C54]' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex-shrink-0 mr-3">
                    {channel.imageUrl ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image 
                          src={channel.imageUrl} 
                          alt={`${channel.name} icon`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        {channel.isPublic ? (
                          <FaHashtag className="text-gray-500" size={24} />
                        ) : (
                          <FaLock className="text-gray-500" size={24} />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium truncate">
                        {channel.name}
                      </h3>
                      {!channel.isPublic && (
                        <FaLock className="ml-2 text-gray-400" size={12} />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 truncate">
                      {channel.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center mt-2 space-x-2">
                      <div className="flex -space-x-2">
                        {channel.members.slice(0, 3).map((memberId, index) => {
                          const memberDetails = channel.memberDetails?.[memberId];
                          if (!memberDetails || memberDetails.status === 'deleted') return null;
                          
                          return (
                            <div 
                              key={`${memberId}-${index}`}
                              className="relative w-6 h-6 rounded-full border-2 border-white overflow-hidden"
                              style={{ zIndex: 3 - index }}
                              title={memberDetails.fullName || memberDetails.displayName || 'Unknown User'}
                            >
                              {memberDetails.photoURL ? (
                                <Image
                                  src={memberDetails.photoURL}
                                  alt={memberDetails.fullName || memberDetails.displayName}
                                  fill
                                  sizes="24px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium">
                                  {(memberDetails.displayName?.[0] || '?').toUpperCase()}
                                </div>
                              )}
                              {memberDetails.status === 'online' && (
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                              )}
                            </div>
                          );
                        })}
                        {channel.members.filter(id => {
                          const details = channel.memberDetails?.[id];
                          return details && details.status !== 'deleted';
                        }).length > 3 && (
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500"
                            title={`${channel.members.length - 3} more members`}
                          >
                            +{channel.members.length - 3}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>
                          {channel.members.filter(id => {
                            const details = channel.memberDetails?.[id];
                            return details && details.status !== 'deleted';
                          }).length} {channel.members.length === 1 ? 'member' : 'members'}
                        </span>
                        <span>•</span>
                        <span>
                          {channel.members.filter(id => channel.memberDetails?.[id]?.status === 'online').length} online
                        </span>
                      </div>
                      
                      {isUserAdmin(channel) && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
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