
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, X, Globe } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-insights-blue to-insights-navy flex items-center justify-center">
              <span className="text-white font-bold text-sm">SI</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">SimpleInsights.ai</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-insights-blue transition-colors">
            Home
          </Link>
          <Link to="/legal-assistant" className="text-sm font-medium hover:text-insights-blue transition-colors">
            Legal Assistant
          </Link>
          <Link to="/medical-reports" className="text-sm font-medium hover:text-insights-blue transition-colors">
            Medical Reports
          </Link>
          <Link to="/translation-assistant" className="text-sm font-medium hover:text-insights-blue transition-colors flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Translator
          </Link>
          <Link to="/orthodontic-analyzer" className="text-sm font-medium hover:text-insights-blue transition-colors">
            Orthodontic Analyzer
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border shadow-sm">
          <div className="container py-4 space-y-4">
            <Link 
              to="/" 
              className="block py-2 text-sm font-medium hover:text-insights-blue"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/legal-assistant" 
              className="block py-2 text-sm font-medium hover:text-insights-blue"
              onClick={() => setIsOpen(false)}
            >
              Legal Assistant
            </Link>
            <Link 
              to="/medical-reports" 
              className="block py-2 text-sm font-medium hover:text-insights-blue"
              onClick={() => setIsOpen(false)}
            >
              Medical Reports
            </Link>
            <Link 
              to="/translation-assistant" 
              className="flex items-center py-2 text-sm font-medium hover:text-insights-blue"
              onClick={() => setIsOpen(false)}
            >
              <Globe className="h-4 w-4 mr-1" />
              Translator
            </Link>
            <Link 
              to="/orthodontic-analyzer" 
              className="block py-2 text-sm font-medium hover:text-insights-blue"
              onClick={() => setIsOpen(false)}
            >
              Orthodontic Analyzer
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
