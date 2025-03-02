'use client';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, userCanPostInChannel } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Post, Comment } from '@/types/Post';
import { FieldValue } from 'firebase/firestore';

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
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ channelId, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const postData: PostData = {
        content,
        channelId,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        likes: [],
        comments: [] as Comment[],
      };

      if (user.photoURL) {
        postData.authorPhotoURL = user.photoURL;
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
        ...(postData.authorPhotoURL && { authorPhotoURL: postData.authorPhotoURL })
      };
      
      onPostCreated(newPost);
      setContent('');
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