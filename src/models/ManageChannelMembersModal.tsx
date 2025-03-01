'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaUserShield, FaUserMinus, FaSearch } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

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

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In a real app, you would fetch user details for each member ID
        // This is a simplified version that creates placeholder user objects
        const memberUsers: User[] = await Promise.all(
          channel.members.map(async (memberId) => {
            // In a real app, you would fetch user data from Firestore
            // For now, we'll create placeholder data
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

  const isUserAdmin = (userId: string) => {
    return channel.admins?.includes(userId);
  };

  const handleToggleAdmin = async (userId: string) => {
    if (!user) return;
    
    // Only admins can modify other admins
    if (!isUserAdmin(user.uid)) return;
    
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
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      setError('Failed to update admin status');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!user) return;
    
    // Only admins can remove members
    if (!isUserAdmin(user.uid)) return;
    
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
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-[#004C54]">Manage Channel Members</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members..."
              className="w-full p-2 pl-10 border rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="flex mt-4 border-b">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 text-center ${
                activeTab === 'members'
                  ? 'text-[#004C54] border-b-2 border-[#004C54] font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Members ({filteredMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`flex-1 py-2 text-center ${
                activeTab === 'admins'
                  ? 'text-[#004C54] border-b-2 border-[#004C54] font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Admins ({adminMembers.length})
            </button>
          </div>
        </div>
        
        {error && (
          <div className="p-3 m-4 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#004C54]"></div>
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
                        currentUserIsAdmin={isUserAdmin(user?.uid || '')}
                        onToggleAdmin={() => handleToggleAdmin(member.uid)}
                        onRemove={() => handleRemoveMember(member.uid)}
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
                        currentUserIsAdmin={isUserAdmin(user?.uid || '')}
                        onToggleAdmin={() => handleToggleAdmin(member.uid)}
                        onRemove={() => handleRemoveMember(member.uid)}
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
                      currentUserIsAdmin={isUserAdmin(user?.uid || '')}
                      onToggleAdmin={() => handleToggleAdmin(member.uid)}
                      onRemove={() => handleRemoveMember(member.uid)}
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
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
          >
            Done
          </button>
        </div>
      </div>
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
}

const MemberItem: React.FC<MemberItemProps> = ({
  member,
  isAdmin,
  isCreator,
  currentUserIsAdmin,
  onToggleAdmin,
  onRemove
}) => {
  return (
    <li className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
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
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <span className="text-gray-600 font-medium">
              {member.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div>
          <div className="font-medium text-gray-800">
            {member.displayName}
          </div>
          <div className="text-xs text-gray-500">{member.email}</div>
        </div>
      </div>
      
      {currentUserIsAdmin && (
        <div className="flex space-x-1">
          {!isCreator && (
            <>
              <button
                onClick={onToggleAdmin}
                className={`p-1.5 rounded-full ${
                  isAdmin
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isAdmin ? 'Remove admin privileges' : 'Make admin'}
                aria-label={isAdmin ? 'Remove admin privileges' : 'Make admin'}
              >
                <FaUserShield size={14} />
              </button>
              
              <button
                onClick={onRemove}
                className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                title="Remove from channel"
                aria-label="Remove from channel"
              >
                <FaUserMinus size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
};

export default ManageChannelMembersModal; 