import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WalletButton } from './WalletButton';
import { TokenList } from './TokenList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface TokenAccount {
  mint: string;
  balance: number;
  symbol: string;
}

export const TokenBurner = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [tokens, setTokens] = useState<TokenAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTokenAccounts = async () => {
    if (!publicKey) return;

    try {
      setIsLoading(true);
      const accounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const tokenAccounts = accounts.value.map(account => {
        const parsedInfo = account.account.data.parsed.info;
        return {
          mint: parsedInfo.mint,
          balance: parsedInfo.tokenAmount.uiAmount,
          symbol: parsedInfo.tokenAmount.symbol || 'Unknown',
        };
      });

      setTokens(tokenAccounts);
    } catch (error) {
      console.error('Error fetching token accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch token accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connected) {
      fetchTokenAccounts();
    } else {
      setTokens([]);
    }
  }, [connected, publicKey]);

  const handleBurnToken = async (mint: string) => {
    // Implement token burning logic here
    console.log('Burning token:', mint);
    // This is a placeholder - implement actual burning logic
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleBurnAll = async () => {
    try {
      for (const token of tokens) {
        await handleBurnToken(token.mint);
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