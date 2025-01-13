import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { TokenBurner } from '@/components/TokenBurner';
import '@solana/wallet-adapter-react-ui/styles.css';

const Index = () => {
  const network = WalletAdapterNetwork.Mainnet;
  const heliusKey = import.meta.env.VITE_HELIUS_KEY;
  
  // More detailed logging for debugging
  console.log('Environment variables check:');
  console.log('VITE_HELIUS_KEY exists:', !!heliusKey);
  console.log('VITE_HELIUS_KEY length:', heliusKey?.length);
  
  if (!heliusKey) {
    console.error('VITE_HELIUS_KEY is not set. Please ensure it is set in GitHub Secrets.');
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-600">
            The Helius API key is not configured. Please check the GitHub repository secrets.
          </p>
        </div>
      </div>
    );
  }
  
  const endpoint = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

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