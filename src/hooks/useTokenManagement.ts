import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/components/ui/use-toast';
import { fetchTokenAccounts, createBurnTransaction } from '@/utils/tokenOperations';
import { PublicKey } from '@solana/web3.js';

export interface TokenAccount {
  mint: string;
  balance: number;
  symbol: string;
  address: string;
}

export const useTokenManagement = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokens, setTokens] = useState<TokenAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const refreshTokens = async () => {
    if (!publicKey) {
      console.log('No public key available');
      return;
    }

    try {
      setIsLoading(true);
      const tokenAccounts = await fetchTokenAccounts(connection, publicKey);
      setTokens(tokenAccounts);
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

  const burnToken = async (mint: string, tokenAddress: string) => {
    if (!publicKey) return;

    try {
      console.log('Starting burn process for token:', mint);
      
      const transaction = await createBurnTransaction(
        connection,
        publicKey,
        mint,
        tokenAddress
      );
      
      console.log('Sending burn transaction...');
      const signature = await sendTransaction(transaction, connection);
      
      console.log('Waiting for transaction confirmation...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      console.log('Transaction confirmed:', signature);
      
      // Verify the token account is closed
      try {
        await connection.getAccountInfo(new PublicKey(tokenAddress));
        throw new Error('Token account still exists');
      } catch (e) {
        // If getAccountInfo throws, it means the account is closed (good)
        console.log('Token account successfully closed');
        
        toast({
          title: "Success",
          description: "Token burned successfully",
        });
        
        await refreshTokens();
      }
    } catch (error: any) {
      console.error('Error burning token:', error);
      
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

  const burnAllTokens = async () => {
    try {
      for (const token of tokens) {
        await burnToken(token.mint, token.address);
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

  return {
    tokens,
    isLoading,
    refreshTokens,
    burnToken,
    burnAllTokens
  };
};