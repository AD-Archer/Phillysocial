'use client';
import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { FaTimes } from 'react-icons/fa';
import { Post } from '@/types/Post';
import Image from 'next/image';

interface CreatePostFormProps {
  channelId: string;
  onPostCreated: (post: Post) => void;
}

interface FirebaseError {
  code: string;
  message: string;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ channelId, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
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
      
      if (image) {
        const storageRef = ref(storage, `posts/${channelId}/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      const postData = {
        content,
        channelId,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || undefined,
        createdAt: serverTimestamp(),
        likes: [],
        comments: [],
        imageUrl
      };
      
      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      const newPost: Post = {
        id: docRef.id,
        ...postData,
        createdAt: new Date()
      };
      
      onPostCreated(newPost);
      setContent('');
      removeImage();
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      console.error('Error creating post:', firebaseError);
      setError(firebaseError.message || 'An error occurred while creating the post');
    } finally {
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
            <Image 
              src={imagePreview} 
              alt="Preview" 
              width={160}
              height={160}
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
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        
        {error && (
          <div className="mt-2 text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <div className="mt-3 flex justify-between items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-[#004C54]"
          >
            Add Image
          </button>
          
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