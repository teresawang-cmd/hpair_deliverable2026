import { validateField, validateForm } from './validation';

describe('validation utilities', () => {
  test('validates first and last names with the expected rules', () => {
    expect(validateField('firstName', '')).toBe('Please enter your first name.');
    expect(validateField('firstName', 'A')).toBe('Name must be at least 2 characters.');
    expect(validateField('firstName', 'Mary-Jane')).toBe('');
    expect(validateField('lastName', 'O\'Neill')).toBe('');
    expect(validateField('lastName', '123')).toBe('Name can only contain letters, spaces, and hyphens.');
  });

  test('validates date of birth within a reasonable age range', () => {
    const currentYear = new Date().getFullYear();
    const futureDate = `01/01/${currentYear + 1}`;

    expect(validateField('dateOfBirth', '')).toBe('Please enter your date of birth.');
    expect(validateField('dateOfBirth', futureDate)).toBe('Please enter an age between 0 and 120 years.');
    expect(validateField('dateOfBirth', `01/01/${currentYear - 5}`)).toBe('');
  });

  test('validates phone numbers according to the selected country code', () => {
    expect(validateField('phoneNumber', '(415) 555-0123', { phoneCountryCode: '+1' })).toBe('');
    expect(validateField('phoneNumber', '4155550123', { phoneCountryCode: '+1' })).toBe('');
    expect(validateField('phoneNumber', '020 7946 0958', { phoneCountryCode: '+44' })).toBe('');
    expect(validateField('phoneNumber', '12345', { phoneCountryCode: '+44' })).toBe('Please enter a valid UK phone number.');
  });

  test('validates LinkedIn profile URLs in the expected format', () => {
    expect(validateField('linkedinUrl', 'https://www.linkedin.com/in/john-doe')).toBe('');
    expect(validateField('linkedinUrl', 'https://example.com')).toBe('Please enter a valid date in https://www.linkedin.com/in/[your-name] format.');
  });

  test('validates graduation dates in MM/YYYY format', () => {
    expect(validateField('graduationDate', '05/2022')).toBe('');
    expect(validateField('graduationDate', '2022')).toBe('Please enter a valid date in MM/YYYY format.');
  });

  test('validates the full form state', () => {
    const result = validateForm({
      firstName: 'A',
      lastName: 'Smith',
      dateOfBirth: '01/01/1990',
      gender: 'female',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toBe('Name must be at least 2 characters.');
  });

  test('requires a CV or resume before submission', () => {
    const result = validateForm({
      firstName: 'Teresa',
      lastName: 'Wang',
      dateOfBirth: '01/01/1990',
      gender: 'Female',
      phoneNumber: '4155550123',
      email: 'teresa@example.com',
      addressStreet: '123 Main Street',
      addressCity: 'Boston',
      addressState: 'MA',
      addressPostalCode: '02108',
      addressCountry: 'United States',
      nationality: 'American',
      linkedinUrl: 'https://www.linkedin.com/in/teresa-wang',
      preferredLanguage: 'English',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.resumeFileName).toBe('This field is required.');
  });

  test('requires LinkedIn URL only when the user has LinkedIn', () => {
    const baseForm = {
      firstName: 'Teresa',
      lastName: 'Wang',
      dateOfBirth: '01/01/1990',
      gender: 'Female',
      hasUSPhone: 'no',
      email: 'teresa@example.com',
      addressStreet: '123 Main Street',
      addressCity: 'Boston',
      addressState: 'MA',
      addressPostalCode: '02108',
      addressCountry: 'United States',
      hasLinkedin: 'no',
      nationality: 'American',
      preferredLanguage: 'English',
      resumeFileName: 'resume.pdf',
    };

    expect(validateForm(baseForm).isValid).toBe(true);
    expect(validateForm({ ...baseForm, hasLinkedin: 'yes' }).errors.linkedinUrl).toBe('Please enter your LinkedIn profile URL.');
  });

  test('requires a phone number only for users with a U.S. phone', () => {
    expect(validateField('phoneNumber', '', { hasUSPhone: 'no' })).toBe('');
    expect(validateField('phoneNumber', '', { hasUSPhone: 'yes' })).toBe('Please enter your phone number.');
  });
});
