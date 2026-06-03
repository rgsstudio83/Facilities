import { useState } from 'react';
import { Handshake, Eye, Headphones, ShieldCheck, Terminal, Users, Info, ChevronRight } from 'lucide-react';

interface MethodologyStep {
  id: string;
  title: string;
  icon: any;
  explanation: string;
  bullet: string;
}

export default function ComoTrabalhamos() {
  const [selectedMethod, setSelectedMethod] = useState<string>('parceria');

  const steps: MethodologyStep[] = [
    {
      id: 'parceria',
      title: 'Parceria',
      icon: Handshake,
      explanation: 'Trabalhamos em sinergia com o síndico para otimizar tempo e recursos condominiais, atuando como um facilitador estratégico.',
      bullet: 'Alinhamento integral com os objetivos da comissão e do conselho.'
    },
    {
      id: 'transparencia',
      title: 'Transparência',
      icon: Eye,
      explanation: 'Toda movimentação financeira, notas fiscais digitalizadas e as conciliações bancárias ficam claras e atualizadas diariamente em nosso aplicativo.',
      bullet: 'Disponibilidade total online dos gastos para auditorias preventivas.'
    },
    {
      id: 'atendimento',
      title: 'Atendimento',
      icon: Headphones,
      explanation: 'Canais rápidos de WhatsApp, telefone fixo e portal online garantem que suas solicitações de manutenção e dúvidas sejam sanadas imediatamente.',
      bullet: 'Foco em resoluções rápidas com gestores operacionais seniores.'
    },
    {
      id: 'suporte',
      title: 'Suporte',
      icon: ShieldCheck,
      explanation: 'Consultoria técnica robusta em direito civil e condominial reduzindo em até 90% a possibilidade de passivos trabalhistas.',
      bullet: 'Segurança e consistência em contratos de seguros e reformas.'
    },
    {
      id: 'tecnologia',
      title: 'Tecnologia',
      icon: Terminal,
      explanation: 'Sistemas inteligentes integrados que simplificam de forma rápida a emissão de 2ª via de boleto, reservas, avisos e assembleias remotas.',
      bullet: 'Fim dos gargalos burocráticos através da digitalização ponta a ponta.'
    },
    {
      id: 'convivencia',
      title: 'Convivência',
      icon: Users,
      explanation: 'Estímulo à participação construtiva por meio de mediação de conflitos humanizada, pesquisas e eventos, unindo a nossa comunidade.',
      bullet: 'Promoção ativa do respeito recíproco e regras claras de bem-estar.'
    }
  ];

  const currentStep = steps.find(s => s.id === selectedMethod) || steps[0];

  return (
    <section id="metodologia" className="py-20 px-4 md:px-12 bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto">
        {/* Caption and Title */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-primary font-semibold text-xs tracking-widest uppercase font-sans">
            Metodologia
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-on-surface">
            Como Trabalhamos com Você
          </h2>
          <p className="text-sm text-secondary font-sans max-w-xl mx-auto">
            Clique nos pilares abaixo para ver como aplicamos nossos valores fundamentais no dia dia da gestão de seu condomínio.
          </p>
        </div>

        {/* Pillars Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6 mb-12">
          {steps.map((step) => {
            const IconComponent = step.icon;
            const isSelected = selectedMethod === step.id;
            return (
              <button
                key={step.id}
                id={`method-btn-${step.id}`}
                onClick={() => setSelectedMethod(step.id)}
                className={`flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all text-center group cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'border-border-light bg-white hover:border-gray-300'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-primary text-white scale-110 shadow-lg'
                      : 'bg-surface-container text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-105'
                  }`}
                >
                  <IconComponent className="w-6 h-6 " />
                </div>
                <h4 className="font-sans text-sm font-bold text-on-surface transition-colors group-hover:text-primary">
                  {step.title}
                </h4>
              </button>
            );
          })}
        </div>

        {/* Detailed Explainer Panel */}
        <div id="method-explainer-panel" className="bg-surface-container-low border border-border-light p-6 md:p-8 rounded-2xl max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-2">
            <h5 className="font-sans text-lg font-bold text-on-surface flex items-center gap-2">
              Pilar de Gestão: <span className="text-primary">{currentStep.title}</span>
            </h5>
            <p className="text-sm text-secondary leading-relaxed font-sans">{currentStep.explanation}</p>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary pt-2">
              <ChevronRight className="w-4 h-4" />
              <span>{currentStep.bullet}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
