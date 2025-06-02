import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext'; // Import useTheme
import { HederaNetworkType } from '../types';
import { HEDERA_NETWORKS, APP_NAME } from '../constants';
import { useNavigate } from 'react-router-dom';

const SettingsPanel: React.FC = () => {
  const { state, setNetwork, clearAllData, dispatch, addNotification } = useAppContext();
  const { themeName, setThemeName, availableThemes } = useTheme(); // Use theme context
  const navigate = useNavigate();

  const handleNetworkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value as HederaNetworkType;
    await setNetwork(newNetwork);
  };
  
  const handleLockWallet = () => {
    dispatch({ type: 'LOCK_APP' });
    addNotification('info', 'Wallet Locked.');
    navigate('/'); 
  };

  const handleClearAllData = async () => {
    await clearAllData();
    // Theme preference is also cleared by clearAllData in localStorageService
    // Set theme to default after clearing data if ThemeProvider doesn't auto-reset
    // This is handled by ThemeProvider's effect checking localStorage
    navigate('/'); 
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setThemeName(e.target.value);
    addNotification('success', `Theme changed to ${availableThemes[e.target.value]?.name || e.target.value}`);
  };


  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 bg-card-bg rounded-xl shadow-2xl border border-border-color my-8">
      <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Settings</h2>

      <div className="space-y-8">
        {/* Theme Selection */}
        <div className="p-6 bg-input-bg rounded-lg shadow border border-border-color">
          <h3 className="text-xl font-semibold text-text-primary mb-3">Appearance</h3>
          <label htmlFor="theme-select" className="block text-sm font-medium text-text-primary mb-1">
            Current Theme
          </label>
          <select
            id="theme-select"
            value={themeName}
            onChange={handleThemeChange}
            disabled={state.isLoading}
            className="w-full px-4 py-3 bg-card-bg border border-border-color rounded-md text-text-primary focus:ring-accent-green focus:border-accent-green disabled:opacity-70"
          >
            {Object.keys(availableThemes).map(key => (
              <option key={key} value={key}>
                {availableThemes[key].name}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary mt-2">
            Change the look and feel of your wallet.
          </p>
        </div>

        {/* Network Selection */}
        <div className="p-6 bg-input-bg rounded-lg shadow border border-border-color">
          <h3 className="text-xl font-semibold text-text-primary mb-3">Network Configuration</h3>
          <label htmlFor="network-select" className="block text-sm font-medium text-text-primary mb-1">
            Current Hedera Network
          </label>
          <select
            id="network-select"
            value={state.network}
            onChange={handleNetworkChange}
            disabled={state.isLoading}
            className="w-full px-4 py-3 bg-card-bg border border-border-color rounded-md text-text-primary focus:ring-accent-green focus:border-accent-green disabled:opacity-70"
          >
            {Object.values(HederaNetworkType).map(net => (
              <option key={net} value={net}>
                {HEDERA_NETWORKS[net]?.name || net}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary mt-2">
            Changing networks will clear current account details and list accounts specific to the new network.
          </p>
        </div>

        {/* Security */}
        <div className="p-6 bg-input-bg rounded-lg shadow border border-border-color">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Security</h3>
          <button
            onClick={handleLockWallet}
            className="w-full mb-4 py-3 px-4 border border-accent-red/70 rounded-md text-sm font-medium text-accent-red bg-accent-red/10 hover:bg-accent-red/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-input-bg focus:ring-accent-red transition-colors"
          >
            Lock Wallet
          </button>
          <p className="text-xs text-text-secondary">
            This will lock your wallet and require your password to unlock again.
          </p>
        </div>
        
        {/* Data Management */}
        <div className="p-6 bg-accent-red/10 border border-accent-red/50 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-accent-red mb-4">Data Management</h3>
          <button
            onClick={handleClearAllData}
            disabled={state.isLoading}
            className="w-full py-3 px-4 border border-accent-red rounded-md text-sm font-medium text-accent-red bg-accent-red/10 hover:bg-accent-red/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-accent-red/10 focus:ring-accent-red disabled:opacity-50 transition-colors"
          >
            {state.isLoading ? 'Processing...' : 'Clear All Wallet Data'}
          </button>
          <p className="text-xs text-accent-red mt-2">
            <strong className="font-semibold">Warning:</strong> This will permanently delete all accounts and settings stored in this browser. This action cannot be undone. Ensure you have your private keys backed up if you wish to restore your accounts later.
          </p>
        </div>

        {/* About */}
        <div className="p-6 bg-input-bg rounded-lg shadow border border-border-color">
          <h3 className="text-xl font-semibold text-text-primary mb-3">About {APP_NAME}</h3>
          <p className="text-sm text-text-primary">
            Version: 1.1.0 (Themed Edition)
          </p>
          <p className="text-xs text-text-secondary mt-2">
            This is a lightweight, client-side Hedera wallet. All your sensitive data (like private keys) is encrypted and stored locally in your browser.
            Remember to back up your private keys securely, as this wallet does not offer cloud backup.
          </p>
        </div>
      </div>
       <button
          onClick={() => navigate('/')}
          className="mt-8 w-full text-center py-3 px-4 border border-border-color rounded-md text-sm font-medium text-text-primary hover:bg-input-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-accent-green transition-colors"
        >
          Back to Wallet
      </button>
    </div>
  );
};

export default SettingsPanel;