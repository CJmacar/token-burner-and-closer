import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface TokenCardProps {
  mint: string;
  balance: number;
  symbol: string;
  address: string;
  onBurn: (mint: string, address: string) => Promise<void>;
}

export const TokenCard = ({ mint, balance, symbol, address, onBurn }: TokenCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBurn = async () => {
    try {
      setIsLoading(true);
      await onBurn(mint, address);
      toast({
        title: "Success",
        description: `Burned ${balance} ${symbol} tokens`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to burn tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "glass-card p-6 rounded-xl",
      "transform transition-all duration-200",
      "hover:translate-y-[-2px]",
      "animate-in"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-medium text-muted-foreground">Token</span>
          <h3 className="text-lg font-semibold">{symbol}</h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-muted-foreground">Balance</span>
          <p className="text-lg font-semibold">{balance}</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-sm text-muted-foreground truncate">
          {mint}
        </p>
        <Button 
          onClick={handleBurn}
          disabled={isLoading}
          className="w-full button-gradient"
        >
          {isLoading ? "Burning..." : "Burn Tokens"}
        </Button>
      </div>
    </div>
  );
};