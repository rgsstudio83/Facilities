import { useState, useEffect } from 'react';
import {
  Landmark,
  ArrowRight,
  ShieldCheck,
  Award,
  MessageCircle,
  X,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
  Bell,
  Smartphone
} from 'lucide-react';
import Header from './components/Header';
import DiferenciaisSection from './components/DiferenciaisSection';
import ServicesSection from './components/ServicesSection';
import ComoTrabalhamos from './components/ComoTrabalhamos';
import SobreNos from './components/SobreNos';
import Depoimentos from './components/Depoimentos';
import Contato from './components/Contato';
import Footer from './components/Footer';
import QuoteModal from './components/QuoteModal';
import PortalModal from './components/PortalModal';
import SupabaseDiagnostics from './components/SupabaseDiagnostics';
import AdminDashboardModal from './components/AdminDashboardModal';
import { ContactMessage, QuoteRequest } from './types';
import ScrollAnimate from './components/ScrollAnimate';

// SEO and Page imports
import ServiceDetailView from './components/ServiceDetailView';
import CityDetailView from './components/CityDetailView';
import AreasAtendidas from './components/AreasAtendidas';
import FAQSection from './components/FAQSection';
import BlogDashboard from './components/BlogDashboard';
import { servicePages, cityPages } from './data/seoData';
import { PortalRouterProvider, usePortalRouter, PortalRouteGuard } from './components/PortalRouter';

function AppContent({ toast, setToast, handleShowToast }: { toast: any; setToast: any; handleShowToast: any }) {
  const router = usePortalRouter();
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isSupabaseDiagOpen, setIsSupabaseDiagOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [authenticatedProfile, setAuthenticatedProfile] = useState<string>('admin');
  const [currentUser, setCurrentUser] = useState<{ name: string; profile: string; unit: string } | null>(null);

  // Sync session profile dynamically with global router auth state
  const currentUserResolved = router.isLoggedIn && router.profile ? {
    name: router.profile.nome,
    profile: router.profile.tipo,
    unit: router.profile.unidade || 'Apto Geral'
  } : currentUser;

  const authenticatedProfileResolved = router.isLoggedIn && router.profile ? router.profile.tipo : authenticatedProfile;

  // React to route state changes from Supabase Auth Router to automatically show modal dialog views
  useEffect(() => {
    const rawPath = router.currentRoute.replace('#', '');
    if (['login', 'register', 'esqueci-senha', 'alterar-senha'].includes(rawPath)) {
      setIsPortalOpen(true);
      setIsAdminDashboardOpen(false);
    } else if (rawPath.startsWith('dashboard')) {
      setIsPortalOpen(false);
      setIsAdminDashboardOpen(true);
    }
  }, [router.currentRoute]);

  const handlePortalClose = () => {
    setIsPortalOpen(false);
    // Prevent resetting the hash to #home if the user is already logged in/registered
    if (!router.isLoggedIn && ['login', 'register', 'esqueci-senha', 'alterar-senha'].includes(router.currentRoute.replace('#', ''))) {
      window.location.hash = '#home';
    }
  };

  const handleLoginSuccess = (username: string, profile: string, unit: string) => {
    setAuthenticatedProfile(profile);
    setCurrentUser({ name: username, profile, unit });
    setIsPortalOpen(false);
    
    // Normalize role to redirect to the exact profile dashboard route
    const normalizedRole = (profile || 'morador').toLowerCase()
      .replace('síndico', 'sindico')
      .replace('subsíndico', 'subsindico')
      .replace('proprietário', 'proprietario')
      .replace('conselheiro', 'conselheiro')
      .replace('porteiro', 'porteiro')
      .replace('administrador', 'admin')
      .replace('colaborador', 'colaborador')
      .trim();
      
    window.location.hash = `#dashboard/${normalizedRole}`;
  };

  const handleLogout = () => {
    router.logout();
    setCurrentUser(null);
    setAuthenticatedProfile('admin');
    window.location.hash = '#home';
  };

  // SPA Routing and Local SEO State
  const [currentPath, setCurrentPath] = useState('home'); // #home, #servico/[slug], #local/[slug], #blog, #faq

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      const cleanHash = hash.replace('#', '');
      setCurrentPath(cleanHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on startup

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (type: 'home' | 'servico' | 'local' | 'blog' | 'faq', slug?: string) => {
    let newHash = '#home';
    if (type === 'servico' && slug) {
      newHash = `#servico/${slug}`;
    } else if (type === 'local' && slug) {
      newHash = `#local/${slug}`;
    } else if (type === 'blog') {
      newHash = '#blog';
    } else if (type === 'faq') {
      newHash = '#faq-seo-section';
    }
    window.location.hash = newHash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewType = currentPath.startsWith('servico/') 
    ? 'servico' 
    : currentPath.startsWith('local/') 
    ? 'local' 
    : currentPath === 'blog' 
    ? 'blog' 
    : currentPath === 'faq-seo-section'
    ? 'faq'
    : currentPath.startsWith('dashboard')
    ? 'dashboard'
    : 'home';

  const viewSlug = (viewType === 'servico' || viewType === 'local') 
    ? currentPath.split('/')[1] 
    : '';

  // document metadata dynamic injector for Local SEO 2026 Rankings
  useEffect(() => {
    let title = 'Administradora de Condomínios em Santos e Baixada Santista | Facilities';
    let description = 'Gestão condominial moderna, transparente e eficiente para condomínios residenciais e comerciais em Santos, Praia Grande e Guarujá. Dr. Cristhiane Xavier.';

    if (viewType === 'servico' && viewSlug) {
      const s = servicePages.find(item => item.slug === viewSlug);
      if (s) {
        title = s.metaTitle;
        description = s.metaDescription;
      }
    } else if (viewType === 'local' && viewSlug) {
      const c = cityPages.find(item => item.slug === viewSlug);
      if (c) {
        title = c.metaTitle;
        description = c.metaDescription;
      }
    } else if (viewType === 'blog') {
      title = 'Blog do Síndico | Plano Editorial de 100 Artigos para Condomínios';
      description = 'Tire dúvidas sobre manutenção contra maresia, direito de vizinhança e prestação de contas na Baixada Santista.';
    } else if (viewType === 'faq') {
      title = 'Perguntas Frequentes sobre Gestão Condominial | Facilities';
      description = 'Confira as respostas de pelo menos 20 questões recorrentes de síndicos da Baixada Santista sobre finanças e legislação.';
    }

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [viewType, viewSlug]);

  // Simulated WhatsApp FAB widget
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'agent' | 'user'; text: string }[]>([
    {
      sender: 'agent',
      text: 'Olá! Sou o assistente virtual da Facilities. Como está a saúde administrativa e financeira do seu condomínio hoje?',
    },
  ]);

  const handleAddMessageShowToast = (msg: ContactMessage) => {
    handleShowToast(
      'Contato Recebido!',
      `Obrigado, ${msg.nome}. Registramos sua mensagem comercial. Retornaremos em breve!`
    );
  };

  const handleAddQuoteShowToast = (quote: QuoteRequest) => {
    handleShowToast(
      'Proposta Mapeada!',
      `Simulamos honorários previstos para o condomínio ${quote.condominioNome} (${quote.unidades} unidades).`
    );
  };

  const handleSendMessage = (text: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text }]);

    setTimeout(() => {
      let reply = 'Interessante! O ideal seria traçarmos uma simulação completa dos seus custos com um de nossos consultores seniores. Quer abrir o formulário de orçamento?';
      if (text.toLowerCase().includes('inadimplencia') || text.toLowerCase().includes('inadimplência')) {
        reply = 'A Facilities reduz em média 45% da inadimplência nos primeiros 12 meses usando conciliação extrajudicial baseada em direito civil e contatos humanizados.';
      } else if (text.toLowerCase().includes('preço') || text.toLowerCase().includes('custo') || text.toLowerCase().includes('valor')) {
        reply = 'Nossos honorários corporativos partem de R$ 750,00 e escalam proporcionalmente ao número de unidades de lazer. Vamos preencher a cotação no botão superior?';
      }

      setChatMessages((prev) => [...prev, { sender: 'agent', text: reply }]);
    }, 1000);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-background relative overflow-x-hidden font-sans">
      {/* Dynamic Floating Notification Toast */}
      {toast && (
        <div
          id="toast-notification-banner"
          className="fixed bottom-6 left-6 z-50 bg-[#101c29] text-white p-4 rounded-2xl border border-white/10 shadow-2xl flex gap-3 max-w-sm animate-bounce items-start"
        >
          <div className="p-2 bg-primary text-white rounded-lg select-none shrink-0">
            <Bell className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-primary">{toast.headline}</h5>
            <p className="text-[11px] text-gray-300 mt-1 leading-normal font-sans">{toast.text}</p>
          </div>
          <button
            id="toast-close-btn"
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white px-1 font-bold text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Corporate Nav Header bar component */}
      {viewType !== 'dashboard' && (
        <Header 
          onOpenPortal={() => setIsPortalOpen(true)} 
          onOpenQuote={() => setIsQuoteOpen(true)} 
          onNavigate={handleNavigate}
          currentViewType={viewType}
          onOpenAdminDashboard={() => {
            setIsAdminDashboardOpen(true);
            window.location.hash = '#dashboard';
          }}
        />
      )}

      {/* Main Page Content */}
      <main className={viewType === 'dashboard' ? '' : 'mt-20'}>
        
        {/* HOMEPAGE VIEW */}
        {viewType === 'home' && (
          <div className="animate-fade-in">
            {/* HERO SECTION */}
            <section id="home" className="relative min-h-[85vh] md:min-h-[80vh] flex items-center bg-white overflow-hidden py-10 md:py-0">
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10"></div>
              <div className="max-w-7xl mx-auto px-4 md:px-12 w-full relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                
                {/* Left Content Pitch */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffdad6] text-[#930010] font-sans text-xs font-semibold select-none">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span>Gestão Eficiente, Resultados Transparentes</span>
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl font-extrabold font-display text-on-surface leading-tight tracking-tight">
                    Bem-vindo à Facilities Administradora de Condomínios
                  </h1>
                  
                  <p className="text-base md:text-lg text-secondary max-w-xl font-sans leading-relaxed">
                    Gestão condominial moderna, transparente e eficiente para condomínios residenciais e comerciais. Sob a supervisão técnica da Dra. Cristhiane Xavier, contamos com nosso próprio sistema exclusivo para oferecer total controle e clareza.
                  </p>

                  {/* Call to actions */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      id="hero-quote-trigger-btn"
                      onClick={() => setIsQuoteOpen(true)}
                      className="bg-primary hover:bg-primary-hover text-on-primary px-8 py-4 rounded-xl font-bold text-sm select-none shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Solicitar Proposta Comercial
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-container rounded-xl border border-border-light select-none">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <span className="text-xs font-bold text-on-surface">Parcerias OAB & Tecnologia Própria</span>
                    </div>
                  </div>
                </div>

                {/* Right Asset side - Cristhiane Xavier */}
                <div className="hidden lg:block relative h-full">
                  <img
                    alt="Dra. Cristhiane Xavier - Gestão de Alta Performance"
                    className="w-full h-auto object-contain max-h-[620px] drop-shadow-2xl translate-y-6"
                    referrerPolicy="no-referrer"
                    src="https://ejpjtpteycckydrorjpr.supabase.co/storage/v1/object/public/images/advogadacrisxavier.jpg"
                  />
                </div>
              </div>

              {/* Abstract graphic decoration */}
              <div className="absolute top-0 right-0 w-1/3 h-full bg-[#eef4ff] -skew-x-12 translate-x-1/3 z-0 hidden lg:block"></div>
            </section>

            {/* BENTO DIFERENCIAIS SECTION component */}
            <ScrollAnimate>
              <DiferenciaisSection />
            </ScrollAnimate>

            {/* SERVICES SECTION TABS component */}
            <ScrollAnimate>
              <ServicesSection onNavigateToService={(slug) => handleNavigate('servico', slug)} />
            </ScrollAnimate>

            {/* PILARES DA METODOLOGIA component */}
            <ScrollAnimate>
              <ComoTrabalhamos />
            </ScrollAnimate>

            {/* POR QUE ESCOLHER A FACILITIES (Split portrait) component */}
            <ScrollAnimate>
              <SobreNos />
            </ScrollAnimate>

            {/* FACILITIES APP DOWNLOAD SECTION */}
            <ScrollAnimate>
              <section id="app-facilities" className="py-16 bg-slate-50 border-y border-gray-100">
              <div className="max-w-7xl mx-auto px-4 md:px-12">
                <div id="app-promo-card" className="bg-[#101c29] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                  
                  {/* Subtle background glow effect */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff3c53]/10 rounded-full blur-3xl -translate-y-24 translate-x-24 pointer-events-none"></div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                    
                    {/* Left Column: text content & benefits */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#ff7d8d] text-xs font-semibold uppercase tracking-wider">
                        <Smartphone className="w-4 h-4 text-primary" />
                        <span>Aplicativo Exclusivo Facilities</span>
                      </div>
                      
                      <h3 className="text-2xl md:text-4xl font-extrabold font-display leading-tight">
                        Seu condomínio inteligente, na palma da mão!
                      </h3>
                      
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                        Diga adeus aos sistemas terceirizados genéricos. Na Facilities, possuímos um <strong>sistema exclusivo e totalmente próprio para administrar os condomínios</strong>. Através do nosso aplicativo oficial, tudo é projetado para garantir autonomia, velocidade e transparência absoluta para moradores e gestores.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm text-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">✓</span>
                          <span>Segunda via de boletos, carnês e PIX</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">✓</span>
                          <span>Reservas de áreas comuns em tempo real</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">✓</span>
                          <span>Prestação de contas diária digitalizada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">✓</span>
                          <span>Portaria eletrônica e envio de convites</span>
                        </div>
                      </div>

                      {/* Download Badges Row */}
                      <div className="pt-4 flex flex-wrap gap-4 items-center">
                        {/* Play Store (Android) Button */}
                        <a 
                          href="https://play.google.com" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-black hover:bg-black/95 text-white px-5 py-2.5 rounded-xl border border-white/15 flex items-center gap-3 transition-all hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                            <path d="M3.224 1.15c-.15.176-.224.441-.224.77v20.16c0 .329.074.594.224.77l.07.065L14.73 12.064v-.128L3.294 1.085l-.07.065z" fill="#3bccff" />
                            <path d="M18.544 15.908l-3.814-3.844v-.128l3.815-3.844.084.049 4.512 2.571c1.29.734 1.29 1.933 0 2.667l-4.512 2.571-.085.059z" fill="#ffd600" />
                            <path d="M18.629 15.849L14.73 11.95 3.224 22.842c.42.441 1.115.49 1.916.035l13.489-7.028z" fill="#ff2d37" />
                            <path d="M18.629 8.151L5.14 1.123C4.339.668 3.644.717 3.224 1.158L14.73 12.05l3.899-3.899z" fill="#00f176" />
                          </svg>
                          <div className="text-left font-sans">
                            <p className="text-[9px] uppercase text-gray-400 leading-none">Disponível no</p>
                            <p className="text-xs font-bold leading-tight">Google Play</p>
                          </div>
                        </a>

                        {/* App Store (iPhone) Button */}
                        <a 
                          href="https://www.apple.com/app-store/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-black hover:bg-black/95 text-white px-5 py-2.5 rounded-xl border border-white/15 flex items-center gap-3 transition-all hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          <svg className="w-5 h-5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.5-1.34.05-1.77-.76-3.29-.76-1.53 0-2 .73-3.27.78-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.44 1.44-1.38 2.82M15.97 4.17c.66-.81 1.1-1.9 1.98-3.18-1 .04-2.1.6-2.76 1.38-.56.66-1.05 1.76-.9 3.01 1.05.08 2.06-.51 2.63-1.21z" />
                          </svg>
                          <div className="text-left font-sans">
                            <p className="text-[9px] uppercase text-gray-400 leading-none">Baixar na</p>
                            <p className="text-xs font-bold leading-tight">App Store</p>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Right Column: Simulated App Interface Display */}
                    <div className="lg:col-span-5 flex justify-center relative">
                      {/* Premium Device Mockup */}
                      <div className="relative w-72 h-[520px] bg-slate-950 rounded-[44px] border-[10px] border-slate-800 p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between">
                        
                        {/* Dynamic Island / Notch Cutout */}
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full flex items-center justify-around px-2 z-25">
                          <div className="w-3.5 h-1 rounded-full bg-slate-800/80"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40"></div>
                        </div>

                        {/* App UI simulation with Gradient Background */}
                        <div className="pt-6 pb-2 px-3.5 flex-1 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-[32px] overflow-hidden flex flex-col font-sans relative text-white">
                          
                          {/* Inner soft overlay light */}
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"></div>

                          {/* Header of mobile app */}
                          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3.5 relative z-10 font-sans">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-[#ff3c53] font-extrabold">Facilities Mobile</p>
                              <h5 className="text-[11px] text-gray-300 font-medium">Condomínio Amoreiras</h5>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span className="text-[9px] text-emerald-400 font-semibold font-mono">LIVE</span>
                            </div>
                          </div>

                          {/* Welcome User Banner */}
                          <div className="mb-3 relative z-10 px-0.5">
                            <h6 className="text-[10px] text-gray-400 font-medium leading-none mb-1">Olá,</h6>
                            <h4 className="text-sm font-bold text-white tracking-tight">Roberto Silva <span className="text-xs text-gray-400 font-normal">(Apto 41-B)</span></h4>
                          </div>

                          {/* Stat Card / Financial invoice */}
                          <div className="bg-white/5 rounded-2xl p-3 mb-3.5 border border-white/10 space-y-1.5 relative z-10 backdrop-blur-md shadow-lg font-sans">
                            <div className="flex justify-between items-start">
                              <p className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold">Boleto / Mensalidade</p>
                              <span className="text-[8px] uppercase bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">Aberto</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-mono font-bold text-white">R$ 498,50</span>
                              <span className="text-[8.5px] text-gray-400">Vence: 10/06/2026</span>
                            </div>
                            <button className="w-full mt-1.5 py-1.5 bg-[#ff3c53] hover:bg-[#e02b40] active:scale-[0.98] text-white rounded-xl text-[9px] font-bold transition-all flex items-center justify-center gap-1">
                              Copiar código PIX
                            </button>
                          </div>

                          {/* Quick shortcuts */}
                          <div className="space-y-2 relative z-10 font-sans">
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold px-0.5">Atalhos Principais</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="group bg-white/5 hover:bg-white/10 p-2 rounded-xl text-center border border-white/5 transition-all cursor-pointer">
                                <span className="block text-sm mb-0.5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-6">📅</span>
                                <span className="block text-[8.5px] font-bold text-gray-200">Reservas Áreas</span>
                              </div>
                              <div className="group bg-white/5 hover:bg-white/10 p-2 rounded-xl text-center border border-white/5 transition-all cursor-pointer">
                                <span className="block text-sm mb-0.5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-6">📊</span>
                                <span className="block text-[8.5px] font-bold text-gray-200">Finanças Cond.</span>
                              </div>
                              <div className="group bg-white/5 hover:bg-white/10 p-2 rounded-xl text-center border border-white/5 transition-all cursor-pointer">
                                <span className="block text-sm mb-0.5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-6">✉️</span>
                                <span className="block text-[8.5px] font-bold text-gray-200">Mural Sindical</span>
                              </div>
                              <div className="group bg-white/5 hover:bg-white/10 p-2 rounded-xl text-center border border-white/5 transition-all cursor-pointer">
                                <span className="block text-sm mb-0.5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-6">📋</span>
                                <span className="block text-[8.5px] font-bold text-gray-200">Atas & Despesas</span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Tab Simulation */}
                          <div className="border-t border-white/10 pt-2 pb-0.5 mt-auto flex justify-around text-[10px] text-gray-400 relative z-10 font-sans">
                            <span className="group text-[#ff3c53] font-semibold flex flex-col items-center gap-0.5 cursor-pointer">
                              <span className="text-[11px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">🏠</span>
                              <span className="text-[8.5px]">Início</span>
                            </span>
                            <span className="group hover:text-white flex flex-col items-center gap-0.5 cursor-pointer transition-colors duration-200">
                              <span className="text-[11px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">🔔</span>
                              <span className="text-[8.5px]">Avisos</span>
                            </span>
                            <span className="group hover:text-white flex flex-col items-center gap-0.5 cursor-pointer transition-colors duration-200">
                              <span className="text-[11px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">👤</span>
                              <span className="text-[8.5px]">Minha Área</span>
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </section>
          </ScrollAnimate>

            {/* AREAS ATENDIDAS SECTIONS HOVER HUB */}
            <ScrollAnimate>
              <AreasAtendidas onNavigateToCity={(slug) => handleNavigate('local', slug)} />
            </ScrollAnimate>

            {/* SLIDING DEPOIMENTOS CLIENTES component */}
            <ScrollAnimate>
              <Depoimentos />
            </ScrollAnimate>

            {/* EXPANDABLE COLLAPSIBLE 20+ EXTRAS FAQ SECTION */}
            <ScrollAnimate>
              <FAQSection />
            </ScrollAnimate>

            {/* CONTATO INTERACTION COMPONENT */}
            <ScrollAnimate>
              <Contato onAddMessageShowToast={handleAddMessageShowToast} />
            </ScrollAnimate>
          </div>
        )}

        {/* SERVICE DETAIL PAGES */}
        {viewType === 'servico' && (
          <div className="animate-fade-in animate-duration-300">
            {(() => {
              const matchedService = servicePages.find(item => item.slug === viewSlug);
              return matchedService ? (
                <ServiceDetailView
                  service={matchedService}
                  onGoBack={() => handleNavigate('home')}
                  onOpenQuote={() => setIsQuoteOpen(true)}
                />
              ) : (
                <div className="py-32 text-center text-[#101c29]">
                  <h3 className="text-xl font-bold font-sans">Serviço não encontrado</h3>
                  <button onClick={() => handleNavigate('home')} className="mt-4 text-xs font-bold text-primary underline">Voltar</button>
                </div>
              );
            })()}
          </div>
        )}

        {/* CITY DETAIL PAGES */}
        {viewType === 'local' && (
          <div className="animate-fade-in animate-duration-300">
            {(() => {
              const matchedCity = cityPages.find(item => item.slug === viewSlug);
              return matchedCity ? (
                <CityDetailView
                  city={matchedCity}
                  onGoBack={() => handleNavigate('home')}
                  onOpenQuote={() => setIsQuoteOpen(true)}
                />
              ) : (
                <div className="py-32 text-center text-[#101c29]">
                  <h3 className="text-xl font-bold font-sans">Cidade não cadastrada</h3>
                  <button onClick={() => handleNavigate('home')} className="mt-4 text-xs font-bold text-primary underline">Voltar</button>
                </div>
              );
            })()}
          </div>
        )}

        {/* BLOG CATALOG DIRECTORY & READING */}
        {viewType === 'blog' && (
          <BlogDashboard
            onOpenQuote={() => setIsQuoteOpen(true)}
            onArticleRead={(slug) => {
              // Update hash representation for bookmark support
              window.location.hash = `#blog/${slug}`;
            }}
          />
        )}

        {/* FAQ DIRECTORY STANDALONE SUBPAGE */}
        {viewType === 'faq' && (
          <div className="animate-fade-in animate-duration-300">
            <FAQSection />
          </div>
        )}

      </main>

      {/* FOOTER component */}
      {viewType !== 'dashboard' && (
        <Footer 
          onOpenPortal={() => setIsPortalOpen(true)} 
          onNavigate={handleNavigate} 
          onOpenSupabaseDiag={() => setIsSupabaseDiagOpen(true)}
          onOpenAdminDashboard={() => {
            setIsAdminDashboardOpen(true);
            window.location.hash = '#dashboard';
          }}
        />
      )}

      {/* PROPOSAL INQUIRY STEP FLOW MODAL */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        onAddQuoteShowToast={handleAddQuoteShowToast}
      />

      {/* ROBUST CLIENT PORTAL MODAL */}
      <PortalModal
        isOpen={isPortalOpen}
        onClose={handlePortalClose}
        onShowNotification={handleShowToast}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* SUPABASE CONNECTION AND DEVS TOOL DIAG PANEL */}
      <SupabaseDiagnostics
        isOpen={isSupabaseDiagOpen}
        onClose={() => setIsSupabaseDiagOpen(false)}
        onShowMessage={handleShowToast}
      />

      {/* FACILITIES EXECUTIVE ADMINISTRATIVE DASHBOARD (PROTECTED NATIVELY WITH THE PORTAL ROUTE GUARD) */}
      {isAdminDashboardOpen && (
        <PortalRouteGuard allowedRoute="#dashboard">
          <AdminDashboardModal
            isOpen={isAdminDashboardOpen}
            onClose={() => {
              setIsAdminDashboardOpen(false);
              window.location.hash = '#home';
            }}
            onShowMessage={handleShowToast}
            initialProfile={authenticatedProfileResolved}
            currentUser={currentUserResolved}
            onLogout={handleLogout}
          />
        </PortalRouteGuard>
      )}

      {/* WHATSAPP CHAT POPUP SIMULATION BADGE */}
      {viewType !== 'dashboard' && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
          {isChatOpen && (
            <div
              id="chat-popup-widget"
              className="bg-white rounded-3xl w-80 md:w-96 border border-[#cfdbec] shadow-2xl overflow-hidden flex flex-col mb-4 animate-fade-in"
            >
              {/* Popup Header banner */}
              <div className="bg-[#2E7D32] p-4 text-white flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    F
                  </div>
                  <div>
                    <h4 className="font-bold text-xs font-display">Apoio Facilities</h4>
                    <p className="text-[9px] text-green-150 font-semibold uppercase tracking-wider">● Online e Disponível</p>
                  </div>
                </div>
                <button
                  id="chat-popup-close"
                  onClick={() => setIsChatOpen(false)}
                  className="text-white hover:text-gray-150 p-1 font-bold text-xs"
                >
                  &times; Close
                </button>
              </div>

              {/* Popup message logs inside scroll */}
              <div className="p-4 h-64 overflow-y-auto space-y-3 bg-[#f5f7fa]">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed font-sans ${
                      msg.sender === 'agent'
                        ? 'bg-white text-on-surface border border-[#cfdbec] rounded-tl-none self-start mr-auto'
                        : 'bg-[#E2F0D9] text-on-surface border border-green-200 rounded-tr-none ml-auto text-right'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Quick action shortcuts to trigger responses */}
              <div className="p-2 border-t border-gray-100 flex gap-2 overflow-x-auto bg-white shrink-0">
                <button
                  id="chat-pref-quote"
                  onClick={() => handleSendMessage('Gostaria de cotar o orçamento do meu prédio!')}
                  className="bg-gray-50 border border-gray-200 text-secondary rounded-lg px-2.5 py-1 text-[10px] whitespace-nowrap font-semibold hover:border-primary active:scale-95"
                >
                  Quero Orçamento
                </button>
                <button
                  id="chat-pref-delinq"
                  onClick={() => handleSendMessage('Como reduzir taxas atrasadas?')}
                  className="bg-gray-50 border border-gray-200 text-secondary rounded-lg px-2.5 py-1 text-[10px] whitespace-nowrap font-semibold hover:border-primary active:scale-95"
                >
                  Inadimplência
                </button>
                <button
                  id="chat-pref-phone"
                  onClick={() => handleSendMessage('Qual o ramal para contato direto?')}
                  className="bg-gray-50 border border-gray-200 text-secondary rounded-lg px-2.5 py-1 text-[10px] whitespace-nowrap font-semibold hover:border-primary active:scale-95"
                >
                  Telefone Útil
                </button>
              </div>
            </div>
          )}

          {/* Large green floating ball button */}
          <button
            id="chat-floating-fab-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-14 h-14 bg-[#2E7D32] hover:bg-green-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer border border-green-500"
            title="Falar Conosco"
          >
            {isChatOpen ? <X className="w-6 h-6 animate-spin" /> : <MessageCircle className="w-6 h-6 animate-pulse" />}
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [toast, setToast] = useState<{ headline: string; text: string } | null>(null);

  const handleShowToast = (headline: string, text: string) => {
    setToast({ headline, text });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <PortalRouterProvider onShowNotification={handleShowToast}>
      <AppContent toast={toast} setToast={setToast} handleShowToast={handleShowToast} />
    </PortalRouterProvider>
  );
}
