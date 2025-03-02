'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaUserPlus, FaKey, FaUserShield, FaRandom, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Channel } from '@/types/Channel';
import { useToast } from '../layouts/Toast';

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
  const [inviteCodeExpiry, setInviteCodeExpiry] = useState('');
  const [adminEmails, setAdminEmails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  // Generate a random invite code when the component mounts or when privacy changes
  useEffect(() => {
    if (!isPublic) {
      generateInviteCode();
    }
  }, [isPublic]);

  // Generate a random invite code
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!user) {
      setError('You must be logged in to create a channel.');
      setIsLoading(false);
      return;
    }

    try {
      // Validate inputs
      if (!name.trim()) {
        setError('Channel name is required.');
        setIsLoading(false);
        return;
      }

      const timestamp = new Date();
      const adminUsers: string[] = [user.uid];
      const invitedUsers: string[] = inviteEmails.trim() ? inviteEmails.split(',').map(email => email.trim()) : [];

      const channelData: Omit<Channel, 'id'> = {
        name: name.trim(),
        description: description.trim(),
        createdBy: user.uid,
        createdAt: timestamp,
        members: [user.uid],
        admins: adminUsers,
        isPublic,
        ...(invitedUsers.length > 0 && { invitedUsers }),
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
      showToast('Channel created successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error creating channel:', error);
      setError('Failed to create channel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-[#004C54]">Create New Channel</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
              <FaExclamationTriangle className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="channel-name" className="block text-sm font-medium text-gray-700 mb-1">
              Channel Name*
            </label>
            <input
              id="channel-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="Enter channel name"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Choose a unique name for your channel
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="channel-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="Enter channel description"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Setting
            </span>
            <div className="flex space-x-4 mb-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="privacy"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mr-2"
                />
                <span>Public</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="privacy"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mr-2"
                />
                <span>Private</span>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              {isPublic 
                ? 'Public channels can be joined by anyone' 
                : 'Private channels require an invite code to join'}
            </p>
          </div>
          
          {!isPublic && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700">
                  <FaKey className="inline mr-1 text-[#004C54]" /> Invite Code
                </label>
                <button
                  type="button"
                  onClick={generateInviteCode}
                  className="text-xs text-[#004C54] hover:underline flex items-center"
                >
                  <FaRandom className="mr-1" /> Generate New
                </button>
              </div>
              <div className="flex">
                <input
                  id="invite-code"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54] font-mono"
                  placeholder="Invite code"
                  required={!isPublic}
                />
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" /> Invite Code Expiry (Optional)
                </label>
                <input
                  type="date"
                  value={inviteCodeExpiry}
                  onChange={(e) => setInviteCodeExpiry(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Set an expiration date for this invite code (optional)
                </p>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="invite-emails" className="block text-sm font-medium text-gray-700 mb-1">
              <FaUserPlus className="inline mr-1" /> Invite Users (Optional)
            </label>
            <textarea
              id="invite-emails"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="Enter email addresses separated by commas"
              rows={2}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter email addresses of users you want to invite, separated by commas
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="admin-emails" className="block text-sm font-medium text-gray-700 mb-1">
              <FaUserShield className="inline mr-1" /> Add Admins (Optional)
            </label>
            <textarea
              id="admin-emails"
              value={adminEmails}
              onChange={(e) => setAdminEmails(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#004C54] focus:border-[#004C54]"
              placeholder="Enter email addresses separated by commas"
              rows={2}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter email addresses of users you want to make admins, separated by commas
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal; 