
import { 
  Client, 
  PrivateKey, 
  AccountId, 
  Hbar, 
  AccountBalanceQuery, 
  TransferTransaction,
  TransactionReceiptQuery,
  TransactionResponse,
  PublicKey,
  AccountCreateTransaction,
  AccountInfoQuery,
  TransactionRecordQuery,
  TransactionId
} from '@hashgraph/sdk';
import { HederaNetworkType, NetworkConfig, AccountBalance, TransactionRecord as AppTransactionRecord } from '../types';
import { HEDERA_NETWORKS }
from '../constants';

let client: Client;

function getClientForNetwork(network: HederaNetworkType): Client {
  const networkConfig = HEDERA_NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }

  if (network === HederaNetworkType.Mainnet) {
    return Client.forMainnet();
  } else if (network === HederaNetworkType.Testnet) {
    return Client.forTestnet();
  }
  throw new Error(`Client configuration not found for network: ${network}`);
}

export function initializeHederaClient(network: HederaNetworkType): void {
  client = getClientForNetwork(network);
}

function getClient(): Client {
  if (!client) {
    console.warn("Hedera client not explicitly initialized, defaulting to testnet. Call initializeHederaClient first.");
    initializeHederaClient(HederaNetworkType.Testnet);
  }
  return client;
}

// Helper to format transaction names (e.g., CRYPTOTRANSFER -> Crypto Transfer)
function formatTxName(rawName?: string): string {
  if (!rawName) return 'Unknown Operation';
  return rawName
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


export const hederaService = {
  generateKeys(): { privateKey: PrivateKey, publicKey: PublicKey, accountIdCandidate?: AccountId } {
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;
    return { privateKey, publicKey };
  },

  async createHederaAccount(payerAccountId: string, payerPrivateKey: PrivateKey, initialBalance: Hbar = new Hbar(0)): Promise<{newAccountId: AccountId, newPrivateKey: PrivateKey, newPublicKey: PublicKey}> {
    const currentClient = getClient();
    currentClient.setOperator(AccountId.fromString(payerAccountId), payerPrivateKey);

    const newPrivateKey = PrivateKey.generateED25519();
    const newPublicKey = newPrivateKey.publicKey;

    const tx = await new AccountCreateTransaction()
        .setKey(newPublicKey)
        .setInitialBalance(initialBalance)
        .execute(currentClient);

    const receipt = await tx.getReceipt(currentClient);
    const newAccountId = receipt.accountId;

    if (!newAccountId) {
        throw new Error("Account creation failed, new account ID is null.");
    }
    return { newAccountId, newPrivateKey, newPublicKey };
  },

  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    const currentClient = getClient();
    const query = new AccountBalanceQuery().setAccountId(accountId);
    const accountBalance = await query.execute(currentClient);
    return {
      hbars: accountBalance.hbars,
    };
  },
  
  async getAccountInfo(accountId: string): Promise<any> { 
    const currentClient = getClient();
    const query = new AccountInfoQuery().setAccountId(accountId);
    const accountInfo = await query.execute(currentClient);
    return accountInfo;
  },

  async transferHbar(
    senderAccountIdStr: string,
    senderPrivateKey: PrivateKey,
    recipientAccountIdStr: string,
    amount: Hbar,
    memo?: string
  ): Promise<{transactionId: TransactionId, receiptStatus: string}> {
    const currentClient = getClient();
    const senderAccountId = AccountId.fromString(senderAccountIdStr);
    const recipientAccountId = AccountId.fromString(recipientAccountIdStr);

    currentClient.setOperator(senderAccountId, senderPrivateKey);

    const transferTx = new TransferTransaction()
      .addHbarTransfer(senderAccountId, amount.negated())
      .addHbarTransfer(recipientAccountId, amount);

    if (memo) {
      transferTx.setTransactionMemo(memo);
    }

    const signedTx = await transferTx.freezeWith(currentClient).sign(senderPrivateKey);
    const txResponse = await signedTx.execute(currentClient);
    const receipt = await txResponse.getReceipt(currentClient);

    return { transactionId: txResponse.transactionId, receiptStatus: receipt.status.toString() };
  },

  async getTransactionHistory(accountId: string, network: HederaNetworkType): Promise<AppTransactionRecord[]> {
    const networkConfig = HEDERA_NETWORKS[network];
    const mirrorNodeUrl = `${networkConfig.mirrorNodeUrl}/transactions?account.id=${accountId}&order=desc&limit=25`; // Get last 25

    try {
      const response = await fetch(mirrorNodeUrl);
      if (!response.ok) {
        console.error(`Mirror node error: ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      
      return (data.transactions || []).map((tx: any): AppTransactionRecord => {
        let type = 'Unknown';
        let amountStr = '';
        let parties = '';
        let decodedMemo: string | undefined = undefined;

        if (tx.memo_base64) {
            try {
                const binaryString = atob(tx.memo_base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                decodedMemo = new TextDecoder().decode(bytes);
            } catch (e) {
                console.warn("Failed to decode memo_base64:", e);
                decodedMemo = "Error decoding memo"; 
            }
        }

        if (tx.name === 'CRYPTOTRANSFER') {
            let operationIdentified = false;
            // Check for NFT transfers
            if (tx.nft_transfers && tx.nft_transfers.length > 0) {
                const relevantNft = tx.nft_transfers.find((nft: any) => nft.sender_account_id === accountId || nft.receiver_account_id === accountId);
                if (relevantNft) {
                    operationIdentified = true;
                    type = 'NFT Transfer';
                    const direction = relevantNft.sender_account_id === accountId ? 'Sent' : 'Received';
                    amountStr = `${direction} NFT ${relevantNft.token_id} Ser#${relevantNft.serial_number}`;
                    parties = `From: ${relevantNft.sender_account_id} To: ${relevantNft.receiver_account_id}`;
                }
            }

            // Check for Fungible Token transfers if not an NFT transfer for this account
            if (!operationIdentified && tx.token_transfers && tx.token_transfers.length > 0) {
                const relevantTokenTf = tx.token_transfers.find((token_tf: any) => token_tf.account === accountId);
                if (relevantTokenTf) {
                    operationIdentified = true;
                    type = 'Token Transfer';
                    // TODO: Fetch token decimals for user-friendly amount. For now, raw amount.
                    const tokenAmountPrefix = relevantTokenTf.amount > 0 ? '+' : '';
                    // Assuming amount is an integer representing the smallest unit of the token
                    amountStr = `${tokenAmountPrefix}${relevantTokenTf.amount} (Token: ${relevantTokenTf.token_id})`;

                    if (relevantTokenTf.amount < 0) { // Sent
                        const receiver = tx.token_transfers.find((other_tf: any) => other_tf.token_id === relevantTokenTf.token_id && other_tf.amount > 0 && other_tf.account !== accountId);
                        parties = `To: ${receiver ? receiver.account : 'Multiple/Contract'}`;
                    } else { // Received
                        const sender = tx.token_transfers.find((other_tf: any) => other_tf.token_id === relevantTokenTf.token_id && other_tf.amount < 0 && other_tf.account !== accountId);
                        parties = `From: ${sender ? sender.account : 'Multiple/Contract'}`;
                    }
                }
            }
            
            // Check for HBAR transfers if not NFT or Token for this account
            if (!operationIdentified) {
                const hbarTransfersFiltered = tx.transfers?.filter((tr: any) => tr.asset_type === null || typeof tr.asset_type === 'undefined');
                const relevantHbarDirect = hbarTransfersFiltered?.find((tr: any) => tr.account === accountId && tr.amount !== 0);

                if (relevantHbarDirect) {
                    operationIdentified = true;
                    type = 'HBAR Transfer';
                    const amountHbar = Hbar.fromTinybars(relevantHbarDirect.amount);
                    amountStr = amountHbar.toString(); // Includes +/-

                    if (relevantHbarDirect.amount < 0) { // Sent HBAR
                        const receivers = hbarTransfersFiltered.filter((r: any) => r.amount > 0 && r.account !== accountId);
                        const mainReceiver = receivers.filter(r => !['0.0.98', '0.0.800', '0.0.801'].includes(r.account)).sort((a,b)=>b.amount-a.amount)[0] 
                                            || receivers.sort((a,b)=>b.amount-a.amount)[0];
                        parties = `To: ${mainReceiver ? mainReceiver.account : 'Multiple/Network'}`;
                    } else { // Received HBAR
                        const senders = hbarTransfersFiltered.filter((s: any) => s.amount < 0 && s.account !== accountId);
                        const mainSender = senders.sort((a,b)=>a.amount-b.amount)[0]; // most negative
                        parties = `From: ${mainSender ? mainSender.account : 'Multiple/Network'}`;
                    }
                }
            }
            // If still not identified within CRYPTOTRANSFER (e.g. only fee payments, or complex contract interaction)
            if (!operationIdentified) {
                type = formatTxName(tx.name); // Defaults to "Crypto Transfer"
            }

        } else { // Not a CRYPTOTRANSFER
            type = formatTxName(tx.name);
            if (tx.entity_id) {
                const entityRelevantTypes = [
                    'TOKENCREATION', 'TOKENMINT', 'TOKENBURN', 'TOKENWIPE', 'TOKENUPDATE', 'TOKENFREEZE', 'TOKENUNFREEZE', 
                    'TOKENGGRANTKYC', 'TOKENREVOKEKYC', 'TOKENSUSPEND', 'TOKENDELETE', 'TOKENFEESCHEDULEUPDATE',
                    'CONTRACTCREATEINSTANCE', 'CONTRACTCALL', 'CONTRACTUPDATEINSTANCE', 'CONTRACTDELETEINSTANCE', 
                    'CONSENSUSSUBMITMESSAGE', 'FILECREATE', 'FILEAPPEND', 'FILEUPDATE', 'FILEDELETE',
                    'SCHEDULECREATE', 'SCHEDULESIGN', 'SCHEDULEDELETE'
                ];
                if (entityRelevantTypes.includes(tx.name.toUpperCase())) {
                    parties = `Entity: ${tx.entity_id}`;
                }
            }
             // Special handling for TOKENASSOCIATE/DISSOCIATE if entity_id is not set but token_transfers is
            if ((tx.name.toUpperCase() === 'TOKENASSOCIATE' || tx.name.toUpperCase() === 'TOKENDISSOCIATE')) {
                if (tx.token_transfers && tx.token_transfers.length > 0) {
                     const associatedToken = tx.token_transfers.find((tt:any) => tt.account === accountId)?.token_id || tx.token_transfers[0]?.token_id;
                     if (associatedToken) parties = `Token: ${associatedToken}`;
                } else if (tx.entity_id) { // Fallback to entity_id if token_transfers is not helpful
                     parties = `Token: ${tx.entity_id}`;
                }
            }
        }
        
        // Ensure type is meaningful
        if (type === 'Unknown' && tx.name) {
            type = formatTxName(tx.name);
        }


        return {
          id: tx.transaction_id,
          type: type,
          timestamp: formatConsensusTimestamp(tx.consensus_timestamp),
          amount: amountStr,
          memo: decodedMemo,
          status: tx.result,
          parties: parties,
        };
      });
    } catch (error) {
      console.error("Failed to fetch transaction history:", error);
      return [];
    }
  },

  parseHederaError(error: any): string {
    if (error && error.message) {
        const regex = /[A-Z_]{5,}/gm; 
        const matches = error.message.match(regex);
        if (matches && matches.length > 0) {
            if (matches.some((m: string) => m.includes("TIMEOUT"))) return "NETWORK_TIMEOUT";
            const knownError = matches.find((m: string) => m !== 'TRANSACTION'); 
            if (knownError) return knownError;
            return matches[0]; 
        }
        if (error.message.toLowerCase().includes("failed to fetch")) return "NETWORK_ERROR";
        if (error.message.toLowerCase().includes("user rejected request")) return "USER_REJECTED";
    }
    if (error && error.toString) { 
        const errStr = error.toString();
        if(errStr.includes("Status.") || errStr.startsWith("Status")) { 
          return errStr.replace("Status.", "");
        }
    }
    return "UNKNOWN_ERROR";
  },
  
  isValidAccountId(accountId: string): boolean {
    try {
      AccountId.fromString(accountId);
      return true;
    } catch (e) {
      return false;
    }
  },

  isValidPrivateKey(privateKeyStr: string): boolean {
    try {
      PrivateKey.fromStringED25519(privateKeyStr); 
      return true;
    } catch (e) {
      try {
        PrivateKey.fromStringECDSA(privateKeyStr);
        return true;
      } catch (e2) {
        try {
            PrivateKey.fromString(privateKeyStr); 
            return true;
        } catch (e3) {
            return false;
        }
      }
    }
  }
};

function formatConsensusTimestamp(timestamp: string): string {
  if (!timestamp) return 'N/A';
  const [seconds, nanoseconds] = timestamp.split('.').map(Number);
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);
  return date.toLocaleString();
}
