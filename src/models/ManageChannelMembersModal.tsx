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
        // In a real app, you would fetch user details for each member ID
        // This is a simplified version that creates placeholder user objects
        const memberUsers: User[] = await Promise.all(
          channel.members.map(async (memberId) => {
            // Try to fetch real user data from Firestore
            try {
              const userDoc = await getDoc(doc(db, 'users', memberId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  uid: memberId,
                  displayName: userData.displayName || `User ${memberId.substring(0, 5)}`,
                  email: userData.email || `user-${memberId.substring(0, 5)}@example.com`,
                  photoURL: userData.photoURL
                };
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
            
            // Fallback to placeholder data
            return {
              uid: memberId,
              displayName: `User ${memberId.substring(0, 5)}`,
              email: `user-${memberId.substring(0, 5)}@example.com`,
              photoURL: undefined
            };
          })
        );
        
        setMembers(memberUsers);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [channel.members]);

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
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-gradient-to-r from-[#003940] to-[#046A38] text-white z-10">
          <h2 className="text-lg font-semibold">
            {currentUserIsAdmin ? 'Manage Channel Members' : 'Channel Members'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-[#A5ACAF] transition-colors">
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
              className="w-full px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors"
            >
              Done
            </button>
            
            {currentUserIsAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center transition-colors"
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
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChannel}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center transition-colors"
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
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <li className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
      <div className="flex items-center">
        {member.photoURL ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden mr-3">
            <Image
              src={member.photoURL}
              alt={member.displayName}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#004C54] text-white flex items-center justify-center mr-3">
            <span className="font-medium">
              {member.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div>
          <div className="font-medium text-gray-800 flex items-center">
            {member.displayName}
            {isAdmin && (
              <span className="ml-1 text-xs bg-[#004C54] text-white px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
            {isCreator && (
              <span className="ml-1 text-xs bg-[#046A38] text-white px-1.5 py-0.5 rounded">
                Creator
              </span>
            )}
            {isMuted && (
              <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex items-center">
                <FaVolumeMute className="mr-1" size={10} />
                Muted
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">{member.email}</div>
        </div>
      </div>
      
      {currentUserIsAdmin && !isCreator && (
        <div className="relative" ref={actionsRef}>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Member actions"
          >
            <FaEllipsisV size={14} />
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
              <button
                onClick={() => {
                  onToggleAdmin();
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
              >
                <FaUserShield className="mr-2" size={14} />
                {isAdmin ? 'Remove Admin' : 'Make Admin'}
              </button>
              
              <button
                onClick={() => {
                  if (onMute) onMute(member.uid, isMuted);
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
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
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
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
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
              >
                <FaUserMinus className="mr-2" size={14} />
                Remove from Channel
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export { ManageChannelMembersModal };
