'use client';
import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, userCanPostInChannel } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Post, Comment } from '@/types/Post';
import { FieldValue } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaImage, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useToast } from '../../layouts/Toast';
import Image from 'next/image';

interface CreatePostFormProps {
  channelId: string;
  onPostCreated: (post: Post) => void;
}

interface FirebaseError {
  code: string;
  message: string;
}

interface PostData {
  content: string;
  channelId: string;
  authorId: string;
  authorName: string;
  createdAt: FieldValue;
  likes: string[];
  comments: Comment[];
  authorPhotoURL?: string;
  imageUrl?: string;
  isDeleted?: boolean;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ channelId, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }

    const hasPermission = await userCanPostInChannel(user.uid, channelId);
    if (!hasPermission) {
      setError('You do not have permission to post in this channel');
      showToast('You do not have permission to post in this channel', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use Firestore user data if available, fallback to Firebase user data
      const displayName = user.firestoreData?.displayName || user.displayName || 'Anonymous';
      const photoURL = user.firestoreData?.photoURL || user.photoURL || '';
      
      const postData: PostData = {
        content,
        channelId,
        authorId: user.uid,
        authorName: displayName,
        createdAt: serverTimestamp(),
        likes: [],
        comments: [] as Comment[],
        isDeleted: false,
      };

      if (photoURL) {
        postData.authorPhotoURL = photoURL;
      }
      
      if (imageUrl.trim()) {
        postData.imageUrl = imageUrl.trim();
      }
      
      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      const newPost: Post = {
        id: docRef.id,
        content: postData.content,
        channelId: postData.channelId,
        authorId: postData.authorId,
        authorName: postData.authorName,
        createdAt: new Date(),
        likes: postData.likes,
        comments: postData.comments,
        ...(postData.authorPhotoURL && { authorPhotoURL: postData.authorPhotoURL }),
        ...(postData.imageUrl && { imageUrl: postData.imageUrl })
      };
      
      // Let the Firestore listener handle adding the post to the UI
      // This prevents duplicate posts
      onPostCreated(newPost);
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      showToast('Post created successfully', 'success');
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      console.error('Error creating post:', firebaseError);
      setError(firebaseError.message || 'An error occurred while creating the post');
      showToast('Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only blur if clicking outside the form
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  const handleImageToggle = () => {
    setShowImageInput(!showImageInput);
    if (!showImageInput && textareaRef.current) {
      // Focus the textarea after showing image input
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form 
        onSubmit={handleSubmit} 
        className="p-4"
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <div className="flex items-start space-x-3">
          {user?.photoURL ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image 
                src={user.photoURL} 
                alt={user.displayName || 'User'}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#004C54] text-white rounded-full flex items-center justify-center flex-shrink-0">
              {(user?.displayName || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              className={`w-full p-3 border ${error ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004C54] transition-all`}
              rows={isFocused ? 4 : 2}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="mt-2 text-red-600 text-sm flex items-center"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <FaExclamationTriangle className="mr-1 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {showImageInput && (
                <motion.div 
                  className="mt-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Enter image URL"
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004C54] text-sm"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                      disabled={!imageUrl || isSubmitting}
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                  
                  {imageUrl && (
                    <div className="mt-2 relative h-32 rounded-lg overflow-hidden border border-gray-200">
                      <Image 
                        src={imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        onError={() => {
                          showToast('Invalid image URL', 'error');
                          setImageUrl('');
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {(isFocused || content.trim() || showImageInput) && (
                <motion.div 
                  className="mt-3 flex justify-between items-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleImageToggle}
                      className={`p-2 rounded-full ${showImageInput ? 'bg-[#004C54]/10 text-[#004C54]' : 'text-gray-500 hover:bg-gray-100'}`}
                      disabled={isSubmitting}
                      aria-label="Add image"
                    >
                      <FaImage size={16} />
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg text-white flex items-center ${
                      isSubmitting || !content.trim()
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[#004C54] hover:bg-[#003940]'
                    }`}
                    disabled={isSubmitting || !content.trim()}
                  >
                    {isSubmitting ? 'Posting...' : (
                      <>
                        <span className="mr-1">Post</span>
                        <FaPaperPlane size={14} />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default CreatePostForm; 