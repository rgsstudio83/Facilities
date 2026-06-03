import { useState } from 'react';
import { X, Building2, User, HelpCircle, Check, Sparkles, Receipt, Percent } from 'lucide-react';
import { QuoteRequest } from '../types';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuoteShowToast: (quote: QuoteRequest) => void;
}

export default function QuoteModal({ isOpen, onClose, onAddQuoteShowToast }: QuoteModalProps) {
  const [step, setStep] = useState(1);
  const [condominioNome, setCondominioNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [unidades, setUnidades] = useState(30);
  const [contatoNome, setContatoNome] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [cargo, setCargo] = useState<'Síndico' | 'Conselheiro' | 'Morador' | 'Administradora'>('Síndico');

  // Interactive estimates
  const honorariosEstimated = Math.max(750, unidades * 18 + 350);
  const economiaEstimated = unidades * 45;

  const handleNext = () => {
    if (step === 1 && !condominioNome.trim()) {
      alert('Por favor, informe o nome do Condomínio.');
      return;
    }
    if (step === 2 && (!contatoNome.trim() || !contatoEmail.trim() || !contatoTelefone.trim())) {
      alert('Por favor, preencha todas as credenciais de contato.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleFinish = () => {
    const quote: QuoteRequest = {
      id: Math.random().toString(36).substring(7),
      condominioNome,
      endereco,
      unidades,
      contatoNome,
      contatoEmail,
      contatoTelefone,
      cargo,
    };
    onAddQuoteShowToast(quote);
    setStep(4); // Show estimate & success page
  };

  if (!isOpen) return null;

  return (
    <div id="quote-modal-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div id="quote-modal-card" className="bg-white rounded-3xl w-full max-w-2xl border border-border-light shadow-2xl overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-primary hover:bg-primary-hover p-6 text-white flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Building2 className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-lg font-display">Solicitar Orçamento Executivo</h3>
              <p className="text-xs text-white/80">Estudo de viabilidade de gestão sem compromisso</p>
            </div>
          </div>
          <button
            id="quote-modal-close-btn"
            onClick={onClose}
            className="p-1 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white transition-all font-semibold"
          >
            Fechar &times;
          </button>
        </div>

        {/* Steps Progress Header */}
        {step < 4 && (
          <div id="quote-modal-steps-nav" className="flex justify-between items-center border-b border-border-light px-8 py-4 bg-gray-50">
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step >= 1 ? 'bg-primary text-white border-primary' : 'border-gray-300'}`}>1</span>
              <span>Condomínio</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step >= 2 ? 'bg-primary text-white border-primary' : 'border-gray-300'}`}>2</span>
              <span>Contato</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step >= 3 ? 'bg-primary text-white border-primary' : 'border-gray-300'}`}>3</span>
              <span>Confirmar</span>
            </div>
          </div>
        )}

        {/* Form Body steps */}
        <div className="p-8">
          {step === 1 && (
            <div id="quote-step-1" className="space-y-6">
              <h4 className="text-base font-bold text-on-surface">Dados Básicos do Condomínio</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="condominio-nome" className="text-xs font-semibold uppercase text-secondary">Nome do Condomínio *</label>
                  <input
                    id="condominio-nome"
                    type="text"
                    value={condominioNome}
                    onChange={(e) => setCondominioNome(e.target.value)}
                    placeholder="Ex: Residencial Sol e Mar"
                    className="w-full bg-[#F1F4F8] p-4 text-sm rounded-lg border border-transparent focus:border-primary focus:ring-0 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="condominio-endereco" className="text-xs font-semibold uppercase text-secondary">Endereço / Cidade *</label>
                  <input
                    id="condominio-endereco"
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Ex: Av. Bartolomeu de Gusmão, Santos - SP"
                    className="w-full bg-[#F1F4F8] p-4 text-sm rounded-lg border border-transparent focus:border-primary focus:ring-0 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label htmlFor="condominio-unidades-range" className="text-xs font-semibold uppercase text-secondary">Quantidade de Unidades (Apto/Casas)</label>
                    <span className="text-sm font-bold text-primary">{unidades} unidades</span>
                  </div>
                  <input
                    id="condominio-unidades-range"
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={unidades}
                    onChange={(e) => setUnidades(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">Arraste para ajustar o tamanho do escopo de administração.</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div id="quote-step-2" className="space-y-6">
              <h4 className="text-base font-bold text-on-surface">Seus Dados de Contato</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="solicitante-nome" className="text-xs font-semibold uppercase text-secondary">Seu Nome Completo *</label>
                    <input
                      id="solicitante-nome"
                      type="text"
                      value={contatoNome}
                      onChange={(e) => setContatoNome(e.target.value)}
                      placeholder="Ex: Roberto Silva"
                      className="w-full bg-[#F1F4F8] p-4 text-sm rounded-lg border border-transparent focus:border-primary focus:ring-0 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="solicitante-cargo" className="text-xs font-semibold uppercase text-secondary">Seu Cargo / Atuação</label>
                    <select
                      id="solicitante-cargo"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value as any)}
                      className="w-full bg-[#F1F4F8] p-4 text-sm rounded-lg border border-transparent focus:border-primary focus:ring-0 outline-none"
                    >
                      <option value="Síndico">Síndico(a)</option>
                      <option value="Conselheiro">Membro do Conselho</option>
                      <option value="Morador">Morador Proprietário</option>
                      <option value="Administradora">Ex-Administradora</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="solicitante-email" className="text-xs font-semibold uppercase text-secondary">E-mail para Retorno *</label>
                    <input
                      id="solicitante-email"
                      type="email"
                      value={contatoEmail}
                      onChange={(e) => setContatoEmail(e.target.value)}
                      placeholder="roberto@email.com"
                      className="w-full bg-[#F1F4F8] p-4 text-sm rounded-lg border border-transparent focus:border-primary focus:ring-0 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="solicitante-telefone" className="text-xs font-semibold uppercase text-secondary">Telefone / WhatsApp *</label>
                    <input
                      id="solicitante-telefone"
                      type="text"
                      value={contatoTelefone}
                      onChange={(e) => setContatoTelefone(e.target.value)}
                      placeholder="(13) 98888-2222"
                      className="w-full bg-[#F1F4F8] p-4 text-sm rounded-lg border border-transparent focus:border-primary focus:ring-0 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div id="quote-step-3" className="space-y-6">
              <h4 className="text-base font-bold text-on-surface">Confirmar Escopo de Administração</h4>
              <div className="bg-background p-6 rounded-2xl border border-border-light space-y-4">
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-secondary">Condomínio Solicitante:</span>
                  <span className="font-bold text-on-surface">{condominioNome}</span>
                </div>
                {endereco && (
                  <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span className="text-secondary">Endereço:</span>
                    <span className="font-bold text-on-surface">{endereco}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-secondary">Tamanho / Unidades:</span>
                  <span className="font-bold text-primary">{unidades} unidades</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-secondary">Nome Solicitante:</span>
                  <span className="font-bold text-on-surface">
                    {contatoNome} ({cargo})
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 italic">
                Ao clicar em finalizar, calcularemos instantaneamente os honorários de simulação e os benefícios operacionais base de um app integrado com suporte jurídico.
              </p>
            </div>
          )}

          {step === 4 && (
            <div id="quote-step-4" className="space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-on-surface font-display">Estudo Técnico Concluído!</h4>
              <p className="text-sm text-secondary max-w-lg mx-auto">
                Sua proposta executiva já foi mapeada. Segue abaixo um orçamento prévio e as otimizações financeiras calculadas para o <strong>{condominioNome}</strong>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                {/* Cost card */}
                <div className="p-4 bg-[#F1F4F8] border border-border-light rounded-2xl text-left space-y-1">
                  <span className="text-[10px] uppercase text-secondary font-semibold flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-primary" /> Honorários Mensais Estimados
                  </span>
                  <p className="text-2xl font-bold font-display text-primary">R$ {honorariosEstimated.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-gray-400">Baseado no escopo de {unidades} unidades.</p>
                </div>

                {/* Savings helper card */}
                <div className="p-4 bg-success/5 border border-success/15 rounded-2xl text-left space-y-1">
                  <span className="text-[10px] uppercase text-success font-semibold flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-success" /> Economia Operacional / Ano
                  </span>
                  <p className="text-2xl font-bold font-display text-success">R$ {(economiaEstimated * 12).toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-gray-400">Através de reduções de inadimplência e compras coletivas.</p>
                </div>
              </div>

              <div className="bg-[#FFEBEB] text-primary/85 p-3.5 rounded-xl text-xs max-w-md mx-auto">
                * Este é um estudo automatizado básico. Um de nossos consultores seniores enviará a proposta comercial formalizada por e-mail em anexo PDF hoje mesmo.
              </div>

              <button
                id="quote-success-close-btn"
                onClick={onClose}
                className="bg-primary text-on-primary hover:bg-primary-hover px-10 py-3 rounded-lg font-semibold shadow-md inline-block text-sm transition-all"
              >
                Concluir e Voltar ao Site
              </button>
            </div>
          )}

          {/* Action Footer Navigation buttons */}
          {step < 4 && (
            <div id="quote-step-nav-footer" className="mt-8 pt-6 border-t border-border-light flex justify-between items-center bg-white">
              {step > 1 ? (
                <button
                  id="quote-prev-btn"
                  onClick={handlePrev}
                  className="px-5 py-3 border border-border-light font-semibold text-secondary hover:text-on-surface rounded-xl transition-all active:scale-95 text-xs"
                >
                  &larr; Voltar
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  id="quote-next-btn"
                  onClick={handleNext}
                  className="bg-primary text-on-primary hover:bg-primary-hover px-6 py-3 font-semibold rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1"
                >
                  Próximo Passo &rarr;
                </button>
              ) : (
                <button
                  id="quote-finalize-btn"
                  onClick={handleFinish}
                  className="bg-success text-white hover:bg-success-dark px-10 py-3 font-semibold rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1 shadow-md"
                >
                  Calcular Viabilidade <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
