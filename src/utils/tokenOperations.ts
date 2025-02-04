import { Buffer } from 'buffer';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, createCloseAccountInstruction, getAccount } from '@solana/spl-token';

export const fetchTokenMetadata = async (mintAddress: string) => {
  try {
    console.log('Fetching metadata for mint:', mintAddress);
    const HELIUS_KEY = import.meta.env.VITE_HELIUS_KEY;
    
    if (!HELIUS_KEY) {
      console.error('HELIUS_KEY not configured');
      return 'Unknown';
    }

    const response = await fetch('https://api.helius.xyz/v0/token-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAccounts: [mintAddress],
        apiKey: HELIUS_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch metadata from Helius');
    }

    const data = await response.json();
    console.log('Metadata received from Helius:', data);
    
    if (data && data[0] && data[0].onChainMetadata?.metadata?.symbol) {
      return data[0].onChainMetadata.metadata.symbol;
    }
    
    return 'Unknown';
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return 'Unknown';
  }
};

export const fetchTokenAccounts = async (
  connection: Connection,
  publicKey: PublicKey
) => {
  console.log('Starting token fetch for wallet:', publicKey.toBase58());
  
  const response = await connection.getParsedTokenAccountsByOwner(
    publicKey,
    { programId: TOKEN_PROGRAM_ID },
    'confirmed'
  );

  if (!response || !response.value) {
    throw new Error('Failed to fetch token accounts');
  }

  console.log('Raw token accounts found:', response.value.length);

  const filteredAccounts = response.value.filter(account => {
    const parsedInfo = account.account.data.parsed.info;
    const balance = parsedInfo.tokenAmount.uiAmount;
    console.log(`Token ${parsedInfo.mint} has balance: ${balance}`);
    return balance > 0;
  });

  console.log('Filtered accounts with balance > 0:', filteredAccounts.length);

  const tokenAccounts = await Promise.all(
    filteredAccounts.map(async account => {
      const parsedInfo = account.account.data.parsed.info;
      console.log('Fetching metadata for token:', parsedInfo.mint);
      const symbol = await fetchTokenMetadata(parsedInfo.mint);
      return {
        mint: parsedInfo.mint,
        balance: parsedInfo.tokenAmount.uiAmount,
        symbol: symbol,
        address: account.pubkey.toBase58()
      };
    })
  );

  return tokenAccounts;
};

export const createBurnTransaction = async (
  connection: Connection,
  publicKey: PublicKey,
  mint: string,
  tokenAddress: string
): Promise<Transaction> => {
  console.log('Creating burn transaction for:', {
    mint,
    tokenAddress,
    owner: publicKey.toBase58()
  });

  const mintPubkey = new PublicKey(mint);
  const tokenAccountPubkey = new PublicKey(tokenAddress);
  
  // Get token account info to verify balance
  const tokenAccount = await getAccount(connection, tokenAccountPubkey);
  console.log('Token account balance:', tokenAccount.amount.toString());
  
  if (tokenAccount.amount.toString() === '0') {
    throw new Error('Token account has zero balance');
  }

  const transaction = new Transaction();
  
  // Create burn instruction for the entire balance
  const burnInstruction = createBurnInstruction(
    tokenAccountPubkey,
    mintPubkey,
    publicKey,
    Number(tokenAccount.amount),
    []
  );
  
  // Create close account instruction
  const closeInstruction = createCloseAccountInstruction(
    tokenAccountPubkey,
    publicKey, // Send remaining SOL to the owner
    publicKey,
    []
  );
  
  // Add both instructions to the transaction
  transaction.add(burnInstruction, closeInstruction);
  
  console.log('Burn transaction created with instructions:', transaction.instructions.length);
  return transaction;
};