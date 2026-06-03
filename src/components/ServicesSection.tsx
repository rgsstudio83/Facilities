import { useState } from 'react';
import { CheckCircle2, User, Users, ArrowRight, ShieldCheck, FileText, CalendarCheck, HelpCircle } from 'lucide-react';

interface ServiceItem {
  title: string;
  desc: string;
  detail: string;
}

interface ServicesSectionProps {
  onNavigateToService: (slug: string) => void;
}

export default function ServicesSection({ onNavigateToService }: ServicesSectionProps) {
  const [activeTab, setActiveTab] = useState<'individuais' | 'coletivos'>('individuais');

  const getSlugFromTitle = (title: string) => {
    switch (title) {
      case 'Gestão de Inadimplência':
        return 'gestao-de-inadimplencia';
      case 'Expertise Jurídica':
      case 'Suporte Jurídico Coletivo':
        return 'assessoria-juridica';
      case 'Plataforma Superlógica':
        return 'prestacao-de-contas';
      case 'Recrutamento e Seleção':
        return 'recursos-humanos';
      case 'Gestão Financeira':
        return 'gestao-financeira';
      case 'Vistorias Periódicas':
        return 'sindico-profissional';
      case 'Assembleias Gerais':
        return 'administracao-de-condominios';
      default:
        return 'administracao-de-condominios';
    }
  };

  const individuaisServices: ServiceItem[] = [
    {
      title: 'Gestão de Inadimplência',
      desc: 'Acompanhamento rigoroso e humano.',
      detail: 'Abordagem conciliadora para recuperação de receitas sem tensionar as relações comunitárias.',
    },
    {
      title: 'Expertise Jurídica',
      desc: 'Consultoria especializada.',
      detail: 'Análise contínua das deliberações legais, regimento interno e segurança institucional.',
    },
    {
      title: 'Plataforma Superlógica',
      desc: 'Acesso digital total.',
      detail: 'Uma ferramenta líder de mercado que permite consultar balancetes, agendar e pagar com facilidade.',
    },
    {
      title: 'Recrutamento e Seleção',
      desc: 'Triagem criteriosa de profissionais.',
      detail: 'Seleção rigorosa de funcionários externos e internos para garantir segurança máxima ao condomínio.',
    },
  ];

  const coletivosServices: ServiceItem[] = [
    {
      title: 'Gestão Financeira',
      desc: 'Prestação de contas detalhada.',
      detail: 'Balanços mensais minuciosas, controle rígido do fundo de reserva e otimização tarifária ativa.',
    },
    {
      title: 'Vistorias Periódicas',
      desc: 'Manutenção de áreas comuns.',
      detail: 'Visitas programadas de corpo técnico para inspecionar instalações elétricas, estruturais e hidráulicas.',
    },
    {
      title: 'Assembleias Gerais',
      desc: 'Organização e facilitação.',
      detail: 'Estruturação completa de reuniões presenciais e híbridas com ata ágil transcrita por assessoria especializada.',
    },
    {
      title: 'Suporte Jurídico Coletivo',
      desc: 'Proteção para o condomínio.',
      detail: 'Assessoria em contratos de reformas, contencioso e conformidade condominial com sindicância sólida.',
    },
  ];

  const currentServices = activeTab === 'individuais' ? individuaisServices : coletivosServices;

  return (
    <section id="servicos" className="py-20 px-4 md:px-12 bg-surface-container-low border-b border-border-light">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Toggles and Text */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-primary font-semibold text-xs tracking-widest uppercase font-sans">
                Nossas Soluções
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-on-surface leading-tight">
                Serviços Completos e Personalizados
              </h2>
              <p className="text-sm font-sans text-secondary leading-relaxed">
                Combinamos inteligência jurídica especializada e alta tecnologia de ponta para proporcionar uma administração tranquila ao síndico e o máximo de conforto aos moradores.
              </p>
            </div>

            {/* Simulated Interactive Tab Switcher buttons */}
            <div className="flex flex-col gap-4">
              <button
                id="tab-btn-ind"
                onClick={() => setActiveTab('individuais')}
                className={`text-left p-6 rounded-xl border transition-all flex items-start gap-4 ${
                  activeTab === 'individuais'
                    ? 'border-primary bg-white shadow-md'
                    : 'border-border-light bg-white/50 hover:border-gray-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    activeTab === 'individuais' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                  }`}
                >
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-sans text-sm font-bold flex items-center gap-1.5 ${
                      activeTab === 'individuais' ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    Serviços Individuais
                    <ArrowRight className="w-3.5 h-3.5" />
                  </h4>
                  <p className="text-xs text-secondary mt-1">Foco no suporte direto ao síndico e moradores.</p>
                </div>
              </button>

              <button
                id="tab-btn-col"
                onClick={() => setActiveTab('coletivos')}
                className={`text-left p-6 rounded-xl border transition-all flex items-start gap-4 ${
                  activeTab === 'coletivos'
                    ? 'border-primary bg-white shadow-md'
                    : 'border-border-light bg-white/50 hover:border-gray-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    activeTab === 'coletivos' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-sans text-sm font-bold flex items-center gap-1.5 ${
                      activeTab === 'coletivos' ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    Serviços Coletivos
                    <ArrowRight className="w-3.5 h-3.5" />
                  </h4>
                  <p className="text-xs text-secondary mt-1">Gestão financeira, operacional e de infraestrutura.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: Grid and Visual Assets */}
          <div className="lg:col-span-7">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentServices.map((service, idx) => {
                const targetSlug = getSlugFromTitle(service.title);
                return (
                  <button
                    key={service.title}
                    id={`service-card-btn-${idx}`}
                    onClick={() => onNavigateToService(targetSlug)}
                    className="group text-left bg-white p-5 rounded-2xl border border-border-light shadow-sm flex gap-4 transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/15"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="space-y-1 w-full">
                      <p className="font-sans font-extrabold text-sm text-[#101c29] group-hover:text-primary transition-colors flex justify-between items-center">
                        {service.title}
                        <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Ver Página &rarr;</span>
                      </p>
                      <p className="text-xs text-secondary leading-normal">{service.desc}</p>
                      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100 hidden md:block group-hover:bg-gray-100/50 transition-colors">
                        {service.detail}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
