'use client';
import { useState } from 'react';
import { FaTimes, FaUserPlus, FaKey, FaUserShield, FaRandom } from 'react-icons/fa';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Channel } from '@/types/Channel';

interface CreateChannelModalProps {
  onClose: () => void;
  onChannelCreated: (channel: Channel) => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose, onChannelCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [adminEmails, setAdminEmails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Generate a random invite code
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a channel');
      return;
    }
    
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }
    
    if (!isPublic && !inviteCode) {
      setError('Private channels require an invite code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create a timestamp that works with Firestore
      const timestamp = new Date();
      
      // Process invited emails if provided
      const invitedUsers: string[] = [];
      if (inviteEmails.trim()) {
        invitedUsers.push(...inviteEmails.split(',').map(email => email.trim()));
      }
      
      // Process admin emails if provided
      const adminUsers: string[] = [user.uid]; // Creator is always an admin
      if (adminEmails.trim()) {
        // In a real app, you'd convert emails to user IDs
        // For now, we'll just store the emails as placeholders
        const additionalAdmins = adminEmails.split(',').map(email => email.trim());
        // In a real implementation, you would look up user IDs by email
        // For now, we'll just add them to the list
        adminUsers.push(...additionalAdmins);
      }
      
      const channelData = {
        name: name.trim(),
        description: description.trim(),
        createdBy: user.uid,
        createdAt: timestamp,
        members: [user.uid],
        admins: adminUsers,
        isPublic,
        ...(invitedUsers.length > 0 && { invitedUsers }),
        ...((!isPublic && inviteCode) && { inviteCode })
      };
      
      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'channels'), {
        ...channelData,
        createdAt: serverTimestamp() // Use serverTimestamp for Firestore
      });
      
      // Create the channel object with the new ID
      const newChannel: Channel = {
        id: docRef.id,
        ...channelData
      };
      
      onChannelCreated(newChannel);
    } catch (error: Error | unknown) {
      console.error('Error creating channel:', error);
      
      // Provide a more helpful error message
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-[#004C54]">Create New Channel</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <form id="createChannelForm" onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Channel Name*
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="e.g., announcements"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="What's this channel about?"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-[#004C54] focus:ring-[#004C54] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Make this channel public</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Public channels can be discovered and joined by anyone. Private channels require an invite code.
            </p>
          </div>
          
          {!isPublic && (
            <>
              <div className="mb-4">
                <label htmlFor="inviteCode" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <FaKey className="mr-2 text-[#004C54]" />
                  Invite Code*
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="flex-1 p-2 border rounded-l-md focus:ring-[#004C54] focus:border-[#004C54]"
                    placeholder="Invite code for this channel"
                    required={!isPublic}
                  />
                  <button
                    type="button"
                    onClick={generateInviteCode}
                    className="bg-[#004C54] text-white px-3 py-2 rounded-r-md hover:bg-[#003940]"
                  >
                    <FaRandom size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Share this code with people you want to invite to this channel.
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="inviteEmails" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <FaUserPlus className="mr-2 text-[#004C54]" />
                  Invite Users (Optional)
                </label>
                <textarea
                  id="inviteEmails"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
                  placeholder="Enter email addresses separated by commas"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can invite users now or later from the channel settings.
                </p>
              </div>
            </>
          )}
          
          <div className="mb-4">
            <label htmlFor="adminEmails" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <FaUserShield className="mr-2 text-[#004C54]" />
              Channel Admins (Optional)
            </label>
            <textarea
              id="adminEmails"
              value={adminEmails}
              onChange={(e) => setAdminEmails(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="Enter email addresses separated by commas"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Admins can manage channel settings, members, and content. You are automatically an admin.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
        </form>
        
        <div className="flex justify-end space-x-3 p-4 border-t sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="createChannelForm"
            className="px-4 py-2 text-sm bg-[#004C54] text-white rounded-md hover:bg-[#003940] disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelModal; 