'use client';
import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { FaImage, FaTimes } from 'react-icons/fa';
import { Post } from '@/types/Post';
import { useRouter } from 'next/navigation';

interface CreatePostFormProps {
  channelId: string;
  onPostCreated: (post: Post) => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ channelId, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size should be less than 5MB');
      return;
    }
    
    setImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      let imageUrl = undefined;
      
      // Upload image if exists
      if (image) {
        const storageRef = ref(storage, `posts/${channelId}/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Create the post document
      const postData = {
        content,
        channelId,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        imageUrl
      };
      
      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      // Create the post object with the new ID
      const newPost: Post = {
        id: docRef.id,
        ...postData
      };
      
      onPostCreated(newPost);
      setContent('');
      removeImage();
    } catch (err: any) {
      console.error('Error creating post:', err);
      
      // Handle Firebase permission errors specifically
      if (err.code === 'permission-denied') {
        setError('You do not have permission to post in this channel. Please contact an administrator.');
      } else {
        setError(`Failed to create post: ${err.message || 'Unknown error'}`);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004C54]"
          rows={3}
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />
        
        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-40 rounded-md" 
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}
        
        {error && (
          <div className="mt-2 text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg text-white ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#004C54] hover:bg-[#003A40]'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm; 