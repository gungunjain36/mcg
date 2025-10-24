import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Wallet } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold">mcg.fun</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-smooth ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Markets
            </Link>
            <Link
              to="/browse"
              className={`text-sm font-medium transition-smooth ${
                isActive('/browse') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Browse NFTs
            </Link>
            <Link
              to="/portfolio"
              className={`text-sm font-medium transition-smooth ${
                isActive('/portfolio') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Portfolio
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <User className="h-4 w-4" />
            </Button>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button size="sm" className="gap-2" onClick={openConnectModal}>
                            <Wallet className="h-4 w-4" />
                            <span className="hidden sm:inline">Connect</span>
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button size="sm" variant="destructive" onClick={openChainModal}>
                            Wrong network
                          </Button>
                        );
                      }

                      return (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={openChainModal}
                            className="gap-2"
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="h-4 w-4"
                              />
                            )}
                            <span className="hidden sm:inline">{chain.name}</span>
                          </Button>

                          <Button size="sm" onClick={openAccountModal} className="gap-2">
                            <Wallet className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              {account.displayName}
                            </span>
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
