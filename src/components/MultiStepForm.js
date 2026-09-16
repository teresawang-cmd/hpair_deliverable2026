import React, { useState, useEffect, useRef } from 'react';
import PersonalInfoStep from './steps/PersonalInfoStep';
import { submitForm, getFormSubmissions } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/authService';
import { validateField, validateForm, FIELD_ORDER } from '../utils/validation';

const DRAFT_STORAGE_KEY = 'personalInformationFormDraft';

const submitFormData = async ({ formData, userId, refreshSubmissions, resetForm }) => {
  try {
    // Submission is only attempted after the existing validation gate passes.
    const submissionData = {
      ...formData,
      userId,
    };

    const result = await submitForm(submissionData);

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to submit form. Please try again.',
      };
    }

    // Refresh is helpful for the user's history, but it must not block a successful submission.
    if (typeof refreshSubmissions === 'function') {
      await Promise.race([
        refreshSubmissions().catch(error => {
          console.error('Submission history refresh failed:', error);
        }),
        new Promise(resolve => setTimeout(resolve, 5000)),
      ]);
    }

    if (typeof resetForm === 'function') {
      resetForm();
    }

    return {
      success: true,
      message: result.message || 'Form submitted successfully!',
    };
  } catch (error) {
    console.error('Submit flow error:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
};

const MultiStepForm = () => {
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const { user, userId } = useAuth();
  const fieldRefs = useRef({});
  const debounceTimers = useRef({});

  const runValidation = (fieldName, value, shouldTouch = true) => {
    if (shouldTouch) {
      setTouched(prev => ({ ...prev, [fieldName]: true }));
    }

    const error = validateField(fieldName, value, { ...formData, [fieldName]: value });
    setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
    return error;
  };

  const handleFieldChange = (fieldName, value) => {
    if (['firstName', 'lastName'].includes(fieldName)) {
      if (debounceTimers.current[fieldName]) {
        clearTimeout(debounceTimers.current[fieldName]);
      }

      debounceTimers.current[fieldName] = setTimeout(() => {
        runValidation(fieldName, value, true);
      }, 300);
      return;
    }

    runValidation(fieldName, value, true);
  };

  const handleFieldBlur = (fieldName, value) => {
    if (['firstName', 'lastName'].includes(fieldName) && debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
    }

    runValidation(fieldName, value, true);
  };

  const handleLogout = async () => {
    await signOutUser();
  };

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Load user's submissions
  useEffect(() => {
    loadSubmissions();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    try {
      const savedDraft = window.localStorage.getItem(`${DRAFT_STORAGE_KEY}:${userId}`);
      if (savedDraft) {
        setFormData(JSON.parse(savedDraft));
        setSaveMessage('Saved progress restored.');
      }
    } catch (error) {
      console.error('Unable to restore saved progress:', error);
    }
  }, [userId]);

  const handleSaveProgress = () => {
    try {
      const draftData = { ...formData };
      delete draftData.resumeFileNameFile;
      delete draftData.portfolioFileNameFile;

      window.localStorage.setItem(
        `${DRAFT_STORAGE_KEY}:${userId}`,
        JSON.stringify(draftData)
      );
      setSaveMessage('Progress saved successfully.');
    } catch (error) {
      console.error('Unable to save progress:', error);
      setSaveMessage('Unable to save progress. Please try again.');
    }
  };

  const loadSubmissions = async () => {
    try {
      const submissionsResult = await getFormSubmissions();

      if (submissionsResult.success) {
        const userSubmissions = submissionsResult.data.filter(
          submission => submission.userId === userId
        );
        setSubmissions(userSubmissions);
      } else {
        setError(submissionsResult.message);
      }

    } catch (err) {
      setError('Failed to load submissions');
      console.error('Error loading submissions:', err);
    }
  };

  const focusFirstInvalidField = (errors) => {
    const invalidField = FIELD_ORDER.find(field => !!errors[field]);

    if (invalidField && fieldRefs.current[invalidField]) {
      fieldRefs.current[invalidField].focus();
      fieldRefs.current[invalidField].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Keep the existing validation gate exactly as-is and block submission when invalid.
    const validationResult = validateForm(formData);
    const nextErrors = validationResult.errors;

    setValidationErrors(nextErrors);
    setTouched(Object.fromEntries(FIELD_ORDER.map(fieldName => [fieldName, true])));

    if (!validationResult.isValid) {
      setSubmitMessage('Error. Required information missing.');
      focusFirstInvalidField(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const result = await submitFormData({
        formData,
        userId,
        refreshSubmissions: loadSubmissions,
        resetForm: () => {
          setFormData({});
          setValidationErrors({});
          setTouched({});
          setSaveMessage('');
          window.localStorage.removeItem(`${DRAFT_STORAGE_KEY}:${userId}`);
        },
      });

      setSubmitMessage(result.message);
      if (!result.success) {
        setError(result.message);
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitMessage('An error occurred. Please try again.');
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Personal Information Form</h1>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            Logout
          </button>
        </div>
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Logged in as:</strong> {user.email}
        </div>

        <p>Please provide your basic personal details.</p>

        <form onSubmit={handleSubmit} noValidate>
          <PersonalInfoStep
            formData={formData}
            setFormData={setFormData}
            errors={validationErrors}
            touched={touched}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
            fieldRefs={fieldRefs}
          />

          {submitMessage && (
            <div className={`submit-message ${submitMessage.includes('successfully') ? 'success' : 'error'}`}>
              {submitMessage}
            </div>
          )}

          {saveMessage && (
            <div className={`submit-message ${saveMessage.includes('successfully') || saveMessage.includes('restored') ? 'success' : 'error'}`}>
              {saveMessage}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveProgress}
            >
              Save progress
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '2px solid #e0e0e0' }}>
          <h2>Your Form Submissions</h2>
          <p>View all your submitted forms below.</p>

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <p><strong>Logged in as:</strong> {user.email}</p>
            <p><strong>Your submissions:</strong> {submissions.length}</p>
          </div>

          {error && (
            <div className="submit-message error">
              {error}
            </div>
          )}

          <button
            onClick={loadSubmissions}
            className="btn btn-primary"
            style={{ marginBottom: '20px' }}
          >
            Refresh
          </button>

        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;
