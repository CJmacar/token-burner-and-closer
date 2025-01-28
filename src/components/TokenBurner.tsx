import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID, createBurnInstruction, getAssociatedTokenAddress, createCloseAccountInstruction } from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import { WalletButton } from './WalletButton';
import { TokenList } from './TokenList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

const fetchTokenMetadata = async (mintAddress: string) => {
  try {
    console.log('Fetching metadata for mint:', mintAddress);
    const { data, error } = await supabase.functions.invoke('get-token-metadata', {
      body: { mintAddress }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    console.log('Metadata received:', data);
    return data.symbol || 'Unknown';
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return 'Unknown';
  }
};

interface TokenAccount {
  mint: string;
  balance: number;
  symbol: string;
  address: string;
}

export const TokenBurner = () => {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const [tokens, setTokens] = useState<TokenAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTokenAccounts = async () => {
    if (!publicKey) {
      console.log('No public key available');
      return;
    }

    try {
      console.log('Starting token fetch for wallet:', publicKey.toBase58());
      setIsLoading(true);
      
      const response = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID },
        'confirmed'
      );

      if (!response || !response.value) {
        console.error('Failed to fetch token accounts - no response or empty value');
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

      const tokenAccounts = filteredAccounts.map(async account => {
        const parsedInfo = account.account.data.parsed.info;
        console.log('Fetching metadata for token:', parsedInfo.mint);
        const symbol = await fetchTokenMetadata(parsedInfo.mint);
        return {
          mint: parsedInfo.mint,
          balance: parsedInfo.tokenAmount.uiAmount,
          symbol: symbol,
          address: account.pubkey.toBase58()
        };
      });

      console.log('Processing', tokenAccounts.length, 'token accounts...');
      const resolvedTokenAccounts = await Promise.all(tokenAccounts);
      console.log('Final processed tokens:', resolvedTokenAccounts);
      setTokens(resolvedTokenAccounts);
    } catch (error) {
      console.error('Error in fetchTokenAccounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch token accounts. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      console.log('Wallet connected, fetching token accounts...');
      fetchTokenAccounts();
    } else {
      console.log('Wallet disconnected, clearing tokens');
      setTokens([]);
    }
  }, [connected, publicKey, connection]);

  const handleBurnToken = async (mint: string, tokenAddress: string) => {
    if (!publicKey) return;

    try {
      const mintPubkey = new PublicKey(mint);
      const tokenAccountPubkey = new PublicKey(tokenAddress);
      
      const transaction = new Transaction();
      
      const tokenAccountInfo = await connection.getAccountInfo(tokenAccountPubkey);
      if (!tokenAccountInfo) throw new Error('Token account not found');
      
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
      
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);
      
      toast({
        title: "Success",
        description: "Token burned successfully",
      });
      
      await fetchTokenAccounts();
    } catch (error: any) {
      console.error('Error burning token:', error);
      
      // Handle user rejection specifically
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('rejected') || errorMessage.includes('user rejected')) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to burn token. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBurnAll = async () => {
    try {
      for (const token of tokens) {
        await handleBurnToken(token.mint, token.address);
      }
      toast({
        title: "Success",
        description: "All tokens burned successfully",
      });
    } catch (error: any) {
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('rejected') || errorMessage.includes('user rejected')) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to burn all tokens",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <WalletButton />
      </div>

      {connected && (
        <div className="space-y-8 animate-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Your Tokens</h2>
            {tokens.length > 0 && (
              <Button
                onClick={handleBurnAll}
                className="button-gradient"
              >
                Burn All Tokens
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Loading tokens...</p>
            </div>
          ) : (
            <TokenList tokens={tokens} onBurnToken={handleBurnToken} />
          )}
        </div>
      )}
    </div>
  );
};
