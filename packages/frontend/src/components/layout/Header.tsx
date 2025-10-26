import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Wallet } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import logo from '../../../public/logo.png';

const NAV_LINKS = [
  { to: "/", label: "Markets" },
  { to: "/browse", label: "Browse NFTs" },
  { to: "/portfolio", label: "Portfolio" },
];

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-7 w-20" />
            <span className="text-lg font-semibold">mcg.fun</span>
          </Link>
          {/* Navbar "pills" navigation */}
          <nav className="hidden md:flex items-center">
            <div className="flex space-x-2 px-1.5 py-1 rounded-full border border-border bg-background/70 backdrop-blur-lg">
              {NAV_LINKS.map((nav, idx) => (
                <Link
                  key={nav.to}
                  to={nav.to}
                  className={`text-sm font-medium transition-smooth rounded-full px-4 py-1.5
                    ${
                      isActive(nav.to)
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }
                  `}
                  style={{ transition: 'background 0.15s, color 0.15s' }}
                >
                  {nav.label}
                </Link>
              ))}
            </div>
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
