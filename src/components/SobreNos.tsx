import { Shield, Gauge, Swords, DollarSign, Award, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

export default function SobreNos() {
  const [activeBadge, setActiveBadge] = useState<number | null>(null);

  const stats = [
    { value: '15+', label: 'Anos de Mercado', icon: Award, detail: 'Atuação ininterrupta no litoral de SP.' },
    { value: '-45%', label: 'Inadimplência', icon: DollarSign, detail: 'Redução média obtida em 12 meses.' },
    { value: '-20%', label: 'Custos Comuns', icon: Gauge, detail: 'Otimização com contratos de compras.' },
  ];

  return (
    <section id="sobre-nos" className="relative bg-primary overflow-hidden text-white py-16 md:py-24">
      {/* Decorative background elements to balance visual noise */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-black/10 -skew-x-12 translate-x-1/3 hidden lg:block"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 relative z-10">
        {/* Left Column: Introdução e Métricas */}
        <div className="space-y-8 flex flex-col justify-center">
          <div className="space-y-3">
            <span className="text-white/80 font-semibold text-xs tracking-widest uppercase font-sans">
              Quem Somos
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight">
              Por que escolher a Facilities?
            </h2>
            <p className="text-base text-on-primary-container/90 leading-relaxed font-sans max-w-lg">
              Com mais de 15 anos de atuação sólida, unimos a precisão do Direito Condominial à eficiência tecnológica de ponta da plataforma Superlógica para garantir uma administração tranquila e transparente.
            </p>
          </div>

          {/* Interactive Statistics Cards */}
          <div className="pt-4 space-y-3">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">
              Impacto Mensurável (Clique para ver detalhes)
            </p>
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <button
                    key={idx}
                    id={`stat-stat-btn-${idx}`}
                    onClick={() => setActiveBadge(activeBadge === idx ? null : idx)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeBadge === idx
                        ? 'bg-white text-primary border-white shadow-lg scale-105'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xl md:text-2xl font-bold font-display">{stat.value}</span>
                      <Icon className="w-3.5 h-3.5 shrink-0 ml-1 opacity-70" />
                    </div>
                    <p className="text-[10px] uppercase font-semibold mt-1 tracking-wider line-clamp-1">
                      {stat.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Displaying Detail of selected badge */}
            {activeBadge !== null && (
              <div id="stat-detail-box" className="bg-white/15 p-3 rounded-lg border border-white/20 animate-fade-in">
                <p className="text-xs text-white/95">
                  <strong className="font-semibold block">{stats[activeBadge].label}:</strong>
                  {stats[activeBadge].detail}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Diferenciais Estratégicos */}
        <div className="space-y-6 flex flex-col justify-center">
          <h4 className="text-lg font-bold font-display uppercase tracking-wider text-white/90">
            Nossos Pilares de Atuação
          </h4>
          <ul className="space-y-4">
            <li className="flex gap-4 items-start bg-white/5 p-5 rounded-xl border border-white/10">
              <div className="p-3 bg-white/15 rounded-lg text-white">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h5 className="font-sans font-bold text-sm text-white">Segurança Jurídica Total</h5>
                <p className="text-xs text-white/70 leading-relaxed">
                  Consultoria técnica permanente liderada pela Dra. Cristhiane Xavier para evitar multas, notificações e sanções contenciosas.
                </p>
              </div>
            </li>

            <li className="flex gap-4 items-start bg-white/5 p-5 rounded-xl border border-white/10">
              <div className="p-3 bg-white/15 rounded-lg text-white">
                <Swords className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h5 className="font-sans font-bold text-sm text-white">Mediação Eficaz de Intrigas</h5>
                <p className="text-xs text-white/70 leading-relaxed">
                  Métodos de conciliação ativa para resolver perturbações de sossego e manter a harmonia interna sem judicializar processos.
                </p>
              </div>
            </li>

            <li className="flex gap-4 items-start bg-white/5 p-5 rounded-xl border border-white/10">
              <div className="p-3 bg-white/15 rounded-lg text-white">
                <Gauge className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h5 className="font-sans font-bold text-sm text-white">Eficiência Operacional Otimizada</h5>
                <p className="text-xs text-white/70 leading-relaxed">
                  Sistemas e prestadores qualificados com vistorias preventivas frequentes que ajudam a reduzir custos de manutenção extraordinária.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
