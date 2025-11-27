import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-insights-blue to-insights-navy flex items-center justify-center">
              <span className="text-white font-bold text-xs">OST</span>
            </div>
            <span className="font-bold text-xl">Ortho Scan Tool</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
