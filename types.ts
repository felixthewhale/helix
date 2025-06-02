
import { Hbar, PrivateKey, PublicKey } from '@hashgraph/sdk';

export enum HederaNetworkType {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  // Previewnet = 'previewnet',
  // LocalNode = 'localnode', // If supporting local node
}

export interface NetworkConfig {
  name: HederaNetworkType;
  mirrorNodeUrl: string;
  node?: { [key: string]: string }; // For custom node configurations
}

export interface StoredAccount {
  id: string; // AccountId string e.g. "0.0.12345"
  nickname: string;
  publicKey: string; // Public key string
  encryptedPrivateKey: string; // AES Encrypted private key string
  privateKeySalt: string; // Salt used for this specific private key's encryption
  network: HederaNetworkType; // Network this account was created/imported for
}

export interface DecryptedAccount extends Omit<StoredAccount, 'encryptedPrivateKey' | 'privateKeySalt'> {
  privateKey: PrivateKey;
  publicKeyInstance: PublicKey;
}

export interface AccountBalance {
  hbars: Hbar;
  // tokens?: any[]; // For future token support
}

export interface TransactionRecord {
  id: string;
  type: string; // e.g., "HBAR Transfer"
  timestamp: string;
  amount?: string; // e.g., "+ 10 HBAR" or "- 5 HBAR"
  memo?: string;
  status: string;
  parties?: string; // e.g. "To: 0.0.X / From: 0.0.Y"
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}