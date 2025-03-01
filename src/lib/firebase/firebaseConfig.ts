// Helper function to handle Firebase errors
export const handleFirebaseError = (error: any): string => {
  console.error('Firebase error:', error);
  
  // Common Firebase error codes
  switch (error.code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action. Please check your account permissions.';
    case 'unauthenticated':
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.';
    case 'not-found':
      return 'The requested resource was not found.';
    case 'already-exists':
      return 'This resource already exists.';
    case 'resource-exhausted':
      return 'You have reached the limit for this action. Please try again later.';
    case 'failed-precondition':
      return 'The operation failed because the system is not in the required state.';
    case 'cancelled':
      return 'The operation was cancelled.';
    default:
      return error.message || 'An unknown error occurred. Please try again.';
  }
};

// Function to check if user has permission for a specific action
export const checkPermission = async (
  collection: string, 
  docId: string, 
  action: 'read' | 'write' | 'update' | 'delete'
): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    // For read permissions, try to get the document
    if (action === 'read') {
      const docRef = doc(db, collection, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    }
    
    // For write/update/delete, we can't easily check permissions beforehand
    // Instead, we'll rely on the Firebase rules to enforce permissions
    // and handle any errors that occur during the operation
    return true;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}; 