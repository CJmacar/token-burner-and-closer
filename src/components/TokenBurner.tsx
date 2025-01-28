import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from './WalletButton';
import { TokenList } from './TokenList';
import { Button } from '@/components/ui/button';
import { useTokenManagement } from '@/hooks/useTokenManagement';

export const TokenBurner = () => {
  const { connected } = useWallet();
  const { tokens, isLoading, refreshTokens, burnToken, burnAllTokens } = useTokenManagement();

  useEffect(() => {
    if (connected) {
      console.log('Wallet connected, fetching token accounts...');
      refreshTokens();
    }
  }, [connected, refreshTokens]);

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
                onClick={burnAllTokens}
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
            <TokenList tokens={tokens} onBurnToken={burnToken} />
          )}
        </div>
      )}
    </div>
  );
};