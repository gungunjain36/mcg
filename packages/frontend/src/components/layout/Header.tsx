import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Wallet, User } from 'lucide-react';

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
            <Button size="sm" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Connect</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
