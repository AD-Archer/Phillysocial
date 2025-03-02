'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FaQuestionCircle, FaTimes, FaUser } from 'react-icons/fa';
import MainLayout from '@/layouts/MainLayout';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImageGuide, setShowImageGuide] = useState(false);
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    photoURL: '',
    bio: '',
  });

  const [error, setError] = useState('');

  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileData({
            displayName: userData.displayName || user.displayName || '',
            email: userData.email || user.email || '',
            photoURL: userData.photoURL || user.photoURL || '',
            bio: userData.bio || '',
          });
        } else {
          // Create a new user document if it doesn't exist
          const newUserData = {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            bio: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'online',
            role: 'member'
          };
          
          await setDoc(userRef, newUserData);
          setProfileData(newUserData);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, router]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const userData = {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
        bio: profileData.bio,
        email: user.email,
        updatedAt: new Date(),
        // Add createdAt only if the document is being created for the first time
        ...(userDoc.exists() ? {} : { createdAt: new Date() })
      };

      if (userDoc.exists()) {
        await updateDoc(userRef, userData);
      } else {
        await setDoc(userRef, userData);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38] text-white">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        <div className="relative px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight text-white text-center mb-12 drop-shadow-lg">
              Edit <span className="text-[#A5ACAF]">Profile</span>
            </h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 backdrop-blur-sm text-white rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
              <div className="mb-8 flex flex-col items-center">
                <div className="relative w-40 h-40 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-[#A5ACAF] overflow-hidden transition-all duration-300 hover:border-white">
                    {isValidImageUrl(profileData.photoURL) ? (
                      <Image
                        src={profileData.photoURL}
                        alt="Profile"
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#003038] flex items-center justify-center">
                        <FaUser className="text-[#A5ACAF] w-20 h-20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <button
                      onClick={() => setShowImageGuide(true)}
                      className="bg-[#A5ACAF]/90 p-3 rounded-full shadow-lg hover:bg-white/90 transition-all duration-300 hover:scale-105"
                      title="How to add image URL"
                    >
                      <FaQuestionCircle className="text-[#003038]" size={24} />
                    </button>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-lg font-medium text-[#A5ACAF] mb-2">
                    Profile Image URL
                  </label>
                  <input
                    type="text"
                    value={profileData.photoURL}
                    onChange={(e) => setProfileData({ ...profileData, photoURL: e.target.value })}
                    className="w-full bg-black/30 border border-[#A5ACAF] rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                    placeholder="Enter image URL"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-[#A5ACAF] mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="w-full bg-black/30 border border-[#A5ACAF] rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-[#A5ACAF] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full bg-black/30 border border-[#A5ACAF] rounded-xl p-3 text-white/70"
                  />
                  <p className="mt-2 text-sm text-[#A5ACAF]">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-lg font-medium text-[#A5ACAF] mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full bg-black/30 border border-[#A5ACAF] rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                    rows={4}
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-8 w-full bg-[#A5ACAF] text-[#003038] py-4 px-8 rounded-xl text-lg font-semibold shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showImageGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#003038] rounded-2xl p-8 max-w-md w-full border border-[#A5ACAF] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">How to Add an Image URL</h3>
              <button
                onClick={() => setShowImageGuide(false)}
                className="text-[#A5ACAF] hover:text-white transition-colors duration-300"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-3 text-[#A5ACAF]">
              <li>Go to Google Images</li>
              <li>Find the image you want to use</li>
              <li>Right-click on the image</li>
              <li>Select &quot;Copy image address&quot; or &quot;Copy image link&quot;</li>
              <li>Paste the URL in the image field</li>
            </ol>
            <p className="mt-4 text-sm text-[#A5ACAF]">
              Note: Make sure the image URL ends with an image extension (e.g., .jpg, .png, .gif)
            </p>
            <button
              onClick={() => setShowImageGuide(false)}
              className="mt-6 w-full bg-[#A5ACAF] text-[#003038] py-3 rounded-xl text-lg font-semibold hover:bg-white hover:text-[#004C54] transition-all duration-300"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
