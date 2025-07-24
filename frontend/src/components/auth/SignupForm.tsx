import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import type { SignupCredentials } from '../../types/auth';
import { formatUsername } from '../../utils/formatters';
import { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH, MIN_DISPLAY_NAME_LENGTH, MAX_DISPLAY_NAME_LENGTH } from '../../utils/constants';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const { signUp, loading } = useAuth();
  const [credentials, setCredentials] = useState<SignupCredentials>({
    email: '',
    password: '',
    username: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignupCredentials>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const levels = [
      { label: 'Very weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-green-500' },
    ];

    return { strength, ...levels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength(credentials.password);

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupCredentials> = {};

    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!credentials.username) {
      newErrors.username = 'Username is required';
    } else if (credentials.username.length < MIN_USERNAME_LENGTH) {
      newErrors.username = `Username must be at least ${MIN_USERNAME_LENGTH} characters`;
    } else if (credentials.username.length > MAX_USERNAME_LENGTH) {
      newErrors.username = `Username must be less than ${MAX_USERNAME_LENGTH} characters`;
    } else if (!/^[a-zA-Z0-9_]+$/.test(credentials.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (credentials.displayName && credentials.displayName.length < MIN_DISPLAY_NAME_LENGTH) {
      newErrors.displayName = `Display name must be at least ${MIN_DISPLAY_NAME_LENGTH} character`;
    } else if (credentials.displayName && credentials.displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      newErrors.displayName = `Display name must be less than ${MAX_DISPLAY_NAME_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!acceptTerms) {
      setGeneralError('You must accept the Terms of Service to continue');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await signUp(credentials);
    } catch (error: any) {
      setGeneralError(error.message || 'Failed to create account');
    }
  };

  const handleChange = (field: keyof SignupCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value;
    
    // Format username as they type
    if (field === 'username') {
      value = formatUsername(value);
    }

    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors as user types
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create your account
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Join AIGM and start connecting
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email address"
          icon={Mail}
          value={credentials.email}
          onChange={handleChange('email')}
          placeholder="Enter your email"
          error={errors.email}
          required
          disabled={loading}
          variant="filled"
        />

        <Input
          type="text"
          label="Username"
          icon={User}
          value={credentials.username}
          onChange={handleChange('username')}
          placeholder="Choose a unique username"
          error={errors.username}
          required
          disabled={loading}
          variant="filled"
        />

        <Input
          type="text"
          label="Display Name (Optional)"
          icon={User}
          value={credentials.displayName || ''}
          onChange={handleChange('displayName')}
          placeholder="How others will see you"
          error={errors.displayName}
          disabled={loading}
          variant="filled"
        />

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password"
            icon={Lock}
            value={credentials.password}
            onChange={handleChange('password')}
            placeholder="Create a strong password"
            error={errors.password}
            required
            disabled={loading}
            variant="filled"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {credentials.password && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${passwordStrength.strength > 2 ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordStrength.label}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
          </div>
          <div className="ml-3">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Privacy Policy
              </button>
            </label>
          </div>
        </div>

        {generalError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              {generalError}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          icon={!loading ? ArrowRight : undefined}
          iconPosition="right"
          className="w-full"
          disabled={!acceptTerms}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
            disabled={loading}
          >
            Sign in instead
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;