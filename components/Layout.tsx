import React, { useState, ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { APP_NAME } from '../constants';

interface LayoutProps {
  children: ReactNode;
}

const NavItem: React.FC<{ to: string; icon: ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center px-3 py-3 rounded-lg transition-colors duration-150 ease-in-out group
       ${isActive ? 'bg-accent-green text-text-on-accent shadow-md' : 'text-text-primary hover:bg-accent-green/10 hover:text-accent-green'}`
    }
  >
    <span className="mr-3 flex-shrink-0 h-6 w-6">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </NavLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, dispatch, addNotification } = useAppContext();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLockWallet = () => {
    dispatch({ type: 'LOCK_APP' });
    addNotification('info', 'Wallet Locked.');
    setSidebarOpen(false); 
  };
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return state.activeAccountId ? "Account Details" : "My Accounts";
      case '/add-account': return "Add Account";
      case '/send': return "Send HBAR"; 
      case '/settings': return "Settings";
      default: return APP_NAME;
    }
  };

  const navItems = [
    { to: "/", icon: <HomeIcon />, label: "Accounts" },
    { to: "/add-account", icon: <PlusCircleIcon />, label: "Add Account" },
    { to: "/send", icon: <PaperAirplaneIcon />, label: "Send Transaction" },
    { to: "/settings", icon: <CogIcon />, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-primary-bg text-text-primary">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-primary-bg shadow-2xl border-r border-border-color transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-20 hover:w-64 group/sidebar'}`}>
        <div className={`flex items-center justify-between h-16 px-4 border-b border-border-color ${sidebarOpen ? '' : 'md:justify-center'}`}>
          <NavLink to="/" className={`flex items-center text-xl font-bold text-text-primary whitespace-nowrap ${sidebarOpen ? '' : 'md:hidden md:group-hover/sidebar:flex'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-2 text-accent-green">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <span className={`${sidebarOpen ? '' : 'md:hidden md:group-hover/sidebar:inline'}`}>{APP_NAME.split(' ')[0]}</span>
          </NavLink>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-text-secondary hover:text-text-primary md:hidden">
            <MenuAlt2Icon />
          </button>
        </div>
        <nav className={`flex-grow p-3 space-y-2 overflow-y-auto ${sidebarOpen ? '' : 'md:[&_span:not(:first-child)]:hidden md:group-hover/sidebar:[&_span:not(:first-child)]:inline'}`}>
          {navItems.map(item => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>
        <div className={`p-3 border-t border-border-color ${sidebarOpen ? '' : 'md:[&_span]:hidden md:group-hover/sidebar:[&_span]:inline'}`}>
          <button
            onClick={handleLockWallet}
            className="flex items-center w-full px-3 py-3 rounded-lg text-accent-red hover:bg-accent-red hover:text-text-on-accent transition-colors group"
          >
            <LockClosedIcon />
            <span className="ml-3 text-sm font-medium">Lock Wallet</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-6 bg-primary-bg border-b border-border-color shadow-sm">
           <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="text-text-secondary hover:text-text-primary md:hidden mr-4">
                <MenuIcon />
            </button>
            <h1 className="text-xl font-semibold text-text-primary">{getPageTitle()}</h1>
          </div>
          <div className="text-sm text-text-secondary">
            Network: <span className="font-semibold text-accent-green">{state.network}</span>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-primary-bg p-2 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Icons with current color for better contrast on light bg
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-inherit"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-inherit"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PaperAirplaneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-inherit"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-inherit"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LockClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-inherit" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const MenuAlt2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;

export default Layout;