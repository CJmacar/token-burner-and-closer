import { Buffer } from 'buffer';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, createCloseAccountInstruction } from '@solana/spl-token';
import { supabase } from '@/lib/supabase';

export const fetchTokenMetadata = async (mintAddress: string) => {
  try {
    console.log('Calling edge function for mint:', mintAddress);
    const { data, error } = await supabase.functions.invoke('get-token-metadata', {
      body: { mintAddress }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    console.log('Metadata received from edge function:', data);
    return data.symbol || 'Unknown';
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
  const mintPubkey = new PublicKey(mint);
  const tokenAccountPubkey = new PublicKey(tokenAddress);
  
  const tokenAccountInfo = await connection.getAccountInfo(tokenAccountPubkey);
  if (!tokenAccountInfo) throw new Error('Token account not found');
  
  const transaction = new Transaction();
  
  const burnInstruction = createBurnInstruction(
    tokenAccountPubkey,
    mintPubkey,
    publicKey,
    1,
    []
  );
  
  const closeInstruction = createCloseAccountInstruction(
    tokenAccountPubkey,
    publicKey,
    publicKey,
    []
  );
  
  transaction.add(burnInstruction, closeInstruction);
  return transaction;
};