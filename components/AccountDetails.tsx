import React, { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import LoadingSpinner from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { TransactionRecord } from '../types';
import { HEDERA_NETWORKS } from '../constants';

const AccountDetails: React.FC = () => {
  const { state, fetchAccountData, getActiveAccountDetails, addNotification } = useAppContext();
  const navigate = useNavigate();
  const activeAccount = getActiveAccountDetails(); 

  useEffect(() => {
    if (state.activeAccountId && (!state.accountDetails[state.activeAccountId]?.balance || !state.accountDetails[state.activeAccountId]?.transactions)) {
      fetchAccountData(state.activeAccountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeAccountId, fetchAccountData]); 

  if (!state.activeAccountId || !activeAccount) {
    return (
      <div className="p-6 text-center bg-card-bg rounded-lg shadow-xl border border-border-color m-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No Account Selected</h3>
        <p className="text-text-secondary">Please select an account from the list to see its details.</p>
      </div>
    );
  }
  
  if (activeAccount.network !== state.network) {
     return (
      <div className="p-6 text-center bg-accent-red/10 rounded-lg shadow-xl m-4 border border-accent-red/50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-accent-red mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-semibold text-accent-red mb-2">Network Mismatch</h3>
        <p className="text-accent-red text-sm">
          The selected account <strong className="font-medium">{activeAccount.nickname} ({activeAccount.id})</strong> is on the <strong className="font-medium">{activeAccount.network}</strong> network.
        </p>
        <p className="text-accent-red text-sm mt-1">
          You are currently viewing the <strong className="font-medium">{state.network}</strong> network.
        </p>
        <button
          onClick={() => navigate('/settings')}
          className="mt-4 px-4 py-2 bg-accent-red hover:opacity-90 text-text-on-accent font-semibold rounded-md shadow-md transition-opacity text-sm"
        >
          Switch to {activeAccount.network} in Settings
        </button>
      </div>
    );
  }

  const details = state.accountDetails[activeAccount.id];
  const networkSymbol = HEDERA_NETWORKS[activeAccount.network]?.name.substring(0,4).toUpperCase() || 'NET';


  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => addNotification('success', `${label} copied to clipboard!`))
      .catch(() => addNotification('error', `Failed to copy ${label}.`));
  };

  return (
    <div className="p-4 md:p-6 bg-card-bg rounded-lg shadow-xl border border-border-color m-2 md:m-4">
      <div className="mb-6 pb-4 border-b border-border-color">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <h2 className="text-2xl font-bold text-text-primary mb-1 sm:mb-0">{activeAccount.nickname}</h2>
          <span className="px-3 py-1 bg-accent-green text-text-on-accent text-xs font-semibold rounded-full self-start sm:self-center">{networkSymbol}</span>
        </div>
        <div className="flex items-center mt-1 text-sm text-text-secondary break-all">
            {activeAccount.id}
            <button onClick={() => copyToClipboard(activeAccount.id, 'Account ID')} className="ml-2 text-accent-green hover:opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </button>
        </div>
        <div className="flex items-center mt-1 text-xs text-text-secondary break-all">
            Public Key: {activeAccount.publicKey.substring(0, 20)}...{activeAccount.publicKey.substring(activeAccount.publicKey.length - 20)}
            <button onClick={() => copyToClipboard(activeAccount.publicKey, 'Public Key')} className="ml-2 text-accent-green hover:opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Balance</h3>
        {details?.balance ? (
          <p className="text-3xl font-bold text-accent-green">{details.balance.hbars.toString()}</p>
        ) : (
          details?.balanceError ? <p className="text-sm text-accent-red">{details.balanceError}</p> : <LoadingSpinner size="sm" message="Fetching balance..." />
        )}
      </div>

      <div className="flex space-x-2 sm:space-x-4 mb-6">
        <button
          onClick={() => navigate('/send')}
          className="flex-1 bg-accent-green hover:opacity-90 text-text-on-accent font-medium py-3 px-4 rounded-md shadow-md transition-opacity text-sm flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send Transaction
        </button>
        <button
          onClick={() => fetchAccountData(activeAccount.id)}
          disabled={state.isLoading}
          className="flex-1 bg-accent-grey hover:opacity-90 text-text-on-accent font-medium py-3 px-4 rounded-md shadow-md transition-opacity text-sm flex items-center justify-center disabled:opacity-50"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${state.isLoading && !details?.transactionsError && !details?.balanceError ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15" />
          </svg>
          Refresh Data
        </button>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Recent Activity</h3>
        {state.isLoading && !details?.transactions && !details?.transactionsError && <LoadingSpinner size="sm" message="Fetching transactions..." />}
        {details?.transactionsError && <p className="text-sm text-accent-red text-center py-4">{details.transactionsError}</p>}
        {details?.transactions && details.transactions.length > 0 ? (
          <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {details.transactions.map((tx: TransactionRecord) => (
              <li key={tx.id} className="bg-input-bg p-3 rounded-md shadow border border-border-color"> {/* Changed bg-primary-bg to bg-input-bg for better contrast if card is dark */}
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tx.status === 'SUCCESS' ? 'bg-accent-green text-text-on-accent' : 'bg-accent-red text-text-on-accent'}`}>{tx.status}</span>
                  <span className="text-xs text-text-secondary">{tx.timestamp}</span>
                </div>
                <p className="text-sm text-text-primary font-medium">{tx.type}</p>
                {tx.amount && <p className={`text-sm ${tx.amount.startsWith('+') || !tx.amount.startsWith('-') ? 'text-accent-green' : 'text-accent-red'}`}>{tx.amount}</p>}
                {tx.parties && <p className="text-xs text-text-secondary truncate"> {tx.parties} </p>}
                {tx.memo && <p className="text-xs text-text-secondary/80 italic truncate">Memo: {tx.memo}</p>}
                <p className="text-xs text-text-secondary/80 truncate mt-1">ID: {tx.id}</p>
              </li>
            ))}
          </ul>
        ) : (
          !state.isLoading && !details?.transactionsError && <p className="text-sm text-text-secondary text-center py-4">No transactions found for this account on {activeAccount.network}.</p>
        )}
      </div>
    </div>
  );
};

export default AccountDetails;