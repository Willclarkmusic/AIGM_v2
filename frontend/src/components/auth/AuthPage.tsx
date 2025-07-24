import React, { useState } from 'react';
import { MessageCircle, Users, Zap, Globe, Shield, Heart } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import OAuthButtons from './OAuthButtons';
import { APP_NAME } from '../../utils/constants';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative min-h-screen flex">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 text-white flex-col justify-center">
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 mr-4">
                <MessageCircle className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{APP_NAME}</h1>
                <p className="text-blue-100 text-lg">AI Generative Messaging</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-6 leading-tight">
              Connect, Create, and Collaborate in Real-time
            </h2>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Experience the future of messaging with AI-powered conversations, 
              rich media sharing, and seamless collaboration tools.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-2 mr-4">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-blue-50">Real-time messaging with AI assistance</span>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-2 mr-4">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-blue-50">Rich friend system and communities</span>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-2 mr-4">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-blue-50">Secure and private conversations</span>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-2 mr-4">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-blue-50">Cross-platform accessibility</span>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/20">
              <p className="text-sm text-blue-100 flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                Built with love for seamless communication
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-600 rounded-2xl p-3 mr-3">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {APP_NAME}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    AI Generative Messaging
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-white/20 dark:border-gray-700/50">
              {mode === 'login' ? (
                <LoginForm onSwitchToSignup={() => setMode('signup')} />
              ) : (
                <SignupForm onSwitchToLogin={() => setMode('login')} />
              )}

              <div className="mt-6">
                <OAuthButtons />
              </div>
            </div>

            {/* Terms */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                By continuing, you agree to our{' '}
                <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;