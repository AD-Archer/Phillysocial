'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaUserSlash, FaUser, FaEnvelope, FaCalendarAlt, FaMapMarkerAlt, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Image from 'next/image';
import { Channel } from '@/types/Channel';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, updateDoc, arrayRemove, getDoc, arrayUnion, collection, query, where, getDocs, FieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useToast } from '../layouts/Toast';

interface User {
  uid: string;
  displayName: string;
  fullName?: string;
  email: string;
  photoURL?: string;
  lastActive?: Date;
  status: string;
  phoneNumber?: string;
  createdAt?: Date;
  bio?: string;
  location?: string;
  socialLinks?: Record<string, string>;
  banReason?: string;
  bannedAt?: Date;
  bannedBy?: {
    uid: string;
    displayName: string;
  };
}

interface BannedUsersModalProps {
  channel: Channel;
  onClose: () => void;
  onUpdate: (updatedChannel: Channel) => void;
}

const BannedUsersModal: React.FC<BannedUsersModalProps> = ({
  channel,
  onClose,
  onUpdate
}) => {
  const [bannedUsers, setBannedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [banHistoryPermissionError, setBanHistoryPermissionError] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const currentUserIsAdmin = channel.admins?.includes(user?.uid || '');

  useEffect(() => {
    const fetchBannedUsers = async () => {
      if (!channel.bannedUsers || channel.bannedUsers.length === 0) {
        setBannedUsers([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      setBanHistoryPermissionError(false);
      
      try {
        // Fetch complete user data for each banned user
        const bannedUserDetails: User[] = await Promise.all(
          channel.bannedUsers.map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            
            // Also fetch ban details from the channel's banHistory collection if it exists
            let banReason = '';
            let bannedAt = undefined;
            let bannedBy = undefined;
            
            try {
              // Check if there's a banHistory subcollection
              const banHistoryQuery = query(
                collection(db, 'channels', channel.id, 'banHistory'),
                where('userId', '==', userId)
              );
              
              const banHistorySnapshot = await getDocs(banHistoryQuery);
              
              if (!banHistorySnapshot.empty) {
                // Get the most recent ban record
                const banRecord = banHistorySnapshot.docs
                  .map(doc => ({ id: doc.id, ...doc.data() }))
                  .sort((a, b) => b.bannedAt?.toDate() - a.bannedAt?.toDate())[0];
                
                banReason = banRecord.reason || '';
                bannedAt = banRecord.bannedAt?.toDate();
                
                // Fetch banner's display name if available
                if (banRecord.bannedBy) {
                  const bannerDoc = await getDoc(doc(db, 'users', banRecord.bannedBy));
                  if (bannerDoc.exists()) {
                    const bannerData = bannerDoc.data();
                    bannedBy = {
                      uid: banRecord.bannedBy,
                      displayName: bannerData.displayName || 'Unknown User'
                    };
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching ban history:', error);
              // Check if it's a permission error
              if (error.code === 'permission-denied') {
                setBanHistoryPermissionError(true);
              }
              // Continue without ban history
            }
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                uid: userId,
                displayName: userData.displayName || 'Unknown User',
                fullName: userData.fullName,
                email: userData.email,
                photoURL: userData.photoURL,
                lastActive: userData.lastActive?.toDate() || null,
                status: userData.status || 'offline',
                phoneNumber: userData.phoneNumber,
                createdAt: userData.createdAt?.toDate(),
                bio: userData.bio,
                location: userData.location,
                socialLinks: userData.socialLinks || {},
                banReason,
                bannedAt,
                bannedBy
              };
            }
            
            return {
              uid: userId,
              displayName: 'Deleted Account',
              email: 'Account no longer exists',
              photoURL: '/default-avatar.png',
              status: 'deleted',
              banReason,
              bannedAt,
              bannedBy
            };
          })
        );
        
        setBannedUsers(bannedUserDetails);
      } catch (error) {
        console.error('Error fetching banned users:', error);
        setError('Failed to load banned user information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBannedUsers();
  }, [channel.bannedUsers, channel.id]);

  const handleUnbanUser = async (userId: string, addBackToChannel: boolean = false) => {
    if (!user || !currentUserIsAdmin) return;
    
    try {
      const channelRef = doc(db, 'channels', channel.id);
      
      // Create update data object to avoid undefined values
      const updateData: { [key: string]: FieldValue } = {};
      
      if (addBackToChannel) {
        // Unban user and add back to members
        updateData.bannedUsers = arrayRemove(userId);
        updateData.members = arrayUnion(userId);
        
        await updateDoc(channelRef, updateData);
        
        // Update local state
        const updatedChannel = {
          ...channel,
          bannedUsers: (channel.bannedUsers || []).filter(id => id !== userId),
          members: [...channel.members, userId]
        };
        onUpdate(updatedChannel);
        showToast('User unbanned and added back to channel', 'success');
      } else {
        // Just unban user
        updateData.bannedUsers = arrayRemove(userId);
        
        await updateDoc(channelRef, updateData);
        
        // Update local state
        const updatedChannel = {
          ...channel,
          bannedUsers: (channel.bannedUsers || []).filter(id => id !== userId)
        };
        onUpdate(updatedChannel);
        showToast('User unbanned successfully', 'success');
      }
      
      // Remove from local banned users list
      setBannedUsers(bannedUsers.filter(bannedUser => bannedUser.uid !== userId));
    } catch (error) {
      console.error('Error unbanning user:', error);
      setError('Failed to unban user');
      showToast('Failed to unban user', 'error');
    }
  };

  const toggleUserExpanded = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  const filteredBannedUsers = bannedUsers.filter(bannedUser => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bannedUser.displayName.toLowerCase().includes(searchLower) ||
      bannedUser.email.toLowerCase().includes(searchLower) ||
      (bannedUser.bio && bannedUser.bio.toLowerCase().includes(searchLower)) ||
      (bannedUser.location && bannedUser.location.toLowerCase().includes(searchLower))
    );
  });

  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-[#004C54]">
            Banned Users {filteredBannedUsers.length > 0 && `(${filteredBannedUsers.length})`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4 border-b sticky top-[65px] bg-white z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search banned users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {banHistoryPermissionError && currentUserIsAdmin && (
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
            <p className="text-sm text-yellow-700 flex items-center">
              <FaInfoCircle className="mr-2" />
              Ban history details are not available due to permission settings. Please update your Firestore security rules to allow access to the banHistory subcollection.
            </p>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredBannedUsers.length > 0 ? (
            <ul className="space-y-4">
              {filteredBannedUsers.map(bannedUser => (
                <li key={bannedUser.uid} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleUserExpanded(bannedUser.uid)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          {isValidImageUrl(bannedUser.photoURL) ? (
                            <Image
                              src={bannedUser.photoURL}
                              alt={bannedUser.displayName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <FaUser className="text-gray-400 w-6 h-6" />
                            </div>
                          )}
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                            ${bannedUser.status === 'online' ? 'bg-green-500' : 
                              bannedUser.status === 'offline' ? 'bg-gray-400' :
                              bannedUser.status === 'deleted' ? 'bg-red-500' : 'bg-yellow-500'}`}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{bannedUser.displayName}</h4>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaEnvelope className="mr-1 text-gray-400" size={12} />
                            {bannedUser.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {expandedUser === bannedUser.uid ? (
                          <FaChevronUp className="text-gray-400" />
                        ) : (
                          <FaChevronDown className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedUser === bannedUser.uid && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {bannedUser.bio && (
                          <div className="col-span-1 md:col-span-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Bio</h5>
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                              {bannedUser.bio}
                            </p>
                          </div>
                        )}
                        
                        {bannedUser.location && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <FaMapMarkerAlt className="mr-1 text-gray-400" size={12} />
                              Location
                            </h5>
                            <p className="text-sm text-gray-600">{bannedUser.location}</p>
                          </div>
                        )}
                        
                        {bannedUser.createdAt && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <FaCalendarAlt className="mr-1 text-gray-400" size={12} />
                              Joined
                            </h5>
                            <p className="text-sm text-gray-600">
                              {bannedUser.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-red-50 p-3 rounded-md mb-4 border border-red-200">
                        <h5 className="text-sm font-medium text-red-700 mb-1 flex items-center">
                          <FaInfoCircle className="mr-1" size={12} />
                          Ban Information
                        </h5>
                        {bannedUser.bannedAt ? (
                          <p className="text-sm text-red-600 mb-1">
                            Banned on: {bannedUser.bannedAt.toLocaleDateString()} at {bannedUser.bannedAt.toLocaleTimeString()}
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 mb-1 italic">
                            Ban date not available
                          </p>
                        )}
                        {bannedUser.bannedBy ? (
                          <p className="text-sm text-red-600 mb-1">
                            Banned by: {bannedUser.bannedBy.displayName}
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 mb-1 italic">
                            Ban issuer not available
                          </p>
                        )}
                        {bannedUser.banReason ? (
                          <p className="text-sm text-red-600">
                            Reason: {bannedUser.banReason}
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 italic">
                            No reason provided
                          </p>
                        )}
                        
                        {banHistoryPermissionError && (
                          <p className="text-xs text-red-500 mt-2 italic">
                            Note: Complete ban details may not be available due to permission settings
                          </p>
                        )}
                      </div>
                      
                      {currentUserIsAdmin && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnbanUser(bannedUser.uid, true);
                            }}
                            className="flex-1 px-3 py-2 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] flex items-center justify-center"
                          >
                            <FaUserSlash className="mr-2" size={14} />
                            Unban & Add to Channel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnbanUser(bannedUser.uid);
                            }}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 flex items-center justify-center"
                          >
                            <FaUserSlash className="mr-2" size={14} />
                            Unban Only
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <FaUserSlash className="mx-auto text-gray-300" size={48} />
              <p className="mt-4 text-gray-500">
                {searchTerm ? 'No banned users match your search' : 'No users are currently banned from this channel'}
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannedUsersModal; 