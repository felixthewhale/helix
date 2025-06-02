import React, { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import AccountItem from './AccountItem';
import LoadingSpinner from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { HEDERA_NETWORKS } from '../constants';

const AccountList: React.FC = () => {
  const { state, dispatch, fetchAccountData } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.accounts.length > 0 && !state.activeAccountId) {
      const firstAccountOnCurrentNetwork = state.accounts.find(acc => acc.network === state.network);
      if (firstAccountOnCurrentNetwork) {
        dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: firstAccountOnCurrentNetwork.id });
      } else if (state.accounts.length > 0) {
         dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: state.accounts[0].id });
      }
    }
  }, [state.accounts, state.activeAccountId, state.network, dispatch]);

  useEffect(() => {
    state.accounts.forEach(account => {
      const details = state.accountDetails[account.id];
      if (account.network === state.network) {
        const shouldFetchBalance = !details?.balance && !details?.balanceError;
        if (shouldFetchBalance) {
           fetchAccountData(account.id);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.accounts, state.network, fetchAccountData]);


  const handleSelectAccount = (accountId: string) => {
    dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: accountId });
  };

  const accountsOnCurrentNetwork = state.accounts.filter(acc => acc.network === state.network);
  const networkSymbol = HEDERA_NETWORKS[state.network]?.name.substring(0,4).toUpperCase() || 'NET';

  if (state.isLoading && accountsOnCurrentNetwork.length === 0 && !state.isInitialized) {
    return <div className="p-4"><LoadingSpinner message="Initializing wallet..." /></div>;
  }
   if (state.isLoading && accountsOnCurrentNetwork.length === 0 && state.isInitialized) {
    return <div className="p-4"><LoadingSpinner message="Loading accounts..." /></div>;
  }


  if (accountsOnCurrentNetwork.length === 0 && state.isInitialized) {
    return (
      <div className="p-6 text-center bg-card-bg rounded-lg shadow-xl border border-border-color m-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 00-3-3H9a3 3 0 000 6h3a3 3 0 003-3zM9 10V9a3 3 0 013-3h0a3 3 0 013 3v1m-6 0v4m6-4v4" />
        </svg>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No Accounts Found on {state.network}</h3>
        <p className="text-text-secondary mb-4">
          You don't have any accounts set up for the current network.
        </p>
        <button
          onClick={() => navigate('/add-account')}
          className="px-6 py-2 bg-accent-green hover:opacity-90 text-text-on-accent font-medium rounded-md shadow-md transition-opacity"
        >
          Add Your First Account
        </button>
        {state.accounts.length > 0 && (
            <p className="text-xs text-text-secondary mt-3">
                You have accounts on other networks. Switch networks in Settings to see them.
            </p>
        )}
      </div>
    );
  }
  

  return (
    <div className="p-1 sm:p-2 md:p-4">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-semibold text-text-primary">My Accounts ({networkSymbol})</h2>
        {state.isLoading && accountsOnCurrentNetwork.length > 0 && <LoadingSpinner size="sm" />}
      </div>
      <ul className="space-y-3">
        {accountsOnCurrentNetwork.map(account => (
          <AccountItem
            key={`${account.id}-${account.network}`}
            account={account}
            balance={state.accountDetails[account.id]?.balance}
            onSelect={handleSelectAccount}
            isSelected={state.activeAccountId === account.id}
            networkSymbol={HEDERA_NETWORKS[account.network]?.name.substring(0,4).toUpperCase() || 'NET'}
          />
        ))}
      </ul>
      {accountsOnCurrentNetwork.length > 0 && (
        <button
            onClick={() => navigate('/add-account')}
            className="mt-8 w-full flex items-center justify-center px-6 py-3 border-2 border-dashed border-accent-grey hover:border-accent-green text-text-secondary hover:text-accent-green font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent-green focus:ring-opacity-50"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Another Account
        </button>
      )}
    </div>
  );
};

export default AccountList;