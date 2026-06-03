import React from 'react';
import { ArrowLeft, MapPin, ShieldAlert, Sparkles, PhoneCall, ArrowRight, Construction, Check } from 'lucide-react';
import { CityPage } from '../data/seoData';

interface CityDetailViewProps {
  city: CityPage;
  onGoBack: () => void;
  onOpenQuote: () => void;
}

export default function CityDetailView({ city, onGoBack, onOpenQuote }: CityDetailViewProps) {
  return (
    <div id={`city-detail-${city.slug}`} className="py-20 px-4 md:px-12 bg-[#F8FAFC] animate-fade-in font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Breadcrumb Navigation - Local SEO */}
        <nav aria-label="breadcrumb" className="text-xs font-sans text-gray-500 flex items-center gap-2 select-none">
          <a href="#home" onClick={onGoBack} className="hover:text-primary hover:underline">
            Home
          </a>
          <span>/</span>
          <a href="#areas-atendidas" onClick={onGoBack} className="hover:text-primary hover:underline">
            Cidades Atendidas
          </a>
          <span>/</span>
          <span className="text-secondary font-bold" aria-current="page">
            {city.cityName}
          </span>
        </nav>

        {/* Back Link */}
        <button
          id="city-detail-back-btn"
          onClick={onGoBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-primary group hover:underline focus:outline-none focus:ring-0"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para a Página Inicial
        </button>

        {/* Outer Layout Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Left column with localized SEO copy */}
          <div className="lg:col-span-8 space-y-8 bg-white p-6 md:p-10 rounded-3xl border border-border-light shadow-sm">
            
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
                  <MapPin className="w-10 h-10" />
                </div>
                <div>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-widest block font-sans">
                    Administradora Local
                  </span>
                  <h1 className="text-2xl md:text-4xl font-extrabold font-display text-[#101c29] leading-tight tracking-tight">
                    {city.h1}
                  </h1>
                </div>
              </div>

              {/* H2 Title */}
              <h2 className="text-lg md:text-xl font-bold font-sans text-primary leading-normal italic">
                {city.h2}
              </h2>

              <p className="text-secondary text-sm md:text-base leading-relaxed">
                {city.intro}
              </p>
            </div>

            {/* Specific Local Challenges Section (H3) */}
            <div className="bg-[#fff9f9] border border-red-100 p-6 rounded-2xl space-y-3">
              <div className="flex gap-2.5 items-center">
                <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
                <h3 className="font-sans font-extrabold text-sm md:text-base text-primary">
                  {city.h3}
                </h3>
              </div>
              <p className="text-xs md:text-sm text-secondary leading-relaxed font-sans">
                {city.specificChallenges}
              </p>
            </div>

            {/* Real Estate Growth Insights Block */}
            <div className="border-t border-gray-100 pt-8 space-y-3">
              <div className="flex gap-2 items-center">
                <Construction className="w-5 h-5 text-amber-500" />
                <h4 className="font-sans font-extrabold text-base text-[#101c29]">
                  Estimativa Imobiliária e Vetores de Expansão
                </h4>
              </div>
              <p className="text-xs md:text-sm text-secondary leading-relaxed font-sans">
                {city.estimatedRealEstateGrowth}
              </p>
            </div>

            {/* Local Tailored Solutions List */}
            <div className="border-t border-gray-100 pt-8 space-y-4">
              <h4 className="font-sans font-extrabold text-[#101c29] text-base md:text-lg">
                Nossa Abordagem Particular em {city.cityName}
              </h4>
              <p className="text-xs md:text-sm text-secondary leading-relaxed font-sans">
                Com base nessas necessidades físicas e burocráticas específicas, a Facilities estruturou as seguintes ações direcionadas:
              </p>
              
              <ul className="grid grid-cols-1 gap-3">
                {city.localTailoredSolutions.map((sol, i) => (
                  <li key={i} className="flex gap-3 items-start select-none bg-surface-container-lowest p-3 rounded-xl border border-gray-100">
                    <div className="p-1 bg-green-100 text-green-700 rounded-lg shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm text-secondary font-medium leading-relaxed">
                      {sol}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dynamic Local SEO words and metadata tags display */}
            <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-2 text-[10px] font-mono text-gray-400 select-none">
              <span>Metatitle: {city.metaTitle}</span>
              <span>●</span>
              <span>Meta Description: {city.metaDescription}</span>
            </div>

          </div>

          {/* Right Action Switcher */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Primary Conversion CTA Column */}
            <div className="bg-[#101c29] text-white p-6 md:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] text-primary-light font-bold uppercase tracking-wider block font-mono">
                  Atendimento VIP
                </span>
                <h4 className="font-sans font-extrabold text-[#fafafa] text-lg leading-tight">
                  Eleve o Patamar da Administração do Seu Prédio
                </h4>
                <p className="text-xs text-gray-300 leading-normal font-sans">
                  Nossos técnicos de {city.cityName} estão de prontidão para agendar uma vistoria consultiva de cortesia no seu condomínio.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  id="city-cta-quote-btn"
                  onClick={onOpenQuote}
                  className="w-full bg-primary hover:bg-primary-hover text-on-primary py-4 rounded-xl font-bold text-xs select-none shadow-lg tracking-wide hover:scale-105 active:scale-95 transition-all text-center block cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {city.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="city-cta-whatsapp-btn"
                  onClick={() => window.open('https://wa.me/5513999999999', '_blank')}
                  className="w-full bg-[#2E7D32] hover:bg-green-700 text-white py-4 rounded-xl font-bold text-xs select-none flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  Chamar no WhatsApp
                </button>
              </div>
            </div>

            {/* Regional proximity warning */}
            <div className="bg-white p-6 rounded-3xl border border-border-light shadow-sm text-center select-none space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Proximidade Física</p>
              <p className="text-[11px] font-sans text-secondary leading-normal">
                Nossos consultores cobrem 100% da Baixada de ponta a ponta com deslocamento veloz para reuniões ordinárias presenciais sem custos secundários de reembolso.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
