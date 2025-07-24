import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'filled';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon: Icon,
      iconPosition = 'left',
      variant = 'default',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    const baseClasses = 'w-full rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = {
      default: 'border-gray-300 bg-transparent focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-transparent dark:focus:border-blue-400 dark:focus:ring-blue-400',
      filled: 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
    };
    
    const errorClasses = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400'
      : '';
    
    const paddingClasses = Icon
      ? iconPosition === 'left'
        ? 'pl-10 pr-3 py-2'
        : 'pl-3 pr-10 py-2'
      : 'px-3 py-2';
    
    const inputClasses = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${paddingClasses} ${className}`;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div
              className={`absolute inset-y-0 ${
                iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'
              } flex items-center pointer-events-none`}
            >
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;