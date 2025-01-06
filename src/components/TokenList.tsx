import { TokenCard } from './TokenCard';
import { cn } from '@/lib/utils';

interface TokenAccount {
  mint: string;
  balance: number;
  symbol: string;
}

interface TokenListProps {
  tokens: TokenAccount[];
  onBurnToken: (mint: string) => Promise<void>;
}

export const TokenList = ({ tokens, onBurnToken }: TokenListProps) => {
  if (tokens.length === 0) {
    return (
      <div className="text-center py-12 animate-in">
        <p className="text-lg text-muted-foreground">No tokens found</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "animate-in"
    )}>
      {tokens.map((token) => (
        <TokenCard
          key={token.mint}
          {...token}
          onBurn={() => onBurnToken(token.mint)}
        />
      ))}
    </div>
  );
};