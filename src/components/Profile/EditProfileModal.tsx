'use client';
import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCamera, FaSpinner, FaCheck, FaTrash, FaInfoCircle, FaLink } from 'react-icons/fa';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useToast } from '@/layouts/Toast';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
  initialData?: {
    displayName?: string;
    bio?: string;
    photoURL?: string;
  };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  initialData = {}
}) => {
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(initialData.displayName || user?.displayName || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [photoURL, setPhotoURL] = useState(initialData.photoURL || user?.photoURL || '');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(initialData.displayName || user?.displayName || '');
      setBio(initialData.bio || '');
      setPhotoURL(initialData.photoURL || user?.photoURL || '');
      setImageFile(null);
      setImagePreview(null);
      setImageUrl('');
    }
  }, [isOpen, initialData, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    
    setIsRemoving(true);
    
    try {
      // If there's an existing photo in storage, delete it
      if (photoURL && photoURL.includes('firebasestorage')) {
        const photoRef = ref(storage, photoURL);
        try {
          await deleteObject(photoRef);
        } catch (error) {
          console.warn('Error deleting photo from storage, it may not exist:', error);
          // Continue even if delete fails
        }
      }
      
      try {
        // Update user profile with no photo
        await updateUserProfile({ photoURL: '' });
      } catch (error) {
        console.error('Error updating auth profile:', error);
        showToast('Error updating profile, but continuing with Firestore update', 'warning');
        // Continue with Firestore update even if auth update fails
      }
      
      // Update Firestore - use setDoc with merge to handle non-existent documents
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
        photoURL: '',
        updatedAt: new Date()
      }, { merge: true });
      
      setPhotoURL('');
      setImageFile(null);
      setImagePreview(null);
      
      showToast('Profile photo removed', 'success');
    } catch (error) {
      console.error('Error removing profile photo:', error);
      showToast('Failed to remove profile photo', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  const uploadProfileImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    
    setIsUploading(true);
    
    try {
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `profile-${user.uid}-${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `profile_images/${fileName}`);
      
      // Upload the file
      await uploadBytes(storageRef, imageFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showToast('Failed to upload profile image', 'error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleApplyImageUrl = () => {
    if (imageUrl.trim()) {
      setImagePreview(imageUrl);
      setImageFile(null);
      showToast('Image URL applied. Save changes to update your profile.', 'info');
    } else {
      showToast('Please enter a valid image URL', 'warning');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      let updatedPhotoURL = photoURL;
      
      // Upload new image if selected
      if (imageFile) {
        const newPhotoURL = await uploadProfileImage();
        if (newPhotoURL) {
          updatedPhotoURL = newPhotoURL;
        }
      } else if (imagePreview && imagePreview !== photoURL) {
        // If using an image URL and it's different from the current photoURL
        updatedPhotoURL = imagePreview;
      }
      
      try {
        // Update Firebase Auth profile
        await updateUserProfile({
          displayName,
          photoURL: updatedPhotoURL
        });
      } catch (error) {
        console.error('Error updating auth profile:', error);
        showToast('Error updating profile, but continuing with Firestore update', 'warning');
        // Continue with Firestore update even if auth update fails
      }
      
      // Check if user document exists
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      // Prepare user data
      const userData = {
        displayName,
        bio,
        photoURL: updatedPhotoURL,
        email: user.email,
        updatedAt: new Date()
      };
      
      // If document doesn't exist, add creation data
      if (!userDoc.exists()) {
        Object.assign(userData, {
          createdAt: new Date(),
          joinedAt: new Date(),
          uid: user.uid
        });
      }
      
      // Use setDoc with merge option to handle both create and update
      await setDoc(userRef, userData, { merge: true });
      
      showToast('Profile updated successfully', 'success');
      onProfileUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <AnimatePresence>
        <motion.div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.3 }}
        >
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-gradient-to-r from-[#003940] to-[#046A38] text-white z-10 rounded-t-lg">
            <h2 className="text-lg font-semibold">Edit Profile</h2>
            <button 
              onClick={onClose} 
              className="text-white hover:text-[#A5ACAF] transition-colors"
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#004C54] relative">
                    {(imagePreview || photoURL) ? (
                      <Image 
                        src={imagePreview || photoURL} 
                        alt="Profile Preview" 
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#004C54] text-white flex items-center justify-center text-3xl">
                        {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-[#004C54] text-white p-2 rounded-full hover:bg-[#003940] transition-colors"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCamera />
                    )}
                  </button>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {(photoURL || imagePreview) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-red-600 text-sm flex items-center hover:text-red-700 transition-colors"
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <FaSpinner className="animate-spin mr-1" size={12} />
                    ) : (
                      <FaTrash className="mr-1" size={12} />
                    )}
                    Remove photo
                  </button>
                )}
              </div>
              
              {/* Image URL Input */}
              <div className="mb-4">
                <div className="flex items-center mb-1">
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <div className="relative ml-2">
                    <FaInfoCircle 
                      className="text-[#004C54] cursor-pointer" 
                      size={16}
                      onMouseEnter={() => setShowInfoTooltip(true)}
                      onMouseLeave={() => setShowInfoTooltip(false)}
                    />
                    {showInfoTooltip && (
                      <div className="absolute z-50 w-72 p-3 bg-gray-800 text-white text-xs rounded shadow-lg -translate-x-1/2 left-1/2 mt-2 after:content-[''] after:absolute after:left-1/2 after:-top-2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-b-gray-800">
                        <p>Enter a direct link to an image on the web. The URL should end with an image extension like .jpg, .png, or .gif. Right-click on images online and select "Copy image address" to get a valid URL.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex">
                  <input
                    type="text"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder="https://example.com/image.jpg"
                    className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyImageUrl}
                    className="bg-[#004C54] text-white px-3 rounded-r-md hover:bg-[#003940] transition-colors flex items-center"
                  >
                    <FaLink className="mr-1" /> Apply
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Add an image from the web instead of uploading</p>
              </div>
              
              {/* Display Name */}
              <div className="mb-4">
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name*
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
                  required
                />
              </div>
              
              {/* Bio */}
              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004C54]"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              {/* Email (read-only) */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] flex items-center transition-colors"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EditProfileModal; 