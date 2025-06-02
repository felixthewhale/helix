import React from 'react';
import { StoredAccount, AccountBalance } from '../types';
import { Hbar } from '@hashgraph/sdk';

interface AccountItemProps {
  account: StoredAccount;
  balance?: AccountBalance;
  onSelect: (accountId: string) => void;
  isSelected: boolean;
  networkSymbol: string;
}

const AccountItem: React.FC<AccountItemProps> = ({ account, balance, onSelect, isSelected, networkSymbol }) => {
  const displayBalance = balance ? `${balance.hbars.toString()}` : 'Loading...';

  return (
    <li
      onClick={() => onSelect(account.id)}
      className={`p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 ease-in-out mb-3 border
                  ${isSelected ? 'bg-accent-green text-text-on-accent border-accent-green ring-2 ring-accent-green/50 shadow-lg' : 'bg-card-bg text-text-primary border-border-color hover:border-accent-green/70 hover:shadow-lg'}
                  transform ${isSelected ? 'scale-105' : 'hover:scale-102'}`}
      aria-current={isSelected ? "page" : undefined}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className={`text-lg font-semibold ${isSelected ? 'text-text-on-accent' : 'text-text-primary'}`}>{account.nickname}</p>
          <p className={`text-xs break-all ${isSelected ? 'text-text-on-accent opacity-80' : 'text-text-secondary'}`}>
            ID: {account.id} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isSelected ? 'bg-white/20 text-text-on-accent' : 'bg-accent-grey/20 text-text-primary'}`}>{networkSymbol}</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-medium ${isSelected ? 'text-text-on-accent' : 'text-text-primary'}`}>{displayBalance}</p>
        </div>
      </div>
    </li>
  );
};

export default AccountItem;