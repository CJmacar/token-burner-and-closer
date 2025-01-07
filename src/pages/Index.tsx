import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection } from '@solana/web3.js';
import { TokenBurner } from '@/components/TokenBurner';
import '@solana/wallet-adapter-react-ui/styles.css';

const Index = () => {
  // Use a more reliable RPC endpoint
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = "https://rpc.helius.xyz/?api-key=YOUR_API_KEY"; // We'll need to set this up securely
  
  // Initialize wallet adapter
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
              <TokenBurner />
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Index;