import React from 'react';

const countryOptions = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Spain', 'Mexico', 'Brazil', 'Japan', 'China', 'United Arab Emirates', 'South Africa', 'Argentina', 'Italy', 'Netherlands', 'Sweden', 'Nigeria', 'Kenya'
];

const nationalityOptions = [
  'American', 'Argentine', 'Australian', 'Brazilian', 'British', 'Canadian', 'Chinese', 'Dutch', 'Emirati', 'French', 'German', 'Indian', 'Italian', 'Japanese', 'Kenyan', 'Mexican', 'Nigerian', 'South African', 'Spanish', 'Swedish'
];

const languageOptions = ['English', 'Spanish', 'Hindi', 'Chinese', 'Arabic'];

const PersonalInfoStep = ({
  formData,
  setFormData,
  errors,
  touched,
  onFieldChange,
  onFieldBlur,
  fieldRefs,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'hasUSPhone' && value === 'no') {
      setFormData(prev => ({
        ...prev,
        phoneNumber: '',
        phoneCountryCode: '',
      }));
    }

    onFieldChange?.(name, value);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const selectedFile = files && files[0] ? files[0] : null;
    const fileName = selectedFile ? selectedFile.name : '';

    setFormData(prev => ({
      ...prev,
      [name]: fileName,
      [`${name}File`]: selectedFile,
    }));

    onFieldChange?.(name, fileName);

    if (selectedFile?.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          [`${name}Preview`]: reader.result,
        }));
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    onFieldBlur?.(name, value);
    fieldRefs?.current?.[name]?.blur?.();
  };

  const renderInput = (fieldName, label, config = {}) => {
    const value = formData[fieldName] || '';
    const isTouched = Boolean(touched[fieldName]);
    const hasError = Boolean(errors[fieldName]);
    const isValid = isTouched && !hasError && value;

    return (
      <div className="form-group" key={fieldName}>
        <label className="form-label">{label}</label>
        {config.type === 'select' ? (
          <select
            ref={(node) => {
              if (fieldRefs && fieldRefs.current) {
                fieldRefs.current[fieldName] = node;
              }
            }}
            name={fieldName}
            value={value}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`form-input ${hasError ? 'input-error' : ''} ${isValid ? 'input-success' : ''}`}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${fieldName}-error` : undefined}
            required={config.required}
          >
            {config.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <div className="input-with-status">
            <input
              ref={(node) => {
                if (fieldRefs && fieldRefs.current) {
                  fieldRefs.current[fieldName] = node;
                }
              }}
              type={config.type}
              name={fieldName}
              value={value}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`form-input ${hasError ? 'input-error' : ''} ${isValid ? 'input-success' : ''}`}
              placeholder={config.placeholder}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${fieldName}-error` : undefined}
              required={config.required}
              accept={config.accept}
              minLength={config.minLength}
              maxLength={config.maxLength}
            />
            {isValid && <span className="field-status success" aria-label="valid">✓</span>}
          </div>
        )}

        {isTouched && hasError && (
          <div id={`${fieldName}-error`} className="form-error" role="alert">
            {errors[fieldName]}
          </div>
        )}
      </div>
    );
  };

  const renderFileUpload = (fieldName, label, config = {}) => {
    const selectedFile = formData[fieldName] || '';
    const isTouched = Boolean(touched[fieldName]);
    const hasError = Boolean(errors[fieldName]);

    return (
      <div className="form-group" key={fieldName}>
        <label className="form-label">{label}</label>
        <input
          type="file"
          name={fieldName}
          onChange={handleFileChange}
          className={`form-input file-input ${hasError ? 'input-error' : ''}`}
          accept={config.accept}
          required={config.required}
        />
        {selectedFile && (
          <div className="form-file-selected">Selected file: {selectedFile}</div>
        )}
        {isTouched && hasError && (
          <div className="form-error" role="alert">{errors[fieldName]}</div>
        )}
        {config.helpText && <div className="form-help">{config.helpText}</div>}
      </div>
    );
  };

  return (
    <div>
      {renderInput('firstName', 'First Name *', {
        type: 'text',
        placeholder: 'Enter your first name',
      })}

      {renderInput('lastName', 'Last Name *', {
        type: 'text',
        placeholder: 'Enter your last name',
      })}

      {renderInput('dateOfBirth', 'Date of Birth *', {
        type: 'text',
        placeholder: 'MM/DD/YYYY',
      })}

      {renderInput('gender', 'Gender *', {
        type: 'select',
        options: ['Select gender', 'Male', 'Female', 'Other', 'Prefer not to say'],
      })}

      <div className="form-section">
        <h3>Contact Details</h3>

        <div className="conditional-question">
          <span className="form-label">Do you have a U.S. phone number? *</span>
          <div className="radio-options">
            <label>
              <input type="radio" name="hasUSPhone" value="yes" checked={formData.hasUSPhone === 'yes'} onChange={handleInputChange} />
              Yes
            </label>
            <label>
              <input type="radio" name="hasUSPhone" value="no" checked={formData.hasUSPhone === 'no'} onChange={handleInputChange} />
              No
            </label>
          </div>
          {touched.hasUSPhone && errors.hasUSPhone && <div className="form-error" role="alert">{errors.hasUSPhone}</div>}
        </div>

        {formData.hasUSPhone === 'yes' && renderInput('phoneNumber', 'Phone Number *', {
          type: 'tel',
          placeholder: '(555) 123-4567',
          required: true,
        })}

        {formData.hasUSPhone === 'no' && (
          <div className="conditional-notice" role="status">
            You&apos;ll be contacted via email instead.
          </div>
        )}

        {renderInput('email', 'Email Address *', {
          type: 'email',
          placeholder: 'name@example.com',
          required: true,
        })}
      </div>

      <div className="form-section">
        <h3>Address</h3>

        <div className="address-grid">
          <div className="form-group address-full">
            {renderInput('addressStreet', 'Street Address *', {
              type: 'text',
              placeholder: '123 Main Street',
              required: true,
            })}
          </div>

          <div className="address-row">
            {renderInput('addressCity', 'City *', {
              type: 'text',
              placeholder: 'City',
              required: true,
            })}
            {renderInput('addressState', 'State / Province *', {
              type: 'text',
              placeholder: 'State or province',
              required: true,
            })}
          </div>

          <div className="address-row">
            {renderInput('addressPostalCode', 'Postal Code *', {
              type: 'text',
              placeholder: 'Postal code',
              required: true,
            })}
            {renderInput('addressCountry', 'Country *', {
              type: 'select',
              required: true,
              options: ['Select country', ...countryOptions],
            })}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Profile Details</h3>

        <div className="conditional-question">
          <span className="form-label">Do you have a LinkedIn profile? *</span>
          <div className="radio-options">
            <label>
              <input type="radio" name="hasLinkedin" value="yes" checked={formData.hasLinkedin === 'yes'} onChange={handleInputChange} />
              Yes
            </label>
            <label>
              <input type="radio" name="hasLinkedin" value="no" checked={formData.hasLinkedin === 'no'} onChange={handleInputChange} />
              No
            </label>
          </div>
          {touched.hasLinkedin && errors.hasLinkedin && <div className="form-error" role="alert">{errors.hasLinkedin}</div>}
        </div>

        {formData.hasLinkedin === 'yes' && renderInput('linkedinUrl', 'LinkedIn URL *', {
          type: 'url',
          placeholder: 'https://linkedin.com/in/yourname',
          required: true,
        })}

        {renderInput('nationality', 'Nationality *', {
          type: 'select',
          required: true,
          options: ['Select nationality', ...nationalityOptions],
        })}

        {renderInput('preferredLanguage', 'Preferred Language *', {
          type: 'select',
          required: true,
          options: ['Select language', ...languageOptions],
        })}
      </div>

      <div className="form-section">
        <h3>Documents</h3>

        {renderFileUpload('resumeFileName', 'CV / Resume *', {
          accept: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          required: true,
          helpText: 'Accepted formats: PDF, DOC, DOCX. Maximum file size: 5MB.'
        })}

        {renderFileUpload('portfolioFileName', 'Portfolio Submission', {
          accept: '.pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip',
          helpText: 'Optional: upload a portfolio PDF, ZIP, or document.'
        })}
      </div>

      <div className="form-section">
        <h3>Education</h3>

        {renderInput('schoolName', 'School(s) Attended', {
          type: 'text',
          placeholder: 'Example: University of California, Berkeley',
        })}
        {renderInput('degreeEarned', 'Degree or Diploma Earned', {
          type: 'text',
          placeholder: 'Example: Bachelor of Science in Computer Science',
        })}
        {renderInput('graduationDate', 'Graduation Date', {
          type: 'text',
          placeholder: 'MM/YYYY',
        })}
      </div>
    </div>
  );
};

export default PersonalInfoStep;
