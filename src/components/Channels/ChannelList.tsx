'use client';
import { useState, useEffect } from 'react';
import { FaPlus, FaHashtag, FaExclamationTriangle, FaLock, FaKey, FaSpinner, FaSearch } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { collection, doc, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '../../layouts/Toast';
import CreateChannelModal from '../../models/CreateChannelModal';
import JoinChannelModal from '../../models/JoinChannelModal';
import { motion, AnimatePresence } from 'framer-motion';

interface ChannelListProps {
  onSelectChannel: (channelId: string) => void;
  selectedChannelId: string | null;
}

const ChannelList: React.FC<ChannelListProps> = ({ onSelectChannel, selectedChannelId }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  // Set up real-time listener for channels
  useEffect(() => {
    if (!user) {
      setChannels([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const channelsRef = collection(db, 'channels');
      
      // Query for channels that are either public or the user is a member of
      const q = query(
        channelsRef,
        where('deleted', '==', false),
        orderBy('name')
      );
      
      // Use an async IIFE to handle the await
      (async () => {
        try {
          const querySnapshot = await getDocs(q);
          
          const channelsData: Channel[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Filter channels: include if public or user is a member
            const isPublic = data.isPublic;
            const isMember = data.members?.includes(user.uid);
            const isInvited = data.invitedUsers?.includes(user.email);
            
            if (isPublic || isMember || isInvited) {
              channelsData.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                isPublic: data.isPublic,
                createdBy: data.createdBy,
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
                members: data.members || [],
                admins: data.admins || [],
                bannedUsers: data.bannedUsers || [],
                mutedUsers: data.mutedUsers || [],
                invitedUsers: data.invitedUsers || [],
                inviteCode: data.inviteCode,
                imageUrl: data.imageUrl || null,
              });
            }
          });
          
          setChannels(channelsData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching channels:', error);
          setError('Failed to load channels');
          setIsLoading(false);
        }
      })();
      
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const channelsData: Channel[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Filter channels: include if public or user is a member
            const isPublic = data.isPublic;
            const isMember = data.members?.includes(user.uid);
            const isInvited = data.invitedUsers?.includes(user.email);
            
            if (isPublic || isMember || isInvited) {
              channelsData.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                isPublic: data.isPublic,
                createdBy: data.createdBy,
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
                members: data.members || [],
                admins: data.admins || [],
                bannedUsers: data.bannedUsers || [],
                mutedUsers: data.mutedUsers || [],
                invitedUsers: data.invitedUsers || [],
                inviteCode: data.inviteCode,
                imageUrl: data.imageUrl || null,
              });
            }
          });
          
          setChannels(channelsData);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching channels:', err);
          setError('Failed to load channels');
          setIsLoading(false);
        }
      );
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up channels listener:', error);
      setError('Failed to set up real-time updates for channels');
      setIsLoading(false);
    }
  }, [user]);

  // Set up real-time listener for selected channel
  useEffect(() => {
    if (!selectedChannelId || !user) return;
    
    try {
      const channelRef = doc(db, 'channels', selectedChannelId);
      
      const unsubscribe = onSnapshot(
        channelRef,
        (doc) => {
          if (doc.exists()) {
            // We don't need to update the channels list here as the main channels listener will handle it
            // This was causing a type error with the Channel interface
          } else {
            // Channel doesn't exist anymore, we can remove it from our local state
            // But the main channels listener should handle this as well
          }
        },
        (error) => {
          console.error('Error fetching selected channel:', error);
        }
      );
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up selected channel listener:', error);
    }
  }, [selectedChannelId, user]);

  const handleChannelCreated = (newChannel: Channel) => {
    // The real-time listener will update the channels list
    // But we can select the new channel immediately
    onSelectChannel(newChannel.id);
    setShowCreateModal(false);
    showToast(`Channel "${newChannel.name}" created successfully`, 'success');
  };

  // Filter channels based on search term
  const filteredChannels = channels.filter(channel => {
    if (!searchTerm.trim()) return true;
    
    const query = searchTerm.toLowerCase().trim();
    return (
      channel.name.toLowerCase().includes(query) || 
      (channel.description && channel.description.toLowerCase().includes(query))
    );
  });

  // Sort channels: user's channels first, then public channels
  const sortedChannels = [...filteredChannels].sort((a, b) => {
    const userInA = a.members.includes(user?.uid || '');
    const userInB = b.members.includes(user?.uid || '');
    
    if (userInA && !userInB) return -1;
    if (!userInA && userInB) return 1;
    return a.name.localeCompare(b.name);
  });

  // Clear search when user selects a channel
  useEffect(() => {
    if (selectedChannelId) {
      setSearchTerm('');
    }
  }, [selectedChannelId]);

  return (
    <div className="flex flex-col h-full">
      {/* Search and Action Buttons */}
      <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-[#004C54] focus:border-[#004C54] transition-colors"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors text-sm"
          >
            <FaPlus className="mr-1" />
            Create
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex-1 flex items-center justify-center px-3 py-2 border border-[#004C54] text-[#004C54] rounded-md hover:bg-[#e6f0f0] transition-colors text-sm"
          >
            <FaKey className="mr-1" />
            Join
          </button>
        </div>
      </div>
      
      {/* Channel List */}
      <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <FaSpinner className="animate-spin text-[#004C54]" size={24} />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <FaExclamationTriangle className="mx-auto mb-2" size={24} />
            <p>{error}</p>
          </div>
        ) : sortedChannels.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? (
              <p>No channels found matching &quot;{searchTerm}&quot;</p>
            ) : (
              <p>No channels available. Create or join one to get started!</p>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <motion.div 
              className="divide-y divide-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {sortedChannels.map((channel, index) => {
                const isSelected = selectedChannelId === channel.id;
                const isMember = channel.members.includes(user?.uid || '');
                
                return (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-[#004C54]/10 border-l-4 border-[#004C54]' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => onSelectChannel(channel.id)}
                  >
                    <div className="flex items-center">
                      {channel.imageUrl ? (
                        <div className="relative w-8 h-8 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          <Image 
                            src={channel.imageUrl} 
                            alt={channel.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center mr-3 flex-shrink-0 text-gray-500">
                          {channel.isPublic ? <FaHashtag size={14} /> : <FaLock size={14} />}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className={`font-medium truncate ${isSelected ? 'text-[#004C54]' : 'text-gray-700'}`}>
                            {channel.name}
                          </h3>
                          {!channel.isPublic && (
                            <FaLock className="ml-1.5 text-gray-400" size={10} />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {isMember ? (
                            `${channel.members.length} ${channel.members.length === 1 ? 'member' : 'members'}`
                          ) : (
                            channel.isPublic ? 'Public channel' : 'Private channel'
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      
      {/* Create Channel Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateChannelModal
            onClose={() => setShowCreateModal(false)}
            onChannelCreated={handleChannelCreated}
          />
        )}
      </AnimatePresence>
      
      {/* Join Channel Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <JoinChannelModal
            onClose={() => setShowJoinModal(false)}
            onChannelJoined={(channel) => {
              // Convert the callback to match the expected signature
              onSelectChannel(channel.id);
              setShowJoinModal(false);
              showToast(`Joined channel "${channel.name}" successfully`, 'success');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChannelList; 