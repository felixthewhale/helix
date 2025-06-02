import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { APP_NAME, MIN_PASSWORD_LENGTH } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { localStorageService } from '../services/localStorageService';

const AuthScreen: React.FC = () => {
  const { unlockApp, state, addNotification, clearAllData } = useAppContext();
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkInitialSetup = () => {
        if (state.isAppLocked && !localStorageService.hasStoredData() && state.isInitialized) {
            setIsRegistering(true);
        }
    };
    if(state.isInitialized){ 
        checkInitialSetup();
    }
  }, [state.isAppLocked, state.isInitialized]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (isRegistering) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        addNotification('error', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
        return;
      }
      if (password !== confirmPassword) {
        addNotification('error', 'Passwords do not match.');
        return;
      }
    }
    
    setIsLoading(true);
    const success = await unlockApp(password);
    setIsLoading(false);

    if (success && isRegistering) {
      // Handled by context
    } 
  };
  
  const handleToggleMode = () => {
    if (!isRegistering && !localStorageService.hasStoredData()) {
        addNotification('info', "No existing wallet found. Please create a new password.");
        setIsRegistering(true); 
        return;
    }
    setIsRegistering(!isRegistering);
    setPassword('');
    setConfirmPassword('');
  };

  const handleClearData = async () => {
    await clearAllData(); 
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-bg p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card-bg rounded-xl shadow-2xl border border-border-color">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-accent-green mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          <h1 className="text-3xl font-bold text-text-primary">{APP_NAME}</h1>
          <p className="mt-2 text-text-secondary">
            {isRegistering ? 'Create a new wallet password' : 'Unlock your wallet'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-input-bg border border-border-color rounded-md shadow-sm placeholder-text-secondary focus:outline-none focus:ring-accent-green focus:border-accent-green sm:text-sm text-text-primary"
              placeholder="Enter your password"
            />
          </div>

          {isRegistering && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-input-bg border border-border-color rounded-md shadow-sm placeholder-text-secondary focus:outline-none focus:ring-accent-green focus:border-accent-green sm:text-sm text-text-primary"
                placeholder="Confirm your new password"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-text-on-accent bg-accent-green hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-accent-green disabled:opacity-50 transition-opacity"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : (isRegistering ? 'Create Wallet' : 'Unlock')}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={handleToggleMode}
            className="text-sm text-accent-green hover:opacity-80 hover:underline focus:outline-none"
          >
            {isRegistering ? (localStorageService.hasStoredData() ? 'Already have a wallet? Log In' : '') : 'Create a new wallet?'}
          </button>
        </div>
         { !isRegistering && localStorageService.hasStoredData() && (
            <div className="mt-4 pt-4 border-t border-border-color text-center">
                <button
                onClick={handleClearData}
                className="text-sm text-accent-red hover:opacity-80 hover:underline focus:outline-none"
                >
                Forgot password? Reset and clear all data.
                </button>
                <p className="text-xs text-text-secondary mt-1">(Warning: This will delete all stored accounts.)</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;