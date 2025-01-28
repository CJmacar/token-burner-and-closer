import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/components/ui/use-toast';
import { fetchTokenAccounts, createBurnTransaction } from '@/utils/tokenOperations';

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
      const transaction = await createBurnTransaction(
        connection,
        publicKey,
        mint,
        tokenAddress
      );
      
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);
      
      toast({
        title: "Success",
        description: "Token burned successfully",
      });
      
      await refreshTokens();
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