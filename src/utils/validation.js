export const FIELD_ORDER = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'email',
  'addressStreet',
  'addressCity',
  'addressState',
  'addressPostalCode',
  'addressCountry',
  'nationality',
  'preferredLanguage',
  'resumeFileName',
];

const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]*$/;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const LINKEDIN_PATTERN = /^https?:\/\/www\.linkedin\.com\/in\/[A-Za-z0-9-]+\/?$/i;

const PHONE_PATTERNS = {
  '+1': [
    /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    /^\d{10}$/,
  ],
  '+44': [
    /^\(?\d{2,5}\)?[-.\s]?\d{4,6}[-.\s]?\d{4}$/,
    /^\d{10,11}$/,
  ],
};

const normalizePhoneValue = (value = '') => String(value).replace(/\s+/g, ' ').trim();

export const validateEmail = (value = '') => {
  const trimmed = String(value).trim();

  if (!trimmed) return 'Please enter your email address.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Please enter a valid email address.';

  return '';
};

export const validatePhone = (value = '', countryCode = '+1') => {
  const trimmed = normalizePhoneValue(value);

  if (!trimmed) return 'Please enter your phone number.';

  const patterns = PHONE_PATTERNS[countryCode] || PHONE_PATTERNS['+1'];
  const isValid = patterns.some((pattern) => pattern.test(trimmed));

  if (!isValid) {
    if (countryCode === '+44') {
      return 'Please enter a valid UK phone number.';
    }

    return 'Please enter a valid U.S. phone number.';
  }

  return '';
};

export const validateField = (fieldName, value = '', formData = {}) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';

  switch (fieldName) {
    case 'firstName':
      if (!trimmed) return 'Please enter your first name.';
      if (trimmed.length < 2) return 'Name must be at least 2 characters.';
      if (!NAME_PATTERN.test(trimmed)) return 'Name can only contain letters, spaces, and hyphens.';
      return '';

    case 'lastName':
      if (!trimmed) return 'Please enter your last name.';
      if (trimmed.length < 2) return 'Name must be at least 2 characters.';
      if (!NAME_PATTERN.test(trimmed)) return 'Name can only contain letters, spaces, and hyphens.';
      return '';

    case 'dateOfBirth':
      if (!trimmed) return 'Please enter your date of birth.';
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return 'Please enter a valid date in MM/DD/YYYY format.';

      const [month, day, year] = trimmed.split('/').map(Number);
      const date = new Date(year, month - 1, day);

      if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return 'Please enter a valid date in MM/DD/YYYY format.';
      }

      const today = new Date();
      let age = today.getFullYear() - year;
      const monthDiff = today.getMonth() - (month - 1);

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
        age -= 1;
      }

      if (age < 0 || age > 120) {
        return 'Please enter an age between 0 and 120 years.';
      }

      return '';

    case 'gender':
      if (!trimmed || trimmed === 'Select gender') return 'Please select your gender.';
      return '';

    case 'email':
      return validateEmail(value);

    case 'phone':
      return validatePhone(value, formData.phoneCountryCode || '+1');

    case 'phoneNumber':
      if (formData.hasUSPhone === 'no') return '';
      return validatePhone(value, formData.phoneCountryCode || '+1');

    case 'hasLinkedin':
      if (!trimmed) return 'Please select yes or no.';
      return '';

    case 'hasUSPhone':
      if (!trimmed) return 'Please select yes or no.';
      return '';

    case 'addressCountry':
      if (!trimmed || trimmed === 'Select country') return 'Please select your country.';
      return '';

    case 'nationality':
      if (!trimmed || trimmed === 'Select nationality') return 'Please select your nationality.';
      return '';

    case 'preferredLanguage':
      if (!trimmed || trimmed === 'Select language') return 'Please select your preferred language.';
      return '';

    case 'addressStreet':
    case 'addressCity':
    case 'addressState':
    case 'addressPostalCode':
    case 'resumeFileName':
      if (!trimmed) return 'This field is required.';
      return '';

    case 'linkedinUrl':
      if (formData.hasLinkedin === 'no') return '';
      if (!trimmed) return 'Please enter your LinkedIn profile URL.';
      if (!LINKEDIN_PATTERN.test(trimmed)) return 'Please enter a valid date in https://www.linkedin.com/in/[your-name] format.';
      return '';

    case 'graduationDate':
      if (!trimmed) return 'Please enter your graduation date.';
      if (!/^\d{2}\/\d{4}$/.test(trimmed)) return 'Please enter a valid date in MM/YYYY format.';

      const [graduationMonth, graduationYear] = trimmed.split('/').map(Number);
      if (
        graduationMonth < 1 ||
        graduationMonth > 12 ||
        String(graduationYear).length !== 4
      ) {
        return 'Please enter a valid date in MM/YYYY format.';
      }

      return '';

    default:
      return '';
  }
};

export const validateForm = (formData = {}) => {
  const errors = {};

  const fieldsToValidate = [
    ...FIELD_ORDER,
    'hasLinkedin',
    'hasUSPhone',
  ];

  if (formData.hasUSPhone === 'yes') {
    fieldsToValidate.push('phoneNumber');
  }

  if (formData.hasLinkedin === 'yes') {
    fieldsToValidate.push('linkedinUrl');
  }

  fieldsToValidate.forEach((fieldName) => {
    errors[fieldName] = validateField(fieldName, formData[fieldName], formData);
  });

  return {
    errors,
    isValid: Object.values(errors).every((error) => !error),
  };
};
