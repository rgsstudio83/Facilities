import { useState, useEffect } from 'react';
import { Menu, X, User, Newspaper, ArrowRight } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  onOpenPortal: () => void;
  onOpenQuote: () => void;
  onNavigate: (type: 'home' | 'servico' | 'local' | 'blog' | 'faq', slug?: string) => void;
  currentViewType: string; // 'home' | 'servico' | 'local' | 'blog' | 'faq'
  onOpenAdminDashboard: () => void;
}

export default function Header({ onOpenPortal, onOpenQuote, onNavigate, currentViewType, onOpenAdminDashboard }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      if (currentViewType === 'home') {
        // Simple active link detection on Home page
        const sections = ['home', 'servicos', 'sobre-nos', 'contato'];
        const scrollPosition = window.scrollY + 120;

        for (const section of sections) {
          const el = document.getElementById(section);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              setActiveSection(section);
              break;
            }
          }
        }
      } else {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentViewType]);

  const handleLinkClick = (href: string, id: string) => {
    setIsMobileMenuOpen(false);
    if (href === '#blog') {
      onNavigate('blog');
    } else if (href === '#faq-seo-section') {
      onNavigate('faq');
    } else {
      onNavigate('home');
      // If we are not on home, route to home first and then scroll
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const navLinks = [
    { name: 'Home', href: '#home', id: 'home' },
    { name: 'Serviços', href: '#servicos', id: 'servicos' },
    { name: 'Sobre Nós', href: '#sobre-nos', id: 'sobre-nos' },
    { name: 'Contato', href: '#contato', id: 'contato' },
    { name: 'Blog', href: '#blog', id: 'blog' },
    { name: 'FAQ', href: '#faq-seo-section', id: 'faq' },
  ];

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 w-full z-4xl transition-all duration-300 h-20 px-4 md:px-12 flex justify-between items-center ${
        isScrolled || currentViewType !== 'home'
          ? 'glass-header bg-white/95 backdrop-blur shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-b border-border-light'
          : 'bg-white'
      }`}
    >
      {/* Logo */}
      <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="flex items-center">
        <Logo className="h-14 md:h-16 w-auto object-contain" />
      </a>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-8">
        {navLinks.map((link) => {
          const isLinkActive = 
            (currentViewType === 'home' && activeSection === link.id) ||
            (currentViewType === 'blog' && link.id === 'blog') ||
            (currentViewType === 'faq' && link.id === 'faq');

          return (
            <a
              key={link.href}
              id={`nav-link-${link.id}`}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.href, link.id);
              }}
              className={`font-sans text-sm font-medium transition-colors hover:text-primary ${
                isLinkActive
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-secondary'
              }`}
            >
              {link.name}
            </a>
          );
        })}
      </nav>

      {/* Action Buttons */}
      <div className="hidden lg:flex items-center gap-4">
        <button
          id="header-quote-btn"
          onClick={onOpenQuote}
          className="text-primary hover:text-primary-hover font-medium text-sm px-4 py-2 transition-colors cursor-pointer"
        >
          Solicitar Cotação
        </button>
        <button
          id="header-portal-btn"
          onClick={onOpenPortal}
          className="bg-primary text-on-primary hover:bg-primary-hover px-5 py-2.5 rounded-lg font-sans text-sm font-semibold active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer border-0"
        >
          <User className="w-4 h-4" />
          Área do Condômino
        </button>
      </div>

      {/* Mobile Menu Actions */}
      <div className="flex lg:hidden items-center gap-2">
        <button
          id="mobile-portal-btn"
          onClick={onOpenPortal}
          className="bg-primary text-on-primary hover:bg-primary-hover p-2 rounded-lg font-sans text-sm active:scale-95 transition-all shadow-md flex items-center justify-center border-0"
          title="Área do Condômino"
        >
          <User className="w-5 h-5" />
        </button>
        <button
          id="mobile-toggle-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-on-surface hover:text-primary transition-colors cursor-pointer border-0"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" className="absolute top-20 left-0 w-full bg-white border-b border-border-light shadow-lg py-6 px-4 flex flex-col gap-4 md:hidden animate-fade-in">
          {navLinks.map((link) => {
            const isLinkActive = 
              (currentViewType === 'home' && activeSection === link.id) ||
              (currentViewType === 'blog' && link.id === 'blog') ||
              (currentViewType === 'faq' && link.id === 'faq');

            return (
              <a
                key={link.href}
                id={`mobile-nav-link-${link.id}`}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.href, link.id);
                }}
                className={`font-sans font-medium text-base py-2 border-b border-gray-50 flex items-center ${
                  isLinkActive ? 'text-primary pl-2 border-l-2 border-primary' : 'text-secondary'
                }`}
              >
                {link.name}
              </a>
            );
          })}
          <div className="flex flex-col gap-2 pt-4">
            <button
              id="mobile-quote-btn"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenQuote();
              }}
              className="bg-surface-container text-primary font-semibold py-3 rounded-lg text-center active:scale-95 transition-all text-sm cursor-pointer border-0"
            >
              Solicitar Orçamento
            </button>
            <button
              id="mobile-portal-drawer-btn"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPortal();
              }}
              className="bg-primary hover:bg-primary-hover text-on-primary font-semibold py-3 rounded-lg text-center active:scale-95 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border-0"
            >
              <User className="w-4 h-4" />
              Entrar na Área do Condômino
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
