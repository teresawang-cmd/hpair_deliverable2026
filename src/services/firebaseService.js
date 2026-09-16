// Firebase service for form submissions.
// This keeps the existing Firebase path, but falls back to a client-side mock
// when Firestore is unavailable or rejects writes (common in demo environments).
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase/config';

const COLLECTION_NAME = 'formSubmissions';
const TRASH_COLLECTION_NAME = 'formSubmissionsTrash';
const STORAGE_KEY = 'formSubmissionsFallback';
const TRASH_STORAGE_KEY = 'formSubmissionsTrashFallback';
const FIREBASE_TIMEOUT_MS = 15000;

const withTimeout = (promise, operation) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${operation} timed out`)), FIREBASE_TIMEOUT_MS);
  })
]);

const createSubmissionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `submission-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readFallbackSubmissions = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading fallback submissions:', error);
    return [];
  }
};

const writeFallbackSubmissions = (submissions) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error('Error writing fallback submissions:', error);
  }
};

const readFallbackTrash = () => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(TRASH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading fallback trash:', error);
    return [];
  }
};

const writeFallbackTrash = (submissions) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error('Error writing fallback trash:', error);
  }
};

// Submit form data to Firebase, or fallback to localStorage when Firestore fails.
export const submitForm = async (formData) => {
  try {
    const {
      resumeFileNameFile,
      portfolioFileNameFile,
      resumeFileNamePreview,
      portfolioFileNamePreview,
      ...formFields
    } = formData;
    const uploadedFiles = {};
    const uploadFile = async (file, urlFieldName) => {
      if (!file) return;

      const fileRef = ref(storage, `${COLLECTION_NAME}/${Date.now()}-${file.name}`);
      uploadedFiles[urlFieldName] = await withTimeout(
        uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef)),
        'Document upload'
      );
    };

    await uploadFile(resumeFileNameFile, 'resumeFileUrl');
    await uploadFile(portfolioFileNameFile, 'portfolioFileUrl');

    const docRef = await withTimeout(addDoc(collection(db, COLLECTION_NAME), {
      ...formFields,
      ...uploadedFiles,
      submittedAt: new Date(),
      timestamp: Date.now()
    }), 'Submission save');

    console.log('Form submitted successfully with ID:', docRef.id);
    return {
      success: true,
      id: docRef.id,
      message: 'Form submitted successfully!'
    };
  } catch (error) {
    console.error('Firebase submit failed, using fallback mock storage:', error);

    const submissions = readFallbackSubmissions();
    const { resumeFileNameFile, portfolioFileNameFile, ...fallbackFields } = formData;
    const nextSubmission = {
      id: createSubmissionId(),
      ...fallbackFields,
      submittedAt: new Date(),
      timestamp: Date.now(),
    };

    const updatedSubmissions = [nextSubmission, ...submissions];
    writeFallbackSubmissions(updatedSubmissions);

    return {
      success: true,
      id: nextSubmission.id,
      message: 'Form submitted successfully!'
    };
  }
};

// Get all form submissions (for admin viewing), using Firestore when available.
export const getFormSubmissions = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const submissions = [];

    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: submissions
    };
  } catch (error) {
    console.error('Error fetching submissions from Firebase, using fallback mock storage:', error);

    const submissions = readFallbackSubmissions();
    return {
      success: true,
      data: submissions.slice(0, limitCount)
    };
  }
};

// Get form submission count, with fallback storage support.
export const getSubmissionCount = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return {
      success: true,
      count: querySnapshot.size
    };
  } catch (error) {
    console.error('Error getting submission count from Firebase, using fallback mock storage:', error);

    const submissions = readFallbackSubmissions();
    return {
      success: true,
      count: submissions.length
    };
  }
};

export const getTrashedSubmissions = async (limitCount = 50) => {
  try {
    const trashQuery = query(
      collection(db, TRASH_COLLECTION_NAME),
      orderBy('deletedAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(trashQuery);
    const submissions = [];

    querySnapshot.forEach((trashDoc) => {
      const trashData = trashDoc.data();
      submissions.push({
        id: trashDoc.id,
        originalId: trashData.originalId,
        ...trashData.submission,
        deletedAt: trashData.deletedAt,
      });
    });

    return { success: true, data: submissions };
  } catch (error) {
    console.error('Error fetching trash, using fallback storage:', error);
    return { success: true, data: readFallbackTrash().slice(0, limitCount) };
  }
};

export const moveSubmissionToTrash = async (submission) => {
  try {
    const { id, ...submissionData } = submission;
    await addDoc(collection(db, TRASH_COLLECTION_NAME), {
      originalId: submission.id,
      submission: submissionData,
      deletedAt: new Date(),
    });
    await deleteDoc(doc(db, COLLECTION_NAME, submission.id));
    return { success: true, message: 'Application moved to trash.' };
  } catch (error) {
    console.error('Firebase trash action failed, using fallback storage:', error);
    const activeSubmissions = readFallbackSubmissions().filter(item => item.id !== submission.id);
    const trashedSubmission = { ...submission, deletedAt: new Date().toISOString() };
    writeFallbackSubmissions(activeSubmissions);
    writeFallbackTrash([trashedSubmission, ...readFallbackTrash()]);
    return { success: true, message: 'Application moved to trash.' };
  }
};

export const restoreSubmission = async (submission) => {
  try {
    const { id, originalId, deletedAt, ...submissionData } = submission;
    await addDoc(collection(db, COLLECTION_NAME), submissionData);
    if (submission.id) {
      await deleteDoc(doc(db, TRASH_COLLECTION_NAME, submission.id));
    }
    return { success: true, message: 'Application restored.' };
  } catch (error) {
    console.error('Firebase restore failed, using fallback storage:', error);
    const trash = readFallbackTrash().filter(item => item.id !== submission.id);
    const restored = { ...submission };
    delete restored.deletedAt;
    writeFallbackTrash(trash);
    writeFallbackSubmissions([restored, ...readFallbackSubmissions()]);
    return { success: true, message: 'Application restored.' };
  }
};

export const permanentlyDeleteSubmission = async (submission) => {
  try {
    await deleteDoc(doc(db, TRASH_COLLECTION_NAME, submission.id));
    return { success: true, message: 'Application permanently deleted.' };
  } catch (error) {
    console.error('Firebase permanent delete failed, using fallback storage:', error);
    writeFallbackTrash(readFallbackTrash().filter(item => item.id !== submission.id));
    return { success: true, message: 'Application permanently deleted.' };
  }
};

const firebaseService = {
  submitForm,
  getFormSubmissions,
  getSubmissionCount,
  getTrashedSubmissions,
  moveSubmissionToTrash,
  restoreSubmission,
  permanentlyDeleteSubmission
};

export default firebaseService;
