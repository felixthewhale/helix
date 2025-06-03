import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { hederaService } from '../services/hederaService';
import { Hbar, PrivateKey, HbarUnit } from '@hashgraph/sdk'; // Added HbarUnit
import LoadingSpinner from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const SendTransactionForm: React.FC = () => {
  const { state, addNotification, fetchAccountData, getActiveAccountDetails } = useAppContext();
  const navigate = useNavigate();
  
  const activeUserAccount = getActiveAccountDetails();

  const [recipientAccountId, setRecipientAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeUserAccount) {
      addNotification('error', 'No active account selected or wallet locked. Please select an account or unlock.');
      navigate('/');
    } else if (activeUserAccount.network !== state.network) {
        addNotification('error', `Active account is on ${activeUserAccount.network}, but wallet is set to ${state.network}. Please switch networks or accounts.`);
        navigate('/');
    }
  }, [activeUserAccount, state.network, navigate, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserAccount || !activeUserAccount.privateKey) {
      addNotification('error', 'Active account or private key is not available. Unlock wallet or check account details.');
      return;
    }
    if (!hederaService.isValidAccountId(recipientAccountId)) {
      addNotification('error', 'Invalid recipient account ID.');
      return;
    }
    const hbarAmount = parseFloat(amount);
    if (isNaN(hbarAmount) || hbarAmount <= 0) {
      addNotification('error', 'Invalid HBAR amount.');
      return;
    }

    setIsLoading(true);
    try {
      const { transactionId, receiptStatus } = await hederaService.transferHbar(
        activeUserAccount.id,
        activeUserAccount.privateKey, 
        recipientAccountId,
        Hbar.from(hbarAmount, HbarUnit.Hbar), // Explicitly added HbarUnit.Hbar
        memo
      );
      
      if (receiptStatus === 'SUCCESS') {
        addNotification('success', `Transaction successful! ID: ${transactionId.toString()}`);
        setRecipientAccountId('');
        setAmount('');
        setMemo('');
        fetchAccountData(activeUserAccount.id);
        navigate('/'); 
      } else {
        addNotification('error', `Transaction failed: ${receiptStatus}. ID: ${transactionId.toString()}`);
      }
    } catch (error) {
      console.error("Transfer HBAR error:", error);
      const parsedError = hederaService.parseHederaError(error);
      addNotification('error', `Transfer failed: ${parsedError === 'UNKNOWN_ERROR' && error instanceof Error ? error.message : parsedError}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeUserAccount) {
    return (
        <div className="max-w-lg mx-auto p-6 bg-card-bg rounded-xl shadow-2xl border border-border-color my-8 text-center">
            <p className="text-accent-red">No active account to send from. Please select an account or unlock your wallet.</p>
            <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-accent-green text-text-on-accent rounded hover:opacity-90">Go to Accounts</button>
        </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8 bg-card-bg rounded-xl shadow-2xl border border-border-color my-8">
      <h2 className="text-3xl font-bold text-text-primary mb-2 text-center">Send Transaction</h2>
      <p className="text-sm text-text-secondary text-center mb-8">From: {activeUserAccount.nickname} ({activeUserAccount.id})</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="recipientAccountId" className="block text-sm font-medium text-text-primary mb-1">Recipient Account ID</label>
          <input
            type="text"
            id="recipientAccountId"
            value={recipientAccountId}
            onChange={(e) => setRecipientAccountId(e.target.value)}
            required
            className="w-full px-4 py-3 bg-input-bg border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-accent-green focus:border-accent-green"
            placeholder="0.0.XXXXX"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-text-primary mb-1">Amount (HBAR)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            step="any"
            min="0.00000001" 
            className="w-full px-4 py-3 bg-input-bg border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-accent-green focus:border-accent-green"
            placeholder="e.g., 10.5"
          />
        </div>

        <div>
          <label htmlFor="memo" className="block text-sm font-medium text-text-primary mb-1">Memo (Optional)</label>
          <input
            type="text"
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={100} 
            className="w-full px-4 py-3 bg-input-bg border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-accent-green focus:border-accent-green"
            placeholder="e.g., Payment for services"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-text-on-accent bg-accent-green hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-accent-green disabled:opacity-50 transition-opacity"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Send Transaction'}
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

export default SendTransactionForm;