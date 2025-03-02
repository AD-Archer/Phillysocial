'use client';
import { useState } from 'react';
import { FaUsers, FaCog, FaKey, FaLock, FaGlobe, FaTrash, FaEdit, FaUserShield } from 'react-icons/fa';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import ManageChannelMembersModal from '../../models/ManageChannelMembersModal';
import EditChannelModal from '../../models/EditChannelModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useToast } from '../../layouts/Toast';

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
  const { user } = useAuth();
  const { showToast } = useToast();

  const isUserAdmin = () => {
    if (!user) return false;
    return channel.admins?.includes(user.uid) || false;
  };

  const handleTogglePrivacy = async () => {
    if (!isUserAdmin()) return;
    
    setIsUpdating(true);
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      await updateDoc(channelRef, {
        isPublic: !channel.isPublic
      });
      
      // Update local state
      const updatedChannel = {
        ...channel,
        isPublic: !channel.isPublic
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

  const handleDeleteChannel = async () => {
    if (!isUserAdmin()) return;
    
    setIsDeleting(true);
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      await updateDoc(channelRef, {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: user?.uid
      });
      
      showToast('Channel deleted successfully', 'success');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
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
              className="w-full flex items-center justify-center px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
            >
              <FaUserShield className="mr-2" />
              {isUserAdmin() ? 'Manage Members' : 'View Members'}
            </button>
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
                <div className="flex justify-between">
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
                <p className="text-xs text-gray-500 mt-2">
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
              Are you sure you want to delete <strong>{channel.name}</strong>? This action cannot be undone.
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