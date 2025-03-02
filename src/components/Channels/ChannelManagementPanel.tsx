'use client';
import { useState, useEffect } from 'react';
import { FaUsers, FaCog, FaKey, FaLock, FaGlobe, FaTrash, FaEdit, FaUserShield, FaRandom, FaCalendarAlt, FaBan } from 'react-icons/fa';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import ManageChannelMembersModal from '../../models/ManageChannelMembersModal';
import EditChannelModal from '../../models/EditChannelModal';
import BannedUsersModal from '../../models/BannedUsersModal';
import { doc, updateDoc, deleteDoc, } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useToast } from '../../layouts/Toast';
import { useRouter } from 'next/navigation';

interface ChannelManagementPanelProps {
  channel: Channel;
  onUpdate: (updatedChannel: Channel) => void;
  onClose?: () => void;
}

const ChannelManagementPanel: React.FC<ChannelManagementPanelProps> = ({
  channel,
  onUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [inviteCodeExpiry, setInviteCodeExpiry] = useState<string>('');
  const [showBannedUsersModal, setShowBannedUsersModal] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (channel.inviteCodeExpiry) {
      const expiryDate = new Date(channel.inviteCodeExpiry);
      setInviteCodeExpiry(expiryDate.toISOString().split('T')[0]);
    }
  }, [channel]);

  const isUserAdmin = () => {
    if (!user) return false;
    return channel.admins?.includes(user.uid) || false;
  };

  const handleTogglePrivacy = async () => {
    if (!isUserAdmin()) return;
    
    setIsUpdating(true);
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      // If making private, generate an invite code
      const updates: { isPublic: boolean; inviteCode?: string } = {
        isPublic: !channel.isPublic
      };
      
      // If switching to private, generate an invite code if one doesn't exist
      if (!channel.isPublic === false && !channel.inviteCode) {
        const inviteCode = generateRandomInviteCode();
        updates.inviteCode = inviteCode;
      }
      
      await updateDoc(channelRef, updates);
      
      // Update local state
      const updatedChannel = {
        ...channel,
        ...updates
      };
      
      onUpdate(updatedChannel);
      showToast(`Channel is now ${updatedChannel.isPublic ? 'public' : 'private'}`, 'success');
    } catch (error) {
      console.error('Error updating channel privacy:', error);
      showToast('Failed to update channel privacy', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const generateRandomInviteCode = () => {
    // Generate a random 10-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateNewInviteCode = async () => {
    if (!isUserAdmin()) return;
    
    setIsGeneratingCode(true);
    
    try {
      const newInviteCode = generateRandomInviteCode();
      const channelRef = doc(db, 'channels', channel.id);
      
      const updates: { inviteCode: string; inviteCodeExpiry: Date | undefined } = {
        inviteCode: newInviteCode,
        inviteCodeExpiry: inviteCodeExpiry ? new Date(inviteCodeExpiry) : undefined
      };
      
      await updateDoc(channelRef, updates);
      
      // Update local state
      const updatedChannel = {
        ...channel,
        ...updates
      };
      
      onUpdate(updatedChannel);
      showToast('New invite code generated successfully', 'success');
    } catch (error) {
      console.error('Error generating new invite code:', error);
      showToast('Failed to generate new invite code', 'error');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleUpdateInviteCodeExpiry = async () => {
    if (!isUserAdmin()) return;
    
    setIsUpdating(true);
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      const updates: { inviteCodeExpiry: Date | undefined } = {
        inviteCodeExpiry: inviteCodeExpiry ? new Date(inviteCodeExpiry) : undefined
      };
      
      await updateDoc(channelRef, updates);
      
      // Update local state
      const updatedChannel = {
        ...channel,
        ...updates
      };
      
      onUpdate(updatedChannel);
      showToast('Invite code expiry updated', 'success');
    } catch (error) {
      console.error('Error updating invite code expiry:', error);
      showToast('Failed to update invite code expiry', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!isUserAdmin()) return;
    
    setIsDeleting(true);
    
    try {
      // Permanently delete the channel
      const channelRef = doc(db, 'channels', channel.id);
      await deleteDoc(channelRef);
      
      showToast('Channel permanently deleted', 'success');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting channel:', error);
      showToast('Failed to delete channel', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#004C54]">Channel Management</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        )}
      </div>
      
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center px-4 py-2 ${
            activeTab === 'members' 
              ? 'border-b-2 border-[#004C54] text-[#004C54]' 
              : 'text-gray-500'
          }`}
        >
          <FaUsers className="mr-2" />
          Members
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center px-4 py-2 ${
            activeTab === 'settings' 
              ? 'border-b-2 border-[#004C54] text-[#004C54]' 
              : 'text-gray-500'
          }`}
        >
          <FaCog className="mr-2" />
          Settings
        </button>
      </div>
      
      {activeTab === 'members' && (
        <div>
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Member Management</h3>
            <p className="text-sm text-gray-600 mb-3">
              View and manage channel members, assign admin roles, or moderate users.
            </p>
            
            <button
              onClick={() => setShowMembersModal(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] mb-3"
            >
              <FaUserShield className="mr-2" />
              {isUserAdmin() ? 'Manage Members' : 'View Members'}
            </button>

            {isUserAdmin() && (
              <button
                onClick={() => setShowBannedUsersModal(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <FaBan className="mr-2" />
                Manage Banned Users {channel.bannedUsers && channel.bannedUsers.length > 0 ? `(${channel.bannedUsers.length})` : ''}
              </button>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Channel Stats</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Total Members:</span>
                <span className="text-sm font-medium">{channel.members.length}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Admins:</span>
                <span className="text-sm font-medium">{channel.admins?.length || 1}</span>
              </div>
              {channel.invitedUsers && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Invited Users:</span>
                  <span className="text-sm font-medium">{channel.invitedUsers.length}</span>
                </div>
              )}
              {channel.bannedUsers && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Banned Users:</span>
                  <span className="text-sm font-medium">{channel.bannedUsers.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && isUserAdmin() && (
        <div>
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Channel Settings</h3>
            <p className="text-sm text-gray-600 mb-3">
              Modify channel details, privacy settings, and other configurations.
            </p>
            
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] mb-3"
            >
              <FaEdit className="mr-2" />
              Edit Channel Details
            </button>
            
            <button
              onClick={handleTogglePrivacy}
              disabled={isUpdating}
              className="w-full flex items-center justify-center px-4 py-2 bg-[#046A38] text-white rounded-md hover:bg-[#035C2F] mb-3"
            >
              {channel.isPublic ? (
                <>
                  <FaLock className="mr-2" />
                  Make Channel Private
                </>
              ) : (
                <>
                  <FaGlobe className="mr-2" />
                  Make Channel Public
                </>
              )}
            </button>
            
            {!channel.isPublic && (
              <div className="bg-gray-50 p-3 rounded-md mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaKey className="mr-2 text-[#004C54]" />
                  Invite Code
                </h4>
                <div className="flex items-center">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1 overflow-x-auto">
                    {channel.inviteCode}
                  </code>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaCalendarAlt className="inline mr-1" /> Invite Code Expiry (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={inviteCodeExpiry}
                      onChange={(e) => setInviteCodeExpiry(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <button
                      onClick={handleUpdateInviteCodeExpiry}
                      disabled={isUpdating}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      Update
                    </button>
                  </div>
                  {channel.inviteCodeExpiry && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current expiry: {new Date(channel.inviteCodeExpiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="mt-3">
                  <button
                    onClick={handleGenerateNewInviteCode}
                    disabled={isGeneratingCode}
                    className="w-full flex items-center justify-center px-3 py-1.5 bg-[#004C54] text-white rounded-md hover:bg-[#003940] text-sm"
                  >
                    <FaRandom className="mr-2" />
                    Generate New Invite Code
                  </button>
                </div>
                
                <p className="mt-2 text-xs text-gray-500">
                  Share this code with people you want to invite to this channel
                </p>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-3">
              These actions cannot be undone. Please be certain.
            </p>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <FaTrash className="mr-2" />
              Delete Channel
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && !isUserAdmin() && (
        <div className="text-center py-4">
          <p className="text-gray-600">
            You need admin permissions to access channel settings.
          </p>
        </div>
      )}
      
      {/* Modals */}
      {showMembersModal && (
        <ManageChannelMembersModal
          channel={channel}
          onClose={() => setShowMembersModal(false)}
          onUpdate={onUpdate}
        />
      )}
      
      {showBannedUsersModal && (
        <BannedUsersModal
          channel={channel}
          onClose={() => setShowBannedUsersModal(false)}
          onUpdate={onUpdate}
        />
      )}
      
      {showEditModal && (
        <EditChannelModal
          channel={channel}
          onClose={() => setShowEditModal(false)}
          onUpdate={onUpdate}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4 text-red-500">
              <FaTrash size={24} className="mr-3" />
              <h3 className="text-lg font-semibold">Delete Channel</h3>
            </div>
            
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete <strong>{channel.name}</strong>? This action cannot be undone and will permanently delete all channel data.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChannel}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelManagementPanel; 