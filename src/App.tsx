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
  Bell
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
import { ContactMessage, QuoteRequest } from './types';

// SEO and Page imports
import ServiceDetailView from './components/ServiceDetailView';
import CityDetailView from './components/CityDetailView';
import AreasAtendidas from './components/AreasAtendidas';
import FAQSection from './components/FAQSection';
import BlogDashboard from './components/BlogDashboard';
import { servicePages, cityPages } from './data/seoData';

export default function App() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);

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

  // Simulated dynamic toast notification list
  const [toast, setToast] = useState<{ id: string; headline: string; text: string } | null>(null);

  // Simulated WhatsApp FAB widget
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'agent' | 'user'; text: string }[]>([
    {
      sender: 'agent',
      text: 'Olá! Sou o assistente virtual da Facilities. Como está a saúde administrativa e financeira do seu condomínio hoje?',
    },
  ]);

  const handleShowToast = (headline: string, text: string) => {
    const id = Date.now().toString();
    setToast({ id, headline, text });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 5000);
  };

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
      <Header 
        onOpenPortal={() => setIsPortalOpen(true)} 
        onOpenQuote={() => setIsQuoteOpen(true)} 
        onNavigate={handleNavigate}
        currentViewType={viewType}
      />

      {/* Main Page Content */}
      <main className="mt-20">
        
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
                    Administradora de Condomínios em Santos e Baixada Santista
                  </h1>
                  
                  <p className="text-base md:text-lg text-secondary max-w-xl font-sans leading-relaxed">
                    Gestão condominial moderna, transparente e eficiente para condomínios residenciais e comerciais. Sob a supervisão técnica da Dra. Cristhiane Xavier, unimos direito condominial de excelência e tecnologia Superlógica.
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
                      <span className="text-xs font-bold text-on-surface">Parcerias OAB & Superlógica</span>
                    </div>
                  </div>
                </div>

                {/* Right Asset side - Cristhiane Xavier */}
                <div className="hidden lg:block relative h-full">
                  <img
                    alt="Dra. Cristhiane Xavier - Gestão de Alta Performance"
                    className="w-full h-auto object-contain max-h-[620px] drop-shadow-2xl translate-y-6"
                    referrerPolicy="no-referrer"
                    src="https://lh3.googleusercontent.com/aida/AP1WRLtY3C45VAfLmzntHD9uHLKESquFRMWNdOoAobTO88zKY71XncIumhLIrhAS98BOrH1gDJNv1GfSupaMuCD_BvN1VqvMJz2njtMKg-iA1i83dU30t9sHPo4c6wABzhOERek4ZqVcUZqe-G0ixiwb6-9shmd-Odj1HKTyXjfEGBAYQzkLceLjcqumhlNr9cFtwWHAec3baXt4eUB0ndf5SYSwIfY5bqXAQh2vj-ZHWKUEyxQMSp_R4Mm9x2k"
                  />
                </div>
              </div>

              {/* Abstract graphic decoration */}
              <div className="absolute top-0 right-0 w-1/3 h-full bg-[#eef4ff] -skew-x-12 translate-x-1/3 z-0 hidden lg:block"></div>
            </section>

            {/* BENTO DIFERENCIAIS SECTION component */}
            <DiferenciaisSection />

            {/* SERVICES SECTION TABS component */}
            <ServicesSection onNavigateToService={(slug) => handleNavigate('servico', slug)} />

            {/* PILARES DA METODOLOGIA component */}
            <ComoTrabalhamos />

            {/* POR QUE ESCOLHER A FACILITIES (Split portrait) component */}
            <SobreNos />

            {/* AREAS ATENDIDAS SECTIONS HOVER HUB */}
            <AreasAtendidas onNavigateToCity={(slug) => handleNavigate('local', slug)} />

            {/* SLIDING DEPOIMENTOS CLIENTES component */}
            <Depoimentos />

            {/* EXPANDABLE COLLAPSIBLE 20+ EXTRAS FAQ SECTION */}
            <FAQSection />

            {/* CONTATO INTERACTION COMPONENT */}
            <Contato onAddMessageShowToast={handleAddMessageShowToast} />
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
      <Footer onOpenPortal={() => setIsPortalOpen(true)} onNavigate={handleNavigate} />

      {/* PROPOSAL INQUIRY STEP FLOW MODAL */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        onAddQuoteShowToast={handleAddQuoteShowToast}
      />

      {/* ROBUST CLIENT PORTAL MODAL */}
      <PortalModal
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
        onShowNotification={handleShowToast}
      />

      {/* WHATSAPP CHAT POPUP SIMULATION BADGE */}
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
    </div>
  );
}
