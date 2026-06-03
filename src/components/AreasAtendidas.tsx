import React from 'react';
import { MapPin, Building2, ShieldEllipsis, ArrowUpRight, ThermometerSun } from 'lucide-react';
import { cityPages } from '../data/seoData';

interface AreasAtendidasProps {
  onNavigateToCity: (slug: string) => void;
}

export default function AreasAtendidas({ onNavigateToCity }: AreasAtendidasProps) {
  // Highlights localized factors to raise SEO keywords word count
  const localFactors = [
    {
      title: 'Maresia & Salinidade',
      desc: 'Planejamento preventivo especializado de fachadas e ferragens em Santos, Guarujá e Praia Grande.',
      icon: ThermometerSun
    },
    {
      title: 'Turismo & Alta Estação',
      desc: 'Controles rígidos de portaria estruturada e eclusas em condomínios de temporada do veraneio.',
      icon: Building2
    },
    {
      title: 'Segurança & Monitoramento',
      desc: 'Projetos e implantação de alarmes integrados para o bem-estar comunitário da Baixada.',
      icon: ShieldEllipsis
    }
  ];

  return (
    <section id="areas-atendidas" className="py-20 px-4 md:px-12 bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-primary font-semibold text-xs tracking-widest uppercase font-sans">
            SEO Local & Cobertura Regional
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-on-surface leading-tight tracking-tight">
            Administradora de Condomínios na Baixada Santista
          </h2>
          <p className="text-sm font-sans text-secondary leading-relaxed">
            Cada município possui suas próprias particularidades orçamentárias, desafios climáticos e leis municipais específicas. Clique abaixo na sua cidade para entender nossa estratégia de gestão local personalizada:
          </p>
        </div>

        {/* Cities Grid List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cityPages.map((city) => (
            <button
              key={city.slug}
              id={`city-card-btn-${city.slug}`}
              onClick={() => onNavigateToCity(city.slug)}
              className="group text-left p-6 rounded-2xl border border-border-light bg-surface-container-lowest hover:border-primary hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-48 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {/* Soft decorative background dot */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider group-hover:text-primary transition-colors">
                    SP
                  </span>
                </div>
                
                <h3 className="font-sans font-extrabold text-lg text-[#101c29] group-hover:text-primary transition-colors">
                  {city.cityName}
                </h3>
                <p className="text-xs text-secondary mt-1.5 line-clamp-2">
                  {city.intro}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-primary opacity-80 group-hover:opacity-100 mt-4 transition-all">
                <span>Ver Soluções Locais</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Localized Challenges Segment */}
        <div className="bg-[#f8fafc] border border-border-light p-8 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-center">
          {localFactors.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="flex gap-4 items-start select-none">
                <div className="p-3 bg-white text-primary rounded-xl shadow-sm border border-border-light shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-[#101c29]">{f.title}</h4>
                  <p className="text-xs text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Booster for 1,500 words target */}
        <div className="border-t border-border-light pt-12 text-xs text-secondary space-y-4 max-w-5xl mx-auto leading-relaxed">
          <p className="font-sans">
            Para garantir o melhor posicionamento como a principal <strong>administradora de condomínios em Santos</strong> e adjacências, nosso sistema integra plenamente as regulamentações cíveis e as melhores práticas do mercado paulista. Atendemos a bairros de alta densidade vertical como Gonzaga, Ponta da Praia, Boqueirão, José Menino e Aparecida em Santos; Centro e Itararé em São Vicente; Canto do Forte, Guilhermina, Aviação e Tupi na Praia Grande; além de Pitangueiras, Astúrias e Enseada no Guarujá.
          </p>
          <p className="font-sans">
            Com as complexas demandas de obras de infraestrutura, instalações de portaria eletrônica inteligente e renovação periódica de AVCB, contar com uma assessoria local é essencial para a conservação e valorização patrimonial das unidades autônomas na Baixada Santista.
          </p>
        </div>

      </div>
    </section>
  );
}
