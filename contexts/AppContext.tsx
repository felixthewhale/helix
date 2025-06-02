
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { StoredAccount, HederaNetworkType, AccountBalance, TransactionRecord, AppNotification, DecryptedAccount } from '../types';
import { localStorageService } from '../services/localStorageService';
import { hederaService, initializeHederaClient } from '../services/hederaService';
import { DEFAULT_NETWORK, HEDERA_NETWORKS } from '../constants';
import { PrivateKey, PublicKey, Hbar } from '@hashgraph/sdk';

interface AppState {
  isInitialized: boolean;
  isAppLocked: boolean;
  sessionPassword?: string;
  accounts: StoredAccount[];
  activeAccountId?: string;
  accountDetails: {
    [accountId: string]: {
      balance?: AccountBalance;
      transactions?: TransactionRecord[];
      balanceError?: string | null; 
      transactionsError?: string | null; 
    };
  };
  network: HederaNetworkType;
  isLoading: boolean; 
  notifications: AppNotification[];
}

type AppAction =
  | { type: 'INITIALIZE_START' }
  | { type: 'INITIALIZE_SUCCESS'; payload: { accounts: StoredAccount[]; network: HederaNetworkType; isLocked: boolean } }
  | { type: 'INITIALIZE_FAILURE' }
  | { type: 'LOCK_APP' }
  | { type: 'UNLOCK_APP_START' }
  | { type: 'UNLOCK_APP_SUCCESS'; payload: { accounts: StoredAccount[]; network: HederaNetworkType; password: string } }
  | { type: 'UNLOCK_APP_FAILURE'; }
  | { type: 'ADD_ACCOUNT_START' }
  | { type: 'ADD_ACCOUNT_SUCCESS'; payload: StoredAccount }
  | { type: 'ADD_ACCOUNT_FAILURE'; }
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: string | undefined }
  | { type: 'SET_NETWORK_START' }
  | { type: 'SET_NETWORK_SUCCESS'; payload: HederaNetworkType }
  | { type: 'SET_NETWORK_FAILURE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_ACCOUNT_BALANCE_START'; payload: { accountId: string } }
  | { type: 'UPDATE_ACCOUNT_BALANCE_SUCCESS'; payload: { accountId: string; balance: AccountBalance } }
  | { type: 'UPDATE_ACCOUNT_BALANCE_FAILURE'; payload: { accountId: string; error: string } } 
  | { type: 'UPDATE_ACCOUNT_TRANSACTIONS_START'; payload: { accountId: string } }
  | { type: 'UPDATE_ACCOUNT_TRANSACTIONS_SUCCESS'; payload: { accountId: string; transactions: TransactionRecord[] } }
  | { type: 'UPDATE_ACCOUNT_TRANSACTIONS_FAILURE'; payload: { accountId: string; error: string } } 
  | { type: 'CLEAR_ALL_DATA_SUCCESS' };

const initialState: AppState = {
  isInitialized: false,
  isAppLocked: true,
  accounts: [],
  accountDetails: {},
  network: DEFAULT_NETWORK,
  isLoading: false,
  notifications: [],
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  unlockApp: (password: string) => Promise<boolean>;
  addAccount: (accountData: { nickname: string; privateKeyStr?: string; accountId?: string; forNetwork: HederaNetworkType }, type: 'create' | 'import') => Promise<StoredAccount | null>;
  fetchAccountData: (accountId: string) => Promise<void>;
  getActiveAccountDetails: () => DecryptedAccount | null;
  clearAllData: () => Promise<void>;
  setNetwork: (network: HederaNetworkType) => Promise<void>;
}>({
  state: initialState,
  dispatch: () => null,
  addNotification: () => {},
  unlockApp: async () => false,
  addAccount: async () => null,
  fetchAccountData: async () => {},
  getActiveAccountDetails: () => null,
  clearAllData: async () => {},
  setNetwork: async () => {},
});

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'INITIALIZE_START':
      return { ...state, isLoading: true, isInitialized: false };
    case 'INITIALIZE_SUCCESS':
      return { ...state, isLoading: false, isInitialized: true, accounts: action.payload.accounts, network: action.payload.network, isAppLocked: action.payload.isLocked, accountDetails: {} };
    case 'INITIALIZE_FAILURE':
      return { ...state, isLoading: false, isInitialized: true, isAppLocked: localStorageService.hasStoredData() };
    case 'LOCK_APP':
      return { ...state, isAppLocked: true, sessionPassword: undefined, activeAccountId: undefined, accountDetails: {} };
    case 'UNLOCK_APP_START':
      return { ...state, isLoading: true };
    case 'UNLOCK_APP_SUCCESS':
      return { ...state, isLoading: false, isAppLocked: false, accounts: action.payload.accounts, network: action.payload.network, sessionPassword: action.payload.password, accountDetails: {} };
    case 'UNLOCK_APP_FAILURE':
        return { ...state, isLoading: false, isAppLocked: true };
    case 'ADD_ACCOUNT_START':
    case 'SET_NETWORK_START':
        return { ...state, isLoading: true };
    case 'ADD_ACCOUNT_SUCCESS':
      const newAccounts = [...state.accounts.filter(a => !(a.id === action.payload.id && a.network === action.payload.network)), action.payload];
      return { ...state, isLoading: false, accounts: newAccounts, activeAccountId: action.payload.id };
    case 'ADD_ACCOUNT_FAILURE':
    case 'SET_NETWORK_FAILURE':
        return { ...state, isLoading: false };
    case 'SET_ACTIVE_ACCOUNT':
      return { ...state, activeAccountId: action.payload };
    case 'SET_NETWORK_SUCCESS':
      return { ...state, isLoading: false, network: action.payload, activeAccountId: undefined, accountDetails: {} }; 
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_NOTIFICATION':
      // Prevent duplicate "Key Decryption Alert" notifications if one is already visible
      // This is a more general fix but the specific one is removing it from getActiveAccountDetails
      const isDuplicateKeyAlert = action.payload.message.startsWith("Key Decryption Alert") && 
                                  state.notifications.some(n => n.message.startsWith("Key Decryption Alert"));
      if (isDuplicateKeyAlert) return state;
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'UPDATE_ACCOUNT_BALANCE_START':
    case 'UPDATE_ACCOUNT_TRANSACTIONS_START':
      const accountIdForStart = action.payload.accountId;
      return { 
        ...state, 
        isLoading: true, 
        accountDetails: {
            ...state.accountDetails,
            [accountIdForStart]: {
                ...state.accountDetails[accountIdForStart],
                ...(action.type === 'UPDATE_ACCOUNT_BALANCE_START' && { balanceError: null }),
                ...(action.type === 'UPDATE_ACCOUNT_TRANSACTIONS_START' && { transactionsError: null }),
            }
        }
      };
    case 'UPDATE_ACCOUNT_BALANCE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        accountDetails: {
          ...state.accountDetails,
          [action.payload.accountId]: {
            ...state.accountDetails[action.payload.accountId],
            balance: action.payload.balance,
            balanceError: null, 
          },
        },
      };
    case 'UPDATE_ACCOUNT_TRANSACTIONS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        accountDetails: {
          ...state.accountDetails,
          [action.payload.accountId]: {
            ...state.accountDetails[action.payload.accountId],
            transactions: action.payload.transactions,
            transactionsError: null, 
          },
        },
      };
    case 'UPDATE_ACCOUNT_BALANCE_FAILURE':
        return { 
            ...state, 
            isLoading: false,
            accountDetails: {
                ...state.accountDetails,
                [action.payload.accountId]: {
                    ...state.accountDetails[action.payload.accountId],
                    balance: state.accountDetails[action.payload.accountId]?.balance || undefined, 
                    balanceError: action.payload.error,
                }
            }
        };
    case 'UPDATE_ACCOUNT_TRANSACTIONS_FAILURE':
        return { 
            ...state, 
            isLoading: false,
            accountDetails: {
                ...state.accountDetails,
                [action.payload.accountId]: {
                    ...state.accountDetails[action.payload.accountId],
                    transactions: state.accountDetails[action.payload.accountId]?.transactions || undefined, 
                    transactionsError: action.payload.error,
                }
            }
        };
    case 'CLEAR_ALL_DATA_SUCCESS':
        return { ...initialState, network: state.network, isInitialized: true, isAppLocked: false, accountDetails: {} };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: { id: Date.now().toString(), type, message } });
  }, []);
  
  useEffect(() => {
    const initApp = async () => {
      dispatch({ type: 'INITIALIZE_START' });
      try {
        const hasData = localStorageService.hasStoredData();
        if (hasData) {
          // Try to get network setting. If password is required and not available, it defaults.
          // For init, we might not have password yet, so this is best effort or relies on default.
          const network = await localStorageService.getNetworkSetting(); // No password, so it might return default
          initializeHederaClient(network);
          // Accounts will be loaded upon unlock.
          dispatch({ type: 'INITIALIZE_SUCCESS', payload: { accounts: [], network: network, isLocked: true } });
        } else { // No data stored, first time user
          initializeHederaClient(DEFAULT_NETWORK);
          // Force new user to AuthScreen to set a password.
          dispatch({ type: 'INITIALIZE_SUCCESS', payload: { accounts: [], network: DEFAULT_NETWORK, isLocked: true } });
        }
      } catch (error) {
        console.error("Initialization error:", error);
        addNotification('error', 'Failed to initialize application.');
        initializeHederaClient(DEFAULT_NETWORK); // Fallback
        dispatch({ type: 'INITIALIZE_FAILURE' });
      }
    };
    initApp();
  }, [addNotification]); // addNotification is stable due to useCallback

  useEffect(() => {
    initializeHederaClient(state.network);
  }, [state.network]);

  const unlockApp = useCallback(async (password: string): Promise<boolean> => {
    dispatch({ type: 'UNLOCK_APP_START' });
    try {
      const storedData = await localStorageService.retrieveAndDecryptData(password);

      if (storedData) { // Existing wallet found and decrypted
        initializeHederaClient(storedData.settings.network);
        dispatch({
          type: 'UNLOCK_APP_SUCCESS',
          payload: {
            accounts: storedData.accounts,
            network: storedData.settings.network,
            password
          }
        });
        addNotification('success', 'Wallet Unlocked!');
        return true;
      } else { 
        // No existing wallet data was found (retrieveAndDecryptData returned null without throwing decryption error)
        // This is a new wallet setup scenario.
        try {
            addNotification('info', 'No existing wallet found. Setting up a new one...');
            await localStorageService.storeEncryptedData([], DEFAULT_NETWORK, password);
            initializeHederaClient(DEFAULT_NETWORK);
            dispatch({
                type: 'UNLOCK_APP_SUCCESS',
                payload: {
                accounts: [],
                network: DEFAULT_NETWORK,
                password
                }
            });
            addNotification('success', 'New wallet created and unlocked!');
            return true;
        } catch (setupError) {
            console.error("New wallet setup failed:", setupError);
            addNotification('error', `Failed to initialize new wallet: ${setupError instanceof Error ? setupError.message : 'Unknown error'}`);
            dispatch({ type: 'UNLOCK_APP_FAILURE' });
            return false;
        }
      }
    } catch (error) { // This catch block handles errors from retrieveAndDecryptData (e.g., decryption failure)
      console.error("Unlock/Setup failed:", error);
      const errorMessage = (error instanceof Error && error.message.includes("Decryption failed"))
        ? "Invalid password for existing wallet."
        : "Failed to unlock or setup wallet.";
      addNotification('error', errorMessage);
      dispatch({ type: 'UNLOCK_APP_FAILURE' });
      return false;
    }
  }, [addNotification]);

  const addAccount = useCallback(async (
    accountData: { 
        nickname: string; 
        privateKeyStr?: string; 
        accountId?: string; 
        forNetwork: HederaNetworkType 
    },
    type: 'create' | 'import'
  ): Promise<StoredAccount | null> => {
    if (!state.sessionPassword && localStorageService.hasStoredData()) {
        addNotification('error', 'Session password not found. Please unlock the app first if you have existing accounts.');
        return null;
    }
     if (!state.sessionPassword && !localStorageService.hasStoredData() && state.isAppLocked) {
        addNotification('error', 'Please set up a master password for your new wallet first.');
        return null;
    }

    dispatch({ type: 'ADD_ACCOUNT_START' });
    try {
      let newPrivateKey: PrivateKey;
      let newPublicKey: PublicKey;
      let finalAccountId: string;

      if (type === 'create') {
        const keys = hederaService.generateKeys();
        newPrivateKey = keys.privateKey;
        newPublicKey = keys.publicKey;
        // For accounts that are only key pairs and not yet on-chain:
        finalAccountId = `generated-${newPublicKey.toStringRaw().substring(0,12)}`; 
        addNotification('info', `Keys generated for ${accountData.nickname}. This account is stored locally. To make it active on Hedera, it needs on-chain creation and funding using its public key.`);
      } else { 
        if (!accountData.privateKeyStr || !hederaService.isValidPrivateKey(accountData.privateKeyStr)) {
          throw new Error('Invalid private key provided for import.');
        }
        if (!accountData.accountId || !hederaService.isValidAccountId(accountData.accountId)) {
            throw new Error('Valid Hedera Account ID (e.g., 0.0.X) is required for import.');
        }
        newPrivateKey = PrivateKey.fromString(accountData.privateKeyStr); // Handles ED25519 and ECDSA
        newPublicKey = newPrivateKey.publicKey;
        finalAccountId = accountData.accountId; 
      }
      
      const encryptionPassword = state.sessionPassword;
      if (!encryptionPassword) {
          addNotification('error', "Cannot add account: Master password not available.");
          dispatch({ type: 'ADD_ACCOUNT_FAILURE' });
          return null;
      }
      
      const { encrypted: encryptedPrivateKey, salt: privateKeySalt } = await localStorageService.encryptPrivateKey(
        newPrivateKey.toStringRaw(),
        encryptionPassword
      );
      
      const newStoredAccount: StoredAccount = {
        id: finalAccountId,
        nickname: accountData.nickname,
        publicKey: newPublicKey.toStringDer(),
        encryptedPrivateKey: encryptedPrivateKey,
        privateKeySalt: privateKeySalt, // Store the salt
        network: accountData.forNetwork,
      };

      await localStorageService.addAccount(newStoredAccount, encryptionPassword); // addAccount in LS will re-encrypt whole blob
      dispatch({ type: 'ADD_ACCOUNT_SUCCESS', payload: newStoredAccount });

      if (state.accounts.length === 0 && state.network !== newStoredAccount.network) {
        // If this is the very first account being added, switch to its network
        dispatch({ type: 'SET_NETWORK_SUCCESS', payload: newStoredAccount.network });
      }
      addNotification('success', `Account "${accountData.nickname}" (${finalAccountId}) added to ${newStoredAccount.network}.`);
      return newStoredAccount;
    } catch (error) {
      console.error("Add account failed:", error);
      const message = error instanceof Error ? hederaService.parseHederaError(error) : 'Failed to add account.';
      addNotification('error', message === 'UNKNOWN_ERROR' && error instanceof Error ? error.message : message);
      dispatch({ type: 'ADD_ACCOUNT_FAILURE' });
      return null;
    }
  }, [state.sessionPassword, state.accounts.length, state.network, addNotification, state.isAppLocked]);

  const fetchAccountData = useCallback(async (accountId: string) => {
    if (!accountId || accountId.startsWith('generated-')) {
        if(accountId.startsWith('generated-')) {
            // For locally generated keys not yet on chain, set specific states
            dispatch({ type: 'UPDATE_ACCOUNT_BALANCE_FAILURE', payload: { accountId, error: "Local Keys (Not On-chain)" } });
            dispatch({ type: 'UPDATE_ACCOUNT_TRANSACTIONS_FAILURE', payload: { accountId, error: "Local Keys (Not On-chain)" } });
        }
        return;
    }

    const currentDetails = state.accountDetails[accountId];
    // Prevent re-fetch if already loading or recently errored, unless forced by user (future feature).
    // For now, allow re-fetch if errored to enable retry after fixing network issues etc.
    // if (currentDetails?.balanceError || currentDetails?.transactionsError) {
    //     // console.log(`Skipping fetch for ${accountId} due to prior error.`);
    //     // return; 
    // }


    dispatch({ type: 'UPDATE_ACCOUNT_BALANCE_START', payload: { accountId } });
    try {
      const balance = await hederaService.getAccountBalance(accountId);
      dispatch({ type: 'UPDATE_ACCOUNT_BALANCE_SUCCESS', payload: { accountId, balance } });
    } catch (error) {
      console.error(`Failed to fetch balance for ${accountId}:`, error);
      const parsedError = hederaService.parseHederaError(error);
      // Only show notification if the error message is different or new, to avoid spam.
      if (state.accountDetails[accountId]?.balanceError !== parsedError) {
          addNotification('error', `Balance fetch error for ${accountId.substring(0,15)}...: ${parsedError}`);
      }
      dispatch({ type: 'UPDATE_ACCOUNT_BALANCE_FAILURE', payload: { accountId, error: parsedError } });
    }
    
    dispatch({ type: 'UPDATE_ACCOUNT_TRANSACTIONS_START', payload: { accountId } });
    try {
      const transactions = await hederaService.getTransactionHistory(accountId, state.network);
      dispatch({ type: 'UPDATE_ACCOUNT_TRANSACTIONS_SUCCESS', payload: { accountId, transactions } });
    } catch (error) {
      console.error(`Failed to fetch transactions for ${accountId}:`, error);
      const parsedError = hederaService.parseHederaError(error);
       if (state.accountDetails[accountId]?.transactionsError !== parsedError) {
          addNotification('error', `Tx history fetch error for ${accountId.substring(0,15)}...: ${parsedError}`);
      }
      dispatch({ type: 'UPDATE_ACCOUNT_TRANSACTIONS_FAILURE', payload: { accountId, error: parsedError } });
    }
  }, [state.network, addNotification, state.accountDetails]); // state.accountDetails is needed to check prior errors for notification logic
  
  const getActiveAccountDetails = useCallback((): DecryptedAccount | null => {
    if (!state.activeAccountId || !state.sessionPassword) return null;
    
    const activeStoredAccount = state.accounts.find(acc => acc.id === state.activeAccountId && acc.network === state.network);
    if (!activeStoredAccount) return null;

    // Check for the crucial privateKeySalt.
    // Accounts created before this salt management was implemented will not have it.
    if (!activeStoredAccount.privateKeySalt) {
      console.warn(`Account ${activeStoredAccount.nickname} (${activeStoredAccount.id}) is missing privateKeySalt. It was likely created with an older version of the wallet. Re-import is required for transactions.`);
      addNotification('error', `Account '${activeStoredAccount.nickname}' needs re-import for secure transactions. Its private key encryption is outdated. Please remove and re-import it.`);
      return null;
    }

    try {
      const decryptedPrivKeyStr = localStorageService.decryptPrivateKeySync( // Assuming sync for simplicity here, or make getActiveAccountDetails async
        activeStoredAccount.encryptedPrivateKey,
        state.sessionPassword,
        activeStoredAccount.privateKeySalt // Pass the specific salt for this key
      );

      if (!decryptedPrivKeyStr) { // Should be caught by decryptPrivateKeySync throwing an error
        throw new Error("Decryption returned empty string.");
      }

      const privateKeyInstance = PrivateKey.fromString(decryptedPrivKeyStr);
      
      // Strip sensitive fields before returning
      const { encryptedPrivateKey, privateKeySalt, ...decryptedBase } = activeStoredAccount;

      return {
        ...decryptedBase,
        privateKey: privateKeyInstance, 
        publicKeyInstance: PublicKey.fromString(activeStoredAccount.publicKey),
      };

    } catch (error) {
      console.error(`Failed to decrypt private key for ${activeStoredAccount.nickname} (${activeStoredAccount.id}):`, error);
      addNotification('error', `Failed to decrypt private key for '${activeStoredAccount.nickname}'. Transactions cannot be signed.`);
      return null;
    }
  }, [state.activeAccountId, state.sessionPassword, state.accounts, state.network, addNotification]);


  const clearAllData = useCallback(async () => {
    const confirmed = window.confirm("Are you sure you want to delete all wallet data? This cannot be undone.");
    if (confirmed) {
      dispatch({type: 'SET_LOADING', payload: true});
      localStorageService.clearAllData();
      // Reset state to initial, but keep network if it was changed, or default
      dispatch({ type: 'CLEAR_ALL_DATA_SUCCESS' });
      addNotification('success', 'All wallet data has been cleared. Please set up a new password.');
      // App will lock, AuthScreen will appear prompting for new password setup.
    }
  }, [addNotification]);

  const setNetwork = useCallback(async (network: HederaNetworkType) => {
    if (!state.sessionPassword && localStorageService.hasStoredData()) {
      addNotification('error', 'Please unlock the app to change network settings.');
      return;
    }
    
    dispatch({type: 'SET_NETWORK_START'});
    try {
      // If app is locked (no sessionPassword) but no data exists (first time setup),
      // allow changing network. Use a dummy password for storeEncryptedData if no accounts exist.
      const passwordToUse = state.sessionPassword || "TEMPORARY_DUMMY_PASSWORD_FOR_NEW_WALLET_NETWORK_CHANGE"; 
      
      await localStorageService.updateNetworkSetting(network, passwordToUse);
      dispatch({type: 'SET_NETWORK_SUCCESS', payload: network});
      addNotification('success', `Network changed to ${network}.`);
    } catch (error) {
      console.error("Set network failed:", error);
      addNotification('error', `Failed to set network: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dispatch({type: 'SET_NETWORK_FAILURE'});
    }
  }, [addNotification, state.sessionPassword]);


  return (
    <AppContext.Provider value={{ state, dispatch, addNotification, unlockApp, addAccount, fetchAccountData, getActiveAccountDetails, clearAllData, setNetwork }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
