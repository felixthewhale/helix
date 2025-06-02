import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { hederaService } from '../services/hederaService';
import { HederaNetworkType } from '../types';
import { HEDERA_NETWORKS, DEFAULT_NETWORK } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { PrivateKey, PublicKey } from '@hashgraph/sdk';


const AddAccountForm: React.FC = () => {
  const { addAccount, state, addNotification } = useAppContext();
  const navigate = useNavigate();

  const [formType, setFormType] = useState<'create' | 'import'>('create');
  const [nickname, setNickname] = useState('');
  const [privateKeyStr, setPrivateKeyStr] = useState('');
  const [accountIdForImport, setAccountIdForImport] = useState(''); 
  const [network, setNetwork] = useState<HederaNetworkType>(state.network || DEFAULT_NETWORK);
  const [isLoading, setIsLoading] = useState(false);
  
  const [generatedKeys, setGeneratedKeys] = useState<{publicKey: string, privateKey: string, accountIdCandidate?: string} | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      addNotification('error', 'Nickname is required.');
      return;
    }
    setIsLoading(true);
    // setGeneratedKeys(null); // Keep generated keys visible until next action

    let success = false;

    if (formType === 'create') {
      const keys = hederaService.generateKeys();
      // Display keys immediately for user to copy, before attempting to save
      setGeneratedKeys({
          publicKey: keys.publicKey.toStringDer(),
          privateKey: keys.privateKey.toStringRaw(),
      });
      
      const result = await addAccount({ 
        nickname, 
        privateKeyStr: keys.privateKey.toStringRaw(),
        forNetwork: network 
      }, 'create');

      if (result) {
        success = true;
        addNotification('info', 'IMPORTANT: Newly generated keys require on-chain account creation and funding to be usable. Ensure you have saved the Private Key displayed.');
      }

    } else { // import
      if (!privateKeyStr.trim() || !hederaService.isValidPrivateKey(privateKeyStr)) {
        addNotification('error', 'Valid private key is required for import.');
        setIsLoading(false);
        return;
      }
      if (!accountIdForImport.trim() || !hederaService.isValidAccountId(accountIdForImport)) {
        addNotification('error', 'Valid Account ID (e.g., 0.0.123) is required for import.');
        setIsLoading(false);
        return;
      }
      
      const result = await addAccount(
        { 
            nickname, 
            privateKeyStr, 
            accountId: accountIdForImport, 
            forNetwork: network 
        }, 
        'import'
      );

      if (result) {
        success = true;
      }
    }
    
    setIsLoading(false);
    if (success) {
      if (formType === 'import') { // Only navigate away immediately for import
        navigate('/'); 
      }
      // For 'create', user might still be copying keys, so don't navigate immediately.
      // User can navigate manually after copying.
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8 bg-card-bg rounded-xl shadow-2xl border border-border-color my-8">
      <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">
        {formType === 'create' ? 'Create New Account Keys' : 'Import Existing Account'}
      </h2>

      <div className="mb-6 flex justify-center space-x-2">
        {(['create', 'import'] as const).map((type) => (
          <button
            key={type}
            onClick={() => { setFormType(type); setGeneratedKeys(null);}}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors
                        ${formType === type ? 'bg-accent-green text-text-on-accent' : 'bg-input-bg text-text-primary hover:bg-accent-grey/20'}`}
          >
            {type === 'create' ? 'Generate Keys' : 'Import Account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-text-primary mb-1">Nickname</label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="w-full px-4 py-3 bg-input-bg border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-accent-green focus:border-accent-green"
            placeholder="e.g., My Savings"
          />
        </div>

        <div>
          <label htmlFor="network" className="block text-sm font-medium text-text-primary mb-1">Network</label>
          <select
            id="network"
            value={network}
            onChange={(e) => setNetwork(e.target.value as HederaNetworkType)}
            className="w-full px-4 py-3 bg-input-bg border border-border-color rounded-md text-text-primary focus:ring-accent-green focus:border-accent-green"
          >
            {Object.values(HederaNetworkType).map(net => (
              <option key={net} value={net}>{HEDERA_NETWORKS[net]?.name || net}</option>
            ))}
          </select>
        </div>
        
        {formType === 'import' && (
          <>
            <div>
              <label htmlFor="accountIdForImport" className="block text-sm font-medium text-text-primary mb-1">Account ID (e.g., 0.0.12345)</label>
              <input
                type="text"
                id="accountIdForImport"
                value={accountIdForImport}
                onChange={(e) => setAccountIdForImport(e.target.value)}
                required
                className="w-full px-4 py-3 bg-input-bg border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-accent-green focus:border-accent-green"
                placeholder="Enter Hedera Account ID"
              />
            </div>
            <div>
              <label htmlFor="privateKeyStr" className="block text-sm font-medium text-text-primary mb-1">Private Key (Raw Hex or DER)</label>
              <textarea
                id="privateKeyStr"
                rows={3}
                value={privateKeyStr}
                onChange={(e) => setPrivateKeyStr(e.target.value)}
                required
                className="w-full px-4 py-3 bg-input-bg border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-accent-green focus:border-accent-green"
                placeholder="Enter your existing raw private key string"
              />
            </div>
          </>
        )}
        
        {formType === 'create' && generatedKeys && (
            <div className="mt-6 p-4 bg-accent-red/5 rounded-md border border-accent-red/50">
                <h3 className="text-lg font-semibold text-accent-red mb-2">Generated Keys (Store Securely!)</h3>
                <div className="space-y-2 text-sm">
                    <p className="text-text-primary break-all"><strong>Public Key:</strong> <span className="font-mono">{generatedKeys.publicKey}</span></p>
                    <p className="text-text-primary break-all"><strong>Private Key:</strong> <span className="font-mono">{generatedKeys.privateKey}</span></p>
                </div>
                <p className="text-xs text-accent-red mt-3">
                    The private key has been encrypted and added to your local wallet list with a temporary ID.
                    This account needs to be created and funded on the Hedera network using the Public Key above.
                    Once created on-chain, you may need to re-import it with its official Account ID to see balances and transact.
                </p>
            </div>
        )}


        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-text-on-accent bg-accent-green hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-accent-green disabled:opacity-50 transition-opacity"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : (formType === 'create' ? 'Generate & Add Keys' : 'Import & Add Account')}
        </button>
      </form>
      <button
          onClick={() => navigate('/')}
          className="mt-6 w-full text-center py-2 px-4 border border-border-color rounded-md text-sm font-medium text-text-primary hover:bg-input-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-accent-green transition-colors"
        >
          Cancel
      </button>
    </div>
  );
};

export default AddAccountForm;