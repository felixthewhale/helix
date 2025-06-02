
import { HederaNetworkType, NetworkConfig } from './types';

export const APP_NAME = "HELIX wallet";
export const LOCAL_STORAGE_KEY = "helixWalletData"; 

export const HEDERA_NETWORKS: { [key in HederaNetworkType]: NetworkConfig } = {
  [HederaNetworkType.Mainnet]: {
    name: HederaNetworkType.Mainnet,
    mirrorNodeUrl: "https://mainnet-public.mirrornode.hedera.com/api/v1",
  },
  [HederaNetworkType.Testnet]: {
    name: HederaNetworkType.Testnet,
    mirrorNodeUrl: "https://testnet.mirrornode.hedera.com/api/v1",
  },
  // Add other networks if needed
};

export const DEFAULT_NETWORK: HederaNetworkType = HederaNetworkType.Testnet;

export const DERIVATION_PATH_ED25519 = "m/44'/3030'/0'/0'/0'"; // Common for Hedera ED25519

export const MIN_PASSWORD_LENGTH = 8;

// Theme Constants
export const DEFAULT_THEME_NAME = 'whale';
export const THEME_STORAGE_KEY = 'helixWalletThemePreference';
