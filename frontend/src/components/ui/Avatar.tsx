import React from 'react';
import { User } from 'lucide-react';
import { getInitials } from '../../utils/formatters';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'idle' | 'away' | 'offline';
  statusColor?: string;
  showStatus?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  status = 'offline',
  statusColor,
  showStatus = false,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  };
  
  const statusSizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
    xl: 'h-4 w-4',
  };
  
  const statusColors = {
    online: '#22c55e',
    idle: '#f59e0b',
    away: '#ef4444',
    offline: '#6b7280',
  };
  
  const initials = name ? getInitials(name) : '';
  const avatarClasses = `${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 ${textSizeClasses[size]} font-medium overflow-hidden ${className}`;
  
  return (
    <div className="relative inline-block">
      <div className={avatarClasses}>
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Hide the image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <User className={`${size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />
        )}
      </div>
      
      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full border-2 border-white dark:border-gray-800`}
          style={{
            backgroundColor: statusColor || statusColors[status],
          }}
        />
      )}
    </div>
  );
};

export default Avatar;