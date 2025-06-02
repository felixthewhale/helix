import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext'; // Import ThemeProvider
import { NotificationContainer } from './components/Notification';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import AccountList from './components/AccountList';
import AccountDetails from './components/AccountDetails';
import AddAccountForm from './components/AddAccountForm';
import SendTransactionForm from './components/SendTransactionForm';
import SettingsPanel from './components/SettingsPanel';
import { APP_NAME } from './constants';

// Helper component to render NotificationContainer using context
const GlobalNotifications: React.FC = () => {
  const { state, dispatch } = useAppContext();
  return (
    <NotificationContainer
      notifications={state.notifications}
      onDismiss={(id) => dispatch({ type: 'DISMISS_NOTIFICATION', payload: id })}
    />
  );
};

const AppContent: React.FC = () => {
  const { state } = useAppContext();

  if (!state.isInitialized) {
    return (
      // The bg-primary-bg and text-text-primary will pick up CSS vars
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary-bg text-text-primary">
        <LoadingSpinner size="lg" message={`Initializing ${APP_NAME}...`} />
      </div>
    );
  }

  if (state.isAppLocked) {
    return <AuthScreen />;
  }

  // Main application routes are rendered within the Layout
  // AccountDetails or AccountList decision for '/' path
  const MainContentRouteElement = () => {
    const { state: appState } = useAppContext(); // Re-access state here if needed for routing decision
    if (appState.activeAccountId && appState.accounts.find(acc => acc.id === appState.activeAccountId && acc.network === appState.network)) {
      return <AccountDetails />;
    }
    return <AccountList />;
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MainContentRouteElement />} />
        <Route path="/add-account" element={<AddAccountForm />} />
        <Route path="/send" element={<SendTransactionForm />} />
        <Route path="/settings" element={<SettingsPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider> {/* Wrap AppProvider (and everything else) with ThemeProvider */}
      <AppProvider>
        <GlobalNotifications />
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
