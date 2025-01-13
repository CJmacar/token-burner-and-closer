import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID, createBurnInstruction, getAssociatedTokenAddress, createCloseAccountInstruction } from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import { WalletButton } from './WalletButton';
import { TokenList } from './TokenList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const fetchTokenMetadata = async (mintAddress: string, heliusKey: string) => {
  try {
    const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${heliusKey}&mint=${mintAddress}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
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

export const TokenBurner = (heliusKey) => {
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
      console.log('Fetching token accounts for public key:', publicKey.toBase58());
      setIsLoading(true);
      
      const response = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID },
        'confirmed'
      );

      if (!response || !response.value) {
        throw new Error('Failed to fetch token accounts');
      }

      console.log('Found token accounts:', response.value.length);

      const tokenAccounts = response.value
        .filter(account => {
          const parsedInfo = account.account.data.parsed.info;
          const balance = parsedInfo.tokenAmount.uiAmount;
          console.log(`Token ${parsedInfo.mint} balance: ${balance}`);
          return balance > 0;
        })
        .map(account => {
          const parsedInfo = account.account.data.parsed.info;
          const symbol = await fetchTokenMetadata(parsedInfo.mint, heliusKey);
              return {
                mint: parsedInfo.mint,
                balance: parsedInfo.tokenAmount.uiAmount,
                symbol: symbol,
                address: account.pubkey.toBase58()
              };
        });

      console.log('Processed token accounts:', tokenAccounts);
      setTokens(tokenAccounts);
    } catch (error) {
      console.error('Error fetching token accounts:', error);
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
      
      // Get token account info
      const tokenAccountInfo = await connection.getAccountInfo(tokenAccountPubkey);
      if (!tokenAccountInfo) throw new Error('Token account not found');
      
      // Create burn instruction
      const burnInstruction = createBurnInstruction(
        tokenAccountPubkey,
        mintPubkey,
        publicKey,
        1, // amount to burn
        []
      );
      
      // Create close account instruction
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
      
      // Refresh token accounts
      await fetchTokenAccounts();
    } catch (error) {
      console.error('Error burning token:', error);
      toast({
        title: "Error",
        description: "Failed to burn token",
        variant: "destructive",
      });
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to burn all tokens",
        variant: "destructive",
      });
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