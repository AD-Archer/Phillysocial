'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FaUser, FaMoon, FaEdit } from 'react-icons/fa';
import MainLayout from '@/layouts/MainLayout';
import EditProfileModal from '@/components/Profile/EditProfileModal';
import Image from 'next/image';

// Define a proper type for user settings
interface UserSettingsType {
  displayName: string;
  email: string | null;
  photoURL?: string | null;
  bio?: string;
  theme?: 'light' | 'dark' | 'system';
  // Add other settings as needed
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'appearance'>('account');
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [userProfile, setUserProfile] = useState<UserSettingsType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid) return;
      
      try {
        // Ensure user document exists before fetching
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserProfile({
            ...userData,
            displayName: user.displayName || userData.displayName || 'Anonymous',
            email: user.email || '',
            photoURL: user.photoURL || undefined
          });
          
          // Set theme if it exists
          if (userData.theme) {
            setTheme(userData.theme);
          }
        } else {
          // This should not happen now that we ensure the document exists
          setUserProfile({
            displayName: user.displayName || 'Anonymous',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            bio: '',
            theme: 'light'
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, [user]);
  
  const handleSaveAppearanceSettings = async () => {
    if (!user || !user.uid) return;
    
    setIsLoading(true);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      
      // Prepare user data
      const userData = {
        theme: theme,
        updatedAt: new Date()
      };
      
      // If document doesn't exist, add creation data
      if (!userDoc.exists()) {
        Object.assign(userData, {
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          createdAt: new Date(),
          joinedAt: new Date(),
          uid: user.uid
        });
      }
      
      // Use setDoc with merge option to handle both create and update
      await setDoc(userRef, userData, { merge: true });
      
      // Apply theme changes
      document.documentElement.classList.remove('light', 'dark');
      if (theme !== 'system') {
        document.documentElement.classList.add(theme);
      }
      
      // Remove unused state variables
      // setSuccess('Appearance settings saved successfully');
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      // setError('Failed to save appearance settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdated = () => {
    // Refresh user data
    if (user && user.uid) {
      const fetchUserData = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserProfile({
              ...userData,
              displayName: user.displayName || userData.displayName || 'Anonymous',
              email: user.email || '',
              photoURL: user.photoURL || undefined
            });
          }
        } catch (error) {
          console.error('Error fetching updated user data:', error);
        }
      };
      
      fetchUserData();
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          <p>Please log in to access settings</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-[#004C54] mb-6">Settings</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`px-6 py-3 font-medium flex items-center ${
                activeTab === 'account' 
                  ? 'text-[#004C54] border-b-2 border-[#004C54]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('account')}
            >
              <FaUser className="mr-2" /> Account
            </button>
            <button
              className={`px-6 py-3 font-medium flex items-center ${
                activeTab === 'appearance' 
                  ? 'text-[#004C54] border-b-2 border-[#004C54]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('appearance')}
            >
              <FaMoon className="mr-2" /> Appearance
            </button>
          </div>
          
          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="p-6">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Profile Information</h2>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-3 py-1 bg-[#004C54] text-white rounded-md hover:bg-[#003940] flex items-center text-sm"
                  >
                    <FaEdit className="mr-1" size={14} />
                    Edit Profile
                  </button>
                </div>
                
                <div className="flex items-start mb-6">
                  <div className="mr-6">
                    {userProfile?.photoURL ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden">
                        <Image 
                          src={userProfile.photoURL} 
                          alt={userProfile.displayName || 'User'} 
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-[#004C54] text-white rounded-full flex items-center justify-center text-3xl">
                        {(userProfile?.displayName || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                        {userProfile?.displayName || 'Anonymous'}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                        {userProfile?.email || ''}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <div className="p-2 border border-gray-200 rounded-md bg-gray-50 min-h-[80px]">
                        {userProfile?.bio || 'No bio provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">Account Security</h2>
                <p className="text-gray-600 mb-4">
                  For security settings like password changes, please use the authentication provider&apos;s settings page.
                </p>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center">
                    <FaMoon className="text-[#004C54] mr-3" />
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-gray-500">Change your password</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Theme</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      theme === 'light' ? 'border-[#004C54] bg-[#004C54]/5' : 'border-gray-200'
                    }`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="h-24 bg-white border border-gray-200 rounded-md mb-3 flex items-center justify-center">
                      <div className="w-16 h-4 bg-[#004C54] rounded-full"></div>
                    </div>
                    <div className="flex items-center">
                      {theme === 'light' && <FaMoon className="text-[#004C54] mr-2" />}
                      <span className={theme === 'light' ? 'font-medium text-[#004C54]' : ''}>Light</span>
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      theme === 'dark' ? 'border-[#004C54] bg-[#004C54]/5' : 'border-gray-200'
                    }`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="h-24 bg-gray-800 border border-gray-700 rounded-md mb-3 flex items-center justify-center">
                      <div className="w-16 h-4 bg-[#046A38] rounded-full"></div>
                    </div>
                    <div className="flex items-center">
                      {theme === 'dark' && <FaMoon className="text-[#004C54] mr-2" />}
                      <span className={theme === 'dark' ? 'font-medium text-[#004C54]' : ''}>Dark</span>
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      theme === 'system' ? 'border-[#004C54] bg-[#004C54]/5' : 'border-gray-200'
                    }`}
                    onClick={() => setTheme('system')}
                  >
                    <div className="h-24 bg-gradient-to-r from-white to-gray-800 border border-gray-200 rounded-md mb-3 flex items-center justify-center">
                      <div className="w-16 h-4 bg-gradient-to-r from-[#004C54] to-[#046A38] rounded-full"></div>
                    </div>
                    <div className="flex items-center">
                      {theme === 'system' && <FaMoon className="text-[#004C54] mr-2" />}
                      <span className={theme === 'system' ? 'font-medium text-[#004C54]' : ''}>System</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAppearanceSettings}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] flex items-center"
                >
                  {isLoading ? (
                    <>
                      <FaMoon className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaMoon className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        initialData={{
          displayName: userProfile?.displayName,
          bio: userProfile?.bio,
          photoURL: userProfile?.photoURL || undefined
        }}
      />
    </MainLayout>
  );
}
