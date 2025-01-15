import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { TokenBurner } from '@/components/TokenBurner';
import { useSupabaseSecret } from '@/hooks/useSupabaseSecret';
import '@solana/wallet-adapter-react-ui/styles.css';

const Index = () => {
  const network = WalletAdapterNetwork.Mainnet;
  const { data: heliusKey, isLoading } = useSupabaseSecret('HELIUS_KEY');
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!heliusKey) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-600">
            The Helius API key is not configured. Please set it in the project secrets.
          </p>
        </div>
      </div>
    );
  }
  
  const endpoint = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets}
        autoConnect
      >
        <WalletModalProvider>
          <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 animate-in">
                <h1 className="text-4xl font-bold mb-4">
                  Solana Token Burner
                </h1>
                <p className="text-lg text-muted-foreground">
                  Burn tokens and reclaim your SOL
                </p>
              </div>
              <TokenBurner heliusKey={heliusKey}/>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Index;