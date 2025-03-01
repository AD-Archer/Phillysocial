'use client';
import { useState, useEffect } from 'react';
import { FaPlus, FaHashtag, FaExclamationTriangle } from 'react-icons/fa';
import { Channel } from '@/types/Channel';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import CreateChannelModal from './CreateChannelModal';

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

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // For now, just get all channels to avoid permission issues
        const channelsRef = collection(db, 'channels');
        const channelsSnapshot = await getDocs(channelsRef);
        
        const fetchedChannels: Channel[] = [];
        channelsSnapshot.forEach(doc => {
          const data = doc.data();
          // Make sure createdAt is properly handled
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          
          fetchedChannels.push({
            id: doc.id,
            name: data.name || 'Unnamed Channel',
            description: data.description || '',
            createdBy: data.createdBy || '',
            createdAt: createdAt,
            members: data.members || [],
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
            imageUrl: data.imageUrl
          });
        });
        
        setChannels(fetchedChannels.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Error fetching channels:', error);
        setError('Failed to load channels. Please check your permissions.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChannels();
  }, [user]);

  const handleCreateChannel = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel].sort((a, b) => a.name.localeCompare(b.name)));
    setShowCreateModal(false);
    // Automatically select the new channel
    onSelectChannel(newChannel.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#004C54]">Channels</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="p-2 bg-[#004C54] text-white rounded-full hover:bg-[#003940] transition-colors"
        >
          <FaPlus size={14} />
        </button>
      </div>
      
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
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {channels.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-2">No channels available. Create your first channel!</p>
          ) : (
            channels.map(channel => (
              <li key={channel.id}>
                <button
                  onClick={() => onSelectChannel(channel.id)}
                  className={`w-full flex items-center p-2 rounded-md transition-colors ${
                    selectedChannelId === channel.id 
                      ? 'bg-[#e6f0f0] text-[#004C54]' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FaHashtag className="mr-2 flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
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
    </div>
  );
};

export default ChannelList; 