import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import PBKDF2 from 'crypto-js/pbkdf2';
import Hex from 'crypto-js/enc-hex';
import WordArray from 'crypto-js/lib-typedarrays'; // For salt
import { StoredAccount, HederaNetworkType } from '../types';
import { LOCAL_STORAGE_KEY, DEFAULT_NETWORK, THEME_STORAGE_KEY, DEFAULT_THEME_NAME } from '../constants';

const SALT_SIZE = 16; // bytes
const KEY_SIZE = 256 / 32; // 256-bit key
const ITERATIONS = 100000;

interface StoredData {
  accounts: StoredAccount[];
  settings: {
    network: HederaNetworkType;
  };
}

function deriveKey(password: string, salt: WordArray): WordArray {
  return PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
  });
}

export const localStorageService = {
  async storeEncryptedData(accounts: StoredAccount[], network: HederaNetworkType, password: string): Promise<void> {
    try {
      const salt = WordArray.random(SALT_SIZE); // This is the master salt for the whole data blob
      const key = deriveKey(password, salt);

      const dataToStore: StoredData = { accounts, settings: { network } };
      const encryptedData = AES.encrypt(JSON.stringify(dataToStore), key.toString(Hex), {
        iv: salt, 
      }).toString();
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ salt: salt.toString(Hex), data: encryptedData }));
    } catch (error) {
      console.error("Error storing encrypted data:", error);
      throw new Error("Failed to store data securely.");
    }
  },

  async retrieveAndDecryptData(password: string): Promise<StoredData | null> {
    try {
      const storedPayload = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!storedPayload) {
        return null;
      }

      const { salt: saltHex, data: encryptedData } = JSON.parse(storedPayload);
      if (!saltHex || !encryptedData) {
        console.warn("Incomplete data in localStorage.");
        return null; 
      }
      
      const salt = Hex.parse(saltHex); 
      const key = deriveKey(password, salt);

      const decryptedBytes = AES.decrypt(encryptedData, key.toString(Hex), { iv: salt });
      const decryptedJson = decryptedBytes.toString(Utf8);

      if (!decryptedJson) {
        throw new Error("Decryption failed (likely wrong password).");
      }
      return JSON.parse(decryptedJson) as StoredData;
    } catch (error) {
      console.error("Error retrieving or decrypting data:", error);
      if (error instanceof Error && error.message.includes("Decryption failed")) {
          throw error; 
      }
      return null;
    }
  },
  
  async encryptPrivateKey(privateKey: string, passwordForPKeyEncryption: string, existingSaltHex?: string): Promise<{encrypted: string, salt: string}> {
    const salt = existingSaltHex ? Hex.parse(existingSaltHex) : WordArray.random(SALT_SIZE);
    const key = deriveKey(passwordForPKeyEncryption, salt); 
    const encrypted = AES.encrypt(privateKey, key.toString(Hex), { iv: salt }).toString();
    return { encrypted, salt: salt.toString(Hex) };
  },

  async decryptPrivateKey(encryptedPrivateKey: string, passwordForPKeyDecryption: string, saltHex: string): Promise<string> {
    if (!saltHex) throw new Error("Salt is required for private key decryption.");
    const salt = Hex.parse(saltHex);
    const key = deriveKey(passwordForPKeyDecryption, salt);
    const decryptedBytes = AES.decrypt(encryptedPrivateKey, key.toString(Hex), { iv: salt });
    const decrypted = decryptedBytes.toString(Utf8);
    if (!decrypted) {
      throw new Error("Failed to decrypt private key (possibly wrong password or salt).");
    }
    return decrypted;
  },

  decryptPrivateKeySync(encryptedPrivateKey: string, passwordForPKeyDecryption: string, saltHex: string): string {
    if (!saltHex) throw new Error("Salt is required for private key decryption.");
    const salt = Hex.parse(saltHex);
    const key = deriveKey(passwordForPKeyDecryption, salt); 
    const decryptedBytes = AES.decrypt(encryptedPrivateKey, key.toString(Hex), { iv: salt });
    const decrypted = decryptedBytes.toString(Utf8);
    if (!decrypted) {
      throw new Error("Failed to decrypt private key (possibly wrong password or salt).");
    }
    return decrypted;
  },


  clearAllData(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Also clear theme preference on full data wipe
    localStorage.removeItem(THEME_STORAGE_KEY);
  },

  hasStoredData(): boolean {
    return localStorage.getItem(LOCAL_STORAGE_KEY) !== null;
  },

  async addAccount(newAccount: StoredAccount, sessionPassword: string): Promise<StoredData> {
    const existingData = await this.retrieveAndDecryptData(sessionPassword);
    const accounts = existingData?.accounts || [];
    const network = existingData?.settings?.network || DEFAULT_NETWORK;
    
    if (accounts.find(acc => acc.id === newAccount.id && acc.network === newAccount.network)) {
      throw new Error(`Account ${newAccount.id} on ${newAccount.network} already exists.`);
    }
    
    const updatedAccounts = [...accounts, newAccount];
    await this.storeEncryptedData(updatedAccounts, network, sessionPassword);
    return { accounts: updatedAccounts, settings: { network } };
  },

  async getAccounts(sessionPassword: string): Promise<StoredAccount[]> {
    const data = await this.retrieveAndDecryptData(sessionPassword);
    return data?.accounts || [];
  },

  async updateNetworkSetting(network: HederaNetworkType, sessionPassword: string): Promise<StoredData> {
    const existingData = await this.retrieveAndDecryptData(sessionPassword);
    const accounts = existingData?.accounts || [];
    await this.storeEncryptedData(accounts, network, sessionPassword);
    return { accounts, settings: { network } };
  },

  async getNetworkSetting(password?: string): Promise<HederaNetworkType> {
    if (password) {
        try {
            const data = await this.retrieveAndDecryptData(password);
            return data?.settings?.network || DEFAULT_NETWORK;
        } catch (e) {
           // Decryption failed or no data, fall through to default
        }
    }
    return DEFAULT_NETWORK;
  },

  // Theme preference methods (not encrypted)
  getThemePreference(): string {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_NAME;
  },

  setThemePreference(themeName: string): void {
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  }
};