import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';

export const WalletButton = () => {
  const { connected } = useWallet();

  return (
    <div className={cn(
      "relative inline-block",
      "animate-in",
      connected && "opacity-90 hover:opacity-100 transition-opacity"
    )}>
      <WalletMultiButton className={cn(
        "!bg-primary !h-11 !px-6 !rounded-lg !font-medium",
        "!transition-all !duration-200",
        "hover:!brightness-110",
        "flex items-center gap-2",
        "!font-sans",
        connected && "!bg-secondary !text-secondary-foreground"
      )} />
    </div>
  );
};