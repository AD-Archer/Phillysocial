'use client';
import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUserShield, FaUserMinus, FaSearch, FaEllipsisV, FaTrash, FaVolumeMute, FaBan, FaVolumeUp, FaUserSlash, FaExclamationTriangle } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useToast } from '../layouts/Toast';

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  lastActive?: Date;
  status: string;
  phoneNumber?: string;
  createdAt?: Date;
  bio?: string;
  location?: string;
  socialLinks?: Record<string, string>;
  role: string;
}

interface ManageChannelMembersModalProps {
  channel: Channel;
  onClose: () => void;
  onUpdate: (updatedChannel: Channel) => void;
}

const ManageChannelMembersModal: React.FC<ManageChannelMembersModalProps> = ({ 
  channel, 
  onClose,
  onUpdate
}) => {
  const [members, setMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'admins'>('members');
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showToast } = useToast();

  const currentUserIsAdmin = channel.admins?.includes(user?.uid || '');
  
  // Function to check if a specific user is an admin
  const isUserAdmin = (userId: string) => {
    return channel.admins?.includes(userId) || false;
  };

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch complete user data for each member
        const memberUsers: User[] = await Promise.all(
          channel.members.map(async (memberId) => {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Always show complete user information
              return {
                uid: memberId,
                displayName: userData.fullName || userData.displayName || 'Unknown User',
                email: userData.email,
                photoURL: userData.photoURL,
                lastActive: userData.lastActive?.toDate() || null,
                status: userData.status || 'offline',
                phoneNumber: userData.phoneNumber,
                createdAt: userData.createdAt?.toDate(),
                bio: userData.bio,
                location: userData.location,
                socialLinks: userData.socialLinks || {},
                role: channel.admins?.includes(memberId) ? 'admin' : 
                      (channel.createdBy === memberId ? 'creator' : 'member')
              };
            }
            return {
              uid: memberId,
              displayName: 'Deleted Account',
              email: 'Account no longer exists',
              photoURL: '/default-avatar.png',
              status: 'deleted',
              role: 'deleted'
            };
          })
        );
        
        setMembers(memberUsers);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Failed to load member information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [channel.members, channel.admins, channel.createdBy]);

  const handleToggleAdmin = async (userId: string) => {
    if (!user) return;
    
    // Only admins can modify other admins
    if (!currentUserIsAdmin) return;
    
    // Cannot remove creator as admin
    if (userId === channel.createdBy && isUserAdmin(userId)) return;
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      if (isUserAdmin(userId)) {
        // Remove admin role
        await updateDoc(channelRef, {
          admins: arrayRemove(userId)
        });
        
        // Update local state
        const updatedChannel = {
          ...channel,
          admins: channel.admins.filter(id => id !== userId)
        };
        onUpdate(updatedChannel);
        showToast('Admin role removed', 'success');
      } else {
        // Add admin role
        await updateDoc(channelRef, {
          admins: arrayUnion(userId)
        });
        
        // Update local state
        const updatedChannel = {
          ...channel,
          admins: [...channel.admins, userId]
        };
        onUpdate(updatedChannel);
        showToast('Admin role added', 'success');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      setError('Failed to update admin status');
      showToast('Failed to update admin status', 'error');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!user) return;
    
    // Only admins can remove members
    if (!currentUserIsAdmin) return;
    
    // Cannot remove creator
    if (userId === channel.createdBy) return;
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      // Remove from members
      await updateDoc(channelRef, {
        members: arrayRemove(userId)
      });
      
      // If they were an admin, remove from admins too
      if (isUserAdmin(userId)) {
        await updateDoc(channelRef, {
          admins: arrayRemove(userId)
        });
      }
      
      // Update local state
      const updatedChannel = {
        ...channel,
        members: channel.members.filter(id => id !== userId),
        admins: channel.admins.filter(id => id !== userId)
      };
      onUpdate(updatedChannel);
      
      // Remove from local members list
      setMembers(members.filter(member => member.uid !== userId));
      showToast('Member removed from channel', 'success');
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
      showToast('Failed to remove member', 'error');
    }
  };

  const handleDeleteChannel = async () => {
    if (!user || !currentUserIsAdmin) return;
    
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      await updateDoc(channelRef, { 
        deleted: true,
        deletedAt: new Date(),
        deletedBy: user.uid
      });
      
      // In a real app, you might want to actually delete the document
      // or move it to an archive collection
      
      onClose();
      showToast('Channel deleted successfully', 'success');
      // Redirect or show success message
      window.location.href = '/dashboard'; // Redirect to dashboard
    } catch (error) {
      console.error('Error deleting channel:', error);
      setDeleteError('Failed to delete channel. Please try again.');
      showToast('Failed to delete channel', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleMuteUser = async (userId: string, isMuted: boolean) => {
    if (!user || !currentUserIsAdmin) return;
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      if (isMuted) {
        // Unmute user
        await updateDoc(channelRef, {
          mutedUsers: arrayRemove(userId)
        });
        showToast('User unmuted', 'success');
      } else {
        // Mute user
        await updateDoc(channelRef, {
          mutedUsers: arrayUnion(userId)
        });
        showToast('User muted', 'success');
      }
      
      // Update local state
      const updatedChannel = {
        ...channel,
        mutedUsers: isMuted 
          ? (channel.mutedUsers || []).filter(id => id !== userId)
          : [...(channel.mutedUsers || []), userId]
      };
      onUpdate(updatedChannel);
    } catch (error) {
      console.error('Error updating mute status:', error);
      setError('Failed to update mute status');
      showToast('Failed to update mute status', 'error');
    }
  };
  
  const handleBanUser = async (userId: string, isBanned: boolean) => {
    if (!user || !currentUserIsAdmin) return;
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      if (isBanned) {
        // Unban user
        await updateDoc(channelRef, {
          bannedUsers: arrayRemove(userId)
        });
        showToast('User unbanned', 'success');
      } else {
        // Ban user and remove from members
        await updateDoc(channelRef, {
          bannedUsers: arrayUnion(userId),
          members: arrayRemove(userId)
        });
        showToast('User banned', 'success');
      }
      
      // Update local state
      const updatedChannel = {
        ...channel,
        bannedUsers: isBanned 
          ? (channel.bannedUsers || []).filter(id => id !== userId)
          : [...(channel.bannedUsers || []), userId],
        members: isBanned 
          ? channel.members 
          : channel.members.filter(id => id !== userId)
      };
      onUpdate(updatedChannel);
      
      // Remove from local members list if banning
      if (!isBanned) {
        setMembers(members.filter(member => member.uid !== userId));
      }
    } catch (error) {
      console.error('Error updating ban status:', error);
      setError('Failed to update ban status');
      showToast('Failed to update ban status', 'error');
    }
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.displayName.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower)
    );
  });

  const adminMembers = filteredMembers.filter(member => isUserAdmin(member.uid));
  const regularMembers = filteredMembers.filter(member => !isUserAdmin(member.uid));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-[#004C54]">
            {currentUserIsAdmin ? 'Manage Channel Members' : 'Channel Members'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4 border-b sticky top-[65px] bg-white z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          {currentUserIsAdmin && (
            <div className="flex mt-3 border-t pt-3">
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-2 text-center rounded-l-md ${
                  activeTab === 'members' 
                    ? 'bg-[#004C54] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Members
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`flex-1 py-2 text-center rounded-r-md ${
                  activeTab === 'admins' 
                    ? 'bg-[#004C54] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admins Only
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : activeTab === 'members' ? (
            <>
              {adminMembers.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Admins</h3>
                  <ul className="space-y-2">
                    {adminMembers.map(member => (
                      <MemberItem
                        key={member.uid}
                        member={member}
                        isAdmin={true}
                        isCreator={member.uid === channel.createdBy}
                        currentUserIsAdmin={currentUserIsAdmin}
                        onToggleAdmin={() => handleToggleAdmin(member.uid)}
                        onRemove={() => handleRemoveMember(member.uid)}
                        onMute={handleMuteUser}
                        onBan={handleBanUser}
                        isMuted={channel.mutedUsers?.includes(member.uid)}
                        isBanned={channel.bannedUsers?.includes(member.uid)}
                      />
                    ))}
                  </ul>
                </div>
              )}
              
              {regularMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Members</h3>
                  <ul className="space-y-2">
                    {regularMembers.map(member => (
                      <MemberItem
                        key={member.uid}
                        member={member}
                        isAdmin={false}
                        isCreator={member.uid === channel.createdBy}
                        currentUserIsAdmin={currentUserIsAdmin}
                        onToggleAdmin={() => handleToggleAdmin(member.uid)}
                        onRemove={() => handleRemoveMember(member.uid)}
                        onMute={handleMuteUser}
                        onBan={handleBanUser}
                        isMuted={channel.mutedUsers?.includes(member.uid)}
                        isBanned={channel.bannedUsers?.includes(member.uid)}
                      />
                    ))}
                  </ul>
                </div>
              )}
              
              {filteredMembers.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  {searchTerm ? 'No members match your search' : 'No members found'}
                </p>
              )}
            </>
          ) : (
            <>
              {adminMembers.length > 0 ? (
                <ul className="space-y-2">
                  {adminMembers.map(member => (
                    <MemberItem
                      key={member.uid}
                      member={member}
                      isAdmin={true}
                      isCreator={member.uid === channel.createdBy}
                      currentUserIsAdmin={currentUserIsAdmin}
                      onToggleAdmin={() => handleToggleAdmin(member.uid)}
                      onRemove={() => handleRemoveMember(member.uid)}
                      onMute={handleMuteUser}
                      onBan={handleBanUser}
                      isMuted={channel.mutedUsers?.includes(member.uid)}
                      isBanned={channel.bannedUsers?.includes(member.uid)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  {searchTerm ? 'No admins match your search' : 'No admins found'}
                </p>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex flex-col space-y-2">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
            >
              Done
            </button>
            
            {currentUserIsAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center"
              >
                <FaTrash className="mr-2" />
                Delete Channel
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Channel Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4 text-red-500">
              <FaExclamationTriangle size={24} className="mr-3" />
              <h3 className="text-lg font-semibold">Delete Channel</h3>
            </div>
            
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete <strong>{channel.name}</strong>? This action cannot be undone.
            </p>
            
            {deleteError && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
                {deleteError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChannel}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MemberItemProps {
  member: User;
  isAdmin: boolean;
  isCreator: boolean;
  currentUserIsAdmin: boolean;
  onToggleAdmin: () => void;
  onRemove: () => void;
  onMute?: (userId: string, isMuted: boolean) => void;
  onBan?: (userId: string, isBanned: boolean) => void;
  isMuted?: boolean;
  isBanned?: boolean;
}

const MemberItem: React.FC<MemberItemProps> = ({
  member,
  isAdmin,
  isCreator,
  currentUserIsAdmin,
  onToggleAdmin,
  onRemove,
  onMute,
  onBan,
  isMuted = false,
  isBanned = false
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="flex flex-col p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={member.photoURL || '/default-avatar.png'}
                alt={member.displayName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white
              ${member.status === 'online' ? 'bg-green-500' : 
                member.status === 'offline' ? 'bg-gray-400' :
                member.status === 'deleted' ? 'bg-red-500' : 'bg-yellow-500'}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h4 className="font-medium text-gray-900">
                {member.displayName}
              </h4>
              {isCreator && (
                <span className="px-2 py-0.5 bg-[#004C54] text-white text-xs rounded-full">
                  Creator
                </span>
              )}
              {isAdmin && !isCreator && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Admin
                </span>
              )}
              {isMuted && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Muted
                </span>
              )}
              {isBanned && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                  Banned
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{member.email}</p>
            {member.phoneNumber && (
              <p className="text-sm text-gray-500">{member.phoneNumber}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">
                {member.status === 'online' ? 'Online' : 
                 member.status === 'offline' ? 'Offline' : 
                 member.status === 'away' ? 'Away' : 'Status unknown'}
              </span>
              {member.lastActive && (
                <span className="text-xs text-gray-400">
                  • Last active: {new Date(member.lastActive).toLocaleString()}
                </span>
              )}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showDetails ? 'Less info' : 'More info'}
              </button>
            </div>
          </div>
        </div>
        
        {currentUserIsAdmin && !isCreator && (
          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Member actions"
            >
              <FaEllipsisV size={14} />
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                <button
                  onClick={() => {
                    onToggleAdmin();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaUserShield className="mr-2" size={14} />
                  {isAdmin ? 'Remove Admin' : 'Make Admin'}
                </button>
                
                <button
                  onClick={() => {
                    if (onMute) onMute(member.uid, isMuted);
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  {isMuted ? (
                    <>
                      <FaVolumeUp className="mr-2" size={14} />
                      Unmute User
                    </>
                  ) : (
                    <>
                      <FaVolumeMute className="mr-2" size={14} />
                      Mute User
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    if (onBan) onBan(member.uid, isBanned);
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  {isBanned ? (
                    <>
                      <FaUserSlash className="mr-2" size={14} />
                      Unban User
                    </>
                  ) : (
                    <>
                      <FaBan className="mr-2" size={14} />
                      Ban User
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    if (onRemove) onRemove();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <FaUserMinus className="mr-2" size={14} />
                  Remove from Channel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 pl-15 border-t pt-3 text-sm">
          {member.bio && (
            <p className="text-gray-600 mb-2">
              <strong>Bio:</strong> {member.bio}
            </p>
          )}
          {member.location && (
            <p className="text-gray-600 mb-2">
              <strong>Location:</strong> {member.location}
            </p>
          )}
          {member.createdAt && (
            <p className="text-gray-600 mb-2">
              <strong>Joined:</strong> {member.createdAt.toLocaleDateString()}
            </p>
          )}
          {member.socialLinks && Object.keys(member.socialLinks).length > 0 && (
            <div className="text-gray-600">
              <strong>Social Links:</strong>
              <ul className="ml-4 mt-1">
                {Object.entries(member.socialLinks).map(([platform, url]) => (
                  <li key={platform}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {platform}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageChannelMembersModal; 