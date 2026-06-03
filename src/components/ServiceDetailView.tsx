import React from 'react';
import { ArrowLeft, CheckCircle, Shield, FileText, PhoneCall, ArrowRight, Home, CreditCard, Scale, HelpCircle } from 'lucide-react';
import { ServicePage } from '../data/seoData';

interface ServiceDetailViewProps {
  service: ServicePage;
  onGoBack: () => void;
  onOpenQuote: () => void;
}

export default function ServiceDetailView({ service, onGoBack, onOpenQuote }: ServiceDetailViewProps) {
  
  // Custom icons matching each separate service mapping
  const getIcon = (slug: string) => {
    switch (slug) {
      case 'administracao-de-condominios':
        return <Home className="w-12 h-12 text-primary" />;
      case 'gestao-financeira':
        return <CreditCard className="w-12 h-12 text-primary" />;
      case 'sindico-profissional':
        return <Shield className="w-12 h-12 text-primary" />;
      case 'assessoria-juridica':
        return <Scale className="w-12 h-12 text-primary" />;
      case 'gestao-de-inadimplencia':
        return <FileText className="w-12 h-12 text-primary" />;
      case 'recursos-humanos':
        return <HelpCircle className="w-12 h-12 text-primary" />;
      case 'prestacao-de-contas':
        return <CheckCircle className="w-12 h-12 text-primary" />;
      default:
        return <Shield className="w-12 h-12 text-primary" />;
    }
  };

  return (
    <div id={`service-detail-${service.slug}`} className="py-20 px-4 md:px-12 bg-[#F5F7FA] animate-fade-in font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Breadcrumbs Navigation - SEO Rule */}
        <nav aria-label="breadcrumb" className="text-xs font-sans text-gray-500 flex items-center gap-2 select-none">
          <a href="#home" onClick={onGoBack} className="hover:text-primary hover:underline">
            Home
          </a>
          <span>/</span>
          <a href="#servicos" onClick={onGoBack} className="hover:text-primary hover:underline">
            Serviços
          </a>
          <span>/</span>
          <span className="text-secondary font-bold" aria-current="page">
            {service.title}
          </span>
        </nav>

        {/* Back Button Link */}
        <button
          id="service-detail-back-btn"
          onClick={onGoBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-primary group hover:underline focus:outline-none focus:ring-0"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para a Página Inicial
        </button>

        {/* Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Main Content */}
          <div className="lg:col-span-8 space-y-8 bg-white p-6 md:p-10 rounded-3xl border border-border-light shadow-sm">
            
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                  {getIcon(service.slug)}
                </div>
                <div>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-widest block font-sans">
                    Soluções Corporativas
                  </span>
                  <h1 className="text-2xl md:text-4xl font-extrabold font-display text-[#101c29] leading-tight tracking-tight">
                    {service.h1}
                  </h1>
                </div>
              </div>

              {/* H2 Subheading */}
              <h2 className="text-lg md:text-xl font-bold font-sans text-primary leading-normal italic">
                {service.h2}
              </h2>

              <p className="text-secondary text-sm md:text-base leading-relaxed whitespace-pre-line">
                {service.intro}
              </p>
            </div>

            {/* H3 Subheading Section & Content */}
            <div className="border-t border-gray-100 pt-8 space-y-4">
              <h3 className="font-sans font-extrabold text-base md:text-lg text-[#101c29]">
                {service.h3}
              </h3>
              
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.keyBenefits.map((benefit, i) => (
                  <li key={i} className="flex gap-3 items-start select-none">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-secondary font-bold leading-tight">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Content Paragraphs */}
            <div className="border-t border-gray-100 pt-8 text-secondary text-sm md:text-base leading-relaxed space-y-4 font-sans whitespace-pre-line">
              {service.detailedContent}
            </div>

            {/* Additional informational tags */}
            <div className="pt-6 flex flex-wrap gap-2 text-[10px] font-mono text-gray-400 select-none">
              <span>Metatitle: {service.metaTitle}</span>
              <span>●</span>
              <span>Slug: #{service.slug}</span>
            </div>

          </div>

          {/* Right Action Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main Conversion CTA Box */}
            <div className="bg-[#101c29] text-white p-6 md:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] text-primary-light font-bold uppercase tracking-wider block font-mono">
                  Conversão Garantida
                </span>
                <h4 className="font-sans font-extrabold text-[#fafafa] text-lg leading-tight">
                  Tome a Melhor Decisão para o seu Edifício
                </h4>
                <p className="text-xs text-gray-300 leading-normal font-sans">
                  Preencha nosso formulário de cotação predial e avaliaremos em até 24 horas os honorários exatos para o seu condomínio na Baixada Santista.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  id="service-cta-quote-btn"
                  onClick={onOpenQuote}
                  className="w-full bg-primary hover:bg-primary-hover text-on-primary py-4 rounded-xl font-bold text-xs select-none shadow-lg tracking-wide hover:scale-105 active:scale-95 transition-all text-center block cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Solicitar Cotação Completa
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="service-cta-whatsapp-btn"
                  onClick={() => window.open('https://wa.me/5513999999999', '_blank')}
                  className="w-full bg-[#2E7D32] hover:bg-green-700 text-white py-4 rounded-xl font-bold text-xs select-none flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  Chamar no WhatsApp
                </button>
              </div>
            </div>

            {/* Contact details card */}
            <div className="bg-white p-6 rounded-3xl border border-border-light shadow-sm text-center select-none space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Contato Direto</p>
              <p className="text-sm font-sans font-extrabold text-[#101c29]">(13) 3221-1234</p>
              <p className="text-[10px] text-gray-400">Atendimento comercial de Segunda a Sexta das 8h às 18h.</p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
