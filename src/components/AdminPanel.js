import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFormSubmissions,
  getSubmissionCount,
  getTrashedSubmissions,
  moveSubmissionToTrash,
  permanentlyDeleteSubmission,
  restoreSubmission,
} from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/authService';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [trashedSubmissions, setTrashedSubmissions] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const { adminUser, logoutAdmin } = useAuth();

  const handleLogout = async () => {
    await signOutUser();
    logoutAdmin();
    navigate('/');
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const [submissionsResult, countResult] = await Promise.all([
        getFormSubmissions(),
        getSubmissionCount()
      ]);

      if (submissionsResult.success) {
        setSubmissions(submissionsResult.data);
      } else {
        setError(submissionsResult.message);
      }

      if (countResult.success) {
        setSubmissionCount(countResult.count);
      }
    } catch (err) {
      setError('Failed to load submissions');
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrash = async () => {
    const result = await getTrashedSubmissions();
    if (result.success) {
      setTrashedSubmissions(result.data);
    }
  };

  useEffect(() => {
    loadSubmissions();
    loadTrash();
  }, []);

  const handleMoveToTrash = async (submission) => {
    if (!window.confirm(`Move ${submission.firstName || 'this'} application to trash?`)) return;

    const result = await moveSubmissionToTrash(submission);
    if (result.success) {
      setSubmissions(previous => previous.filter(item => item.id !== submission.id));
      setSubmissionCount(count => Math.max(0, count - 1));
      setSelectedSubmission(null);
      await loadTrash();
    } else {
      setError(result.message);
    }
  };

  const handleRestore = async (submission) => {
    const result = await restoreSubmission(submission);
    if (result.success) {
      setTrashedSubmissions(previous => previous.filter(item => item.id !== submission.id));
      await loadSubmissions();
    } else {
      setError(result.message);
    }
  };

  const handlePermanentDelete = async (submission) => {
    if (!window.confirm(`Permanently delete ${submission.firstName || 'this'} application? This cannot be undone.`)) return;

    const result = await permanentlyDeleteSubmission(submission);
    if (result.success) {
      setTrashedSubmissions(previous => previous.filter(item => item.id !== submission.id));
      setSelectedSubmission(null);
    } else {
      setError(result.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleString();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
    return new Date(timestamp).toLocaleString();
  };

  const displayValue = (value) => value || 'Not provided';

  const filteredSubmissions = submissions.filter((submission) => {
    const applicantName = `${submission.firstName || ''} ${submission.lastName || ''}`.toLowerCase();
    return applicantName.includes(searchQuery.trim().toLowerCase());
  });

  const detail = (label, value) => (
    <div className="submission-detail-row" key={label}>
      <dt>{label}</dt>
      <dd>{displayValue(value)}</dd>
    </div>
  );

  const renderDocument = (label, fileName, fileUrl, previewUrl) => (
    <div className="document-preview" key={label}>
      <strong>{label}</strong>
      {fileName ? <p>{fileName}</p> : <p>Not provided</p>}
      {(fileUrl || previewUrl) && (
        fileName?.toLowerCase().endsWith('.pdf') && (
          <iframe title={`${label} preview`} src={fileUrl || previewUrl} className="document-frame" />
        )
      )}
    </div>
  );

  const renderDetails = (submission) => {
    const address = [
      submission.addressStreet,
      submission.addressCity,
      submission.addressState,
      submission.addressPostalCode,
      submission.addressCountry,
    ].filter(Boolean).join(', ');

    return (
      <section className="submission-detail-panel" aria-label="Application details">
        <div className="submission-detail-heading">
          <div>
            <p className="submission-eyebrow">Application details</p>
            <h2>{displayValue(submission.firstName)} {displayValue(submission.lastName)}</h2>
            <p>Submitted {formatDate(submission.submittedAt || submission.timestamp)}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>
            Close details
          </button>
        </div>

        <div className="submission-detail-grid">
          <section>
            <h3>Applicant</h3>
            <dl>
              {detail('First name', submission.firstName)}
              {detail('Last name', submission.lastName)}
              {detail('Email', submission.email)}
              {detail('Date of birth', submission.dateOfBirth)}
              {detail('Gender', submission.gender)}
            </dl>
          </section>

          <section>
            <h3>Contact and address</h3>
            <dl>
              {detail('Phone number', submission.phoneNumber)}
              {detail('Full address', address)}
              {detail('Street address', submission.addressStreet)}
              {detail('City', submission.addressCity)}
              {detail('State / Province', submission.addressState)}
              {detail('Postal code', submission.addressPostalCode)}
              {detail('Country', submission.addressCountry)}
            </dl>
          </section>

          <section>
            <h3>Profile</h3>
            <dl>
              {detail('Nationality', submission.nationality)}
              {detail('LinkedIn URL', submission.linkedinUrl)}
              {detail('Preferred language', submission.preferredLanguage)}
            </dl>
          </section>

          <section>
            <h3>Education</h3>
            <dl>
              {detail('School(s) attended', submission.schoolName)}
              {detail('Degree or diploma', submission.degreeEarned)}
              {detail('Graduation date', submission.graduationDate)}
            </dl>
          </section>

          <section className="submission-documents">
            <h3>Documents</h3>
            <div className="document-grid">
              {renderDocument('CV / Resume', submission.resumeFileName, submission.resumeFileUrl, submission.resumeFileNamePreview)}
              {renderDocument('Portfolio submission', submission.portfolioFileName, submission.portfolioFileUrl, submission.portfolioFileNamePreview)}
            </div>
          </section>
        </div>
      </section>
    );
  };

  if (loading) {
    return <div className="container"><div className="form-container"><h2>Loading submissions...</h2></div></div>;
  }

  return (
    <div className="container admin-container">
      <div className="form-container admin-form-container">
        <div className="admin-panel-header">
          <h1>Admin Panel - All Submissions</h1>
          <div className="admin-panel-actions">
            <button type="button" onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </div>
        </div>

        <div className="admin-summary">
          <p><strong>Logged in as:</strong> {adminUser?.username || 'Admin'}</p>
          <p><strong>Total submissions:</strong> {submissionCount}</p>
          <p><strong>Showing all submissions from all users</strong></p>
        </div>

        {error && <div className="submit-message error">{error}</div>}
        <div className="admin-list-toolbar">
          {!showTrash && (
            <div className="admin-list-controls">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="form-input"
                placeholder="Search applicants by name"
                aria-label="Search applicants by name"
              />
              <button type="button" onClick={loadSubmissions} className="btn btn-primary admin-refresh">Refresh</button>
            </div>
          )}
          <button type="button" className="btn btn-trash" onClick={() => {
            setShowTrash(previous => !previous);
            setSelectedSubmission(null);
          }}>
            {showTrash ? 'Back to submissions' : `Trash (${trashedSubmissions.length})`}
          </button>
        </div>

        {selectedSubmission ? renderDetails(selectedSubmission) : showTrash ? (
          trashedSubmissions.length === 0 ? (
            <p>Trash is empty.</p>
          ) : (
            <div className="submissions-list" aria-label="Trashed applications">
              {trashedSubmissions.map((submission) => (
                <div className="submission-row" key={submission.id}>
                  <button type="button" className="submission-item" onClick={() => setSelectedSubmission(submission)}>
                    <span className="submission-header">
                      <span><strong>{displayValue(submission.firstName)} {displayValue(submission.lastName)}</strong></span>
                      <span className="submission-date">Deleted {formatDate(submission.deletedAt)}</span>
                    </span>
                    <span className="submission-summary">{displayValue(submission.email)}<span>View application -&gt;</span></span>
                  </button>
                  <div className="trash-actions">
                    <button type="button" className="btn btn-restore" onClick={() => handleRestore(submission)}>Restore</button>
                    <button type="button" className="btn btn-danger" onClick={() => handlePermanentDelete(submission)}>Delete permanently</button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          submissions.length === 0 ? (
            <p>No submissions yet.</p>
          ) : filteredSubmissions.length === 0 ? (
            <p>No applicants match "{searchQuery}".</p>
          ) : (
            <div className="submissions-list" aria-label="Submitted applications">
              {filteredSubmissions.map((submission) => (
                <div className="submission-row" key={submission.id}>
                  <button type="button" className="submission-item" onClick={() => setSelectedSubmission(submission)}>
                  <span className="submission-header">
                    <span>
                      <strong>{displayValue(submission.firstName)} {displayValue(submission.lastName)}</strong>
                    </span>
                    <span className="submission-date">{formatDate(submission.submittedAt || submission.timestamp)}</span>
                  </span>
                  <span className="submission-summary">
                    {displayValue(submission.email)}
                    <span>View full application -&gt;</span>
                  </span>
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => handleMoveToTrash(submission)}>Delete</button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
