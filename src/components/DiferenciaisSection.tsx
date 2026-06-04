import { useState } from 'react';
import { Shield, Sparkles, UserCheck, Cpu, Heart, Check, Clock, Globe, Award, HelpCircle } from 'lucide-react';

interface Differential {
  num: string;
  id: string;
  title: string;
  desc: string;
  highlighted: boolean;
  icon: any;
  details: {
    subtitle: string;
    items: string[];
    stat: string;
    statLabel: string;
  };
}

export default function DiferenciaisSection() {
  const [activeDiff, setActiveDiff] = useState<Differential | null>(null);

  const differentials: Differential[] = [
    {
      num: '01',
      id: 'atendimento',
      title: 'Atendimento Personalizado',
      desc: 'Suporte próximo e especializado para residências e condomínios clubes com gestores dedicados.',
      highlighted: false,
      icon: UserCheck,
      details: {
        subtitle: 'Canal de Resposta Ágil e Gerente Dedicado',
        items: [
          'Gerente exclusivo por condomínio (sem robôs)',
          'SLA de resposta em até 4 horas úteis',
          'Visitas semanais de acompanhamento operacional',
          'Atendimento presencial focado na resolução rápida'
        ],
        stat: '98%',
        statLabel: 'Satisfação no primeiro contato'
      }
    },
    {
      num: '02',
      id: 'expertise',
      title: 'Expertise Reconhecida',
      desc: 'Liderança de Cristhiane Xavier, vice-presidente da Comissão de Direito Condominial OAB Santos.',
      highlighted: true,
      icon: Award,
      details: {
        subtitle: 'Amparo Jurídico de Alto Nível',
        items: [
          'Prevenção de demandas trabalhistas e cíveis',
          'Análise minuciosa de contratos e prestadores',
          'Cobrança amigável estruturada para redução de inadimplência',
          'Mediação profissional de conflitos entre condôminos'
        ],
        stat: '15+ Anos',
        statLabel: 'De tradição e liderança jurídica'
      }
    },
    {
      num: '03',
      id: 'tecnologia',
      title: 'Tecnologia Avançada',
      desc: 'Plataforma intuitiva para acesso a boletos, assembleias digitais e prestação de contas.',
      highlighted: false,
      icon: Cpu,
      details: {
        subtitle: 'Gestão Inteligente na Palma da Mão',
        items: [
          'Sistema operacional próprio e exclusivo da Facilities',
          'Segunda via de boletos, Pix e faturamento facilitado',
          'Prestação de contas diária digitalizada com notas fiscais',
          'Assembleias virtuais certificadas e votações com validade legal'
        ],
        stat: '100%',
        statLabel: 'Digitalizado e transparente'
      }
    },
    {
      num: '04',
      id: 'gestao',
      title: 'Gestão Humanizada',
      desc: 'Comprometimento absoluto com a convivência pacífica, bem-estar e valorização do patrimônio.',
      highlighted: false,
      icon: Heart,
      details: {
        subtitle: 'Foco nas Pessoas e Comunidade',
        items: [
          'Programas de integração social e datas festivas',
          'Comunicação amigável e pesquisas periódicas de satisfação',
          'Projetos de sustentabilidade e economia de recursos comuns',
          'Treinamentos periódicos para zeladores e porteiros'
        ],
        stat: '20k+',
        statLabel: 'Vidas impactadas positivamente'
      }
    }
  ];

  return (
    <section id="diferenciais" className="py-20 px-4 md:px-12 bg-background border-b border-border-light">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-on-surface tracking-tight">
            Nossos Diferenciais
          </h2>
          <p className="text-base text-secondary max-w-2xl mx-auto font-sans leading-relaxed">
            Fortalecemos laços autênticos entre as pessoas e os espaços, tornando a experiência de viver em condomínio mais segura, transparente e colaborativa.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {differentials.map((diff) => {
            const IconComponent = diff.icon;
            return (
              <button
                key={diff.id}
                id={`diff-card-${diff.id}`}
                onClick={() => setActiveDiff(diff)}
                className={`text-left p-8 rounded-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer border ${
                  diff.highlighted
                    ? 'bg-primary text-on-primary border-primary shadow-[0px_8px_30px_rgba(175,16,26,0.15)] hover:scale-[1.02]'
                    : 'bg-white text-on-surface border-border-light hover:-translate-y-1 hover:shadow-lg hover:border-gray-250'
                }`}
              >
                <div className="space-y-6">
                  {/* Icon Card */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      diff.highlighted ? 'bg-white/10 text-white' : 'bg-primary/5 text-primary'
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Text Details */}
                  <div className="space-y-3">
                    <h3
                      className={`text-xl font-bold font-display leading-snug ${
                        diff.highlighted ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      {diff.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        diff.highlighted ? 'text-white/80' : 'text-secondary'
                      }`}
                    >
                      {diff.desc}
                    </p>
                    <span
                      className={`text-xs inline-flex items-center gap-1 font-semibold underline underline-offset-4 mt-2 transition-opacity ${
                        diff.highlighted ? 'text-white/90 group-hover:text-white' : 'text-primary group-hover:text-primary-hover'
                      }`}
                    >
                      Saiba mais detalhes &rarr;
                    </span>
                  </div>
                </div>

                {/* Number styling */}
                <div
                  className={`font-bold text-4xl mt-8 font-display select-none transition-colors ${
                    diff.highlighted ? 'text-white/10' : 'text-surface-dim/40'
                  }`}
                >
                  {diff.num}
                </div>
              </button>
            );
          })}
        </div>

        {/* Floating details banner on selection */}
        {activeDiff && (
          <div
            id="diff-modal-container"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={() => setActiveDiff(null)}
          >
            <div
              id="diff-modal-content"
              className="bg-white rounded-2xl p-6 md:p-8 max-w-xl w-full border border-border-light shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative top border colored primary */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>

              {/* Close Button */}
              <button
                id="diff-modal-close"
                onClick={() => setActiveDiff(null)}
                className="absolute top-4 right-4 text-secondary hover:text-on-surface p-2 rounded-lg transition-colors"
              >
                &times; Close
              </button>

              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {(() => {
                      const Icon = activeDiff.icon;
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-primary">
                      Diferencial {activeDiff.num}
                    </span>
                    <h4 className="text-xl font-bold text-on-surface font-display">{activeDiff.title}</h4>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-primary">{activeDiff.details.subtitle}</p>
                  <p className="text-sm text-secondary leading-relaxed">{activeDiff.desc}</p>
                </div>

                {/* Bullets */}
                <ul className="space-y-3 bg-background p-4 rounded-xl border border-border-light">
                  {activeDiff.details.items.map((item, index) => (
                    <li key={index} className="flex gap-2 items-start text-sm text-on-surface">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Statistical highlight container */}
                <div className="flex items-center justify-between border-t border-border-light pt-4">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-primary font-display font-black leading-none">
                      {activeDiff.details.stat}
                    </span>
                    <span className="text-xs text-secondary mt-1">{activeDiff.details.statLabel}</span>
                  </div>
                  <button
                    id="diff-modal-btn"
                    onClick={() => setActiveDiff(null)}
                    className="bg-primary text-on-primary hover:bg-primary-hover px-4 py-2 rounded-lg text-xs font-semibold shadow-md"
                  >
                    Entendi, obrigado!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
