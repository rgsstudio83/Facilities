import { useState, FormEvent } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { ContactMessage } from '../types';
import { supabase, isSupabaseConfigured, saveSimulatedData } from '../lib/supabaseClient';

interface ContatoProps {
  onAddMessageShowToast: (message: ContactMessage) => void;
}

export default function Contato({ onAddMessageShowToast }: ContatoProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'success' | 'fallback' | 'loading' | null>(null);

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!nome.trim()) tempErrors.nome = 'Diga-nos o seu nome, por favor.';
    if (!email.trim()) {
      tempErrors.email = 'O e-mail é obrigatório para darmos retorno.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Por favor, insira um e-mail válido.';
    }
    if (!telefone.trim()) tempErrors.telefone = 'Por favor, informe seu telefone.';
    if (!mensagem.trim()) tempErrors.mensagem = 'Escreva sua mensagem.';
    if (!agreed) tempErrors.agreed = 'Você precisa aceitar os termos de privacidade para continuar.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setSupabaseStatus('loading');

      const newMessage: ContactMessage = {
        nome,
        email,
        telefone,
        mensagem,
        data: new Date().toLocaleDateString('pt-BR'),
      };

      try {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase
            .from('contact_messages')
            .insert([
              {
                nome: newMessage.nome,
                email: newMessage.email,
                telefone: newMessage.telefone,
                mensagem: newMessage.mensagem,
                data: newMessage.data
              }
            ]);

          if (error) {
            console.warn('Supabase insert failed, using fallback storage:', error.message);
            saveSimulatedData<ContactMessage>('contact_messages', newMessage);
            setSupabaseStatus('fallback');
          } else {
            console.log('Successfully saved to Supabase contact_messages');
            setSupabaseStatus('success');
          }
        } else {
          // Fallback to simulation mode if keys not defined
          saveSimulatedData<ContactMessage>('contact_messages', newMessage);
          setSupabaseStatus('fallback');
        }
      } catch (err) {
        console.error('Database connection error, falling back locally:', err);
        saveSimulatedData<ContactMessage>('contact_messages', newMessage);
        setSupabaseStatus('fallback');
      }

      onAddMessageShowToast(newMessage);

      setIsSubmitting(false);
      setIsSuccess(true);

      // Reset form
      setNome('');
      setEmail('');
      setTelefone('');
      setMensagem('');
      setAgreed(false);

      // Clear states after 6 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setSupabaseStatus(null);
      }, 6000);
    }
  };


  return (
    <section id="contato" className="py-20 px-4 md:px-12 bg-background border-b border-border-light">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-[32px] shadow-2xl border border-border-light bg-white">
          {/* Left Block - Detailed Contact Info */}
          <div className="lg:col-span-5 bg-on-surface p-8 md:p-14 text-white flex flex-col justify-between space-y-10">
            <div className="space-y-4">
              <span className="text-primary font-bold text-xs tracking-wider uppercase">Fale Conosco</span>
              <h2 className="text-3xl md:text-4xl font-bold font-display leading-tight">Vamos Conversar?</h2>
              <p className="text-sm text-gray-300 font-sans leading-relaxed">
                Preencha o formulário e nossa equipe técnica administrativa entrará em contato em menos de 24 horas úteis.
              </p>
            </div>

            {/* Structured info points */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-primary flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">E-mail Comercial</p>
                  <p className="font-sans text-sm font-semibold text-white">contato@facilitiesadm.com.br</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-primary flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Telefone Geral</p>
                  <p className="font-sans text-sm font-semibold text-white">(13) 2202-2052</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-primary flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Escritório Central</p>
                  <p className="font-sans text-sm font-semibold text-white">Rua Djalma Dutra 1, Santos - SP</p>
                </div>
              </div>
            </div>

            {/* Social handles with custom designs */}
            <div className="pt-8 border-t border-white/10">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-4">Redes Sociais</p>
              <div className="flex gap-4">
                <a
                  href="#contato"
                  className="w-10 h-10 rounded-xl border border-white/15 flex items-center justify-center hover:bg-primary hover:border-primary text-sm font-bold text-white transition-all hover:scale-105"
                  title="WhatsApp"
                >
                  W
                </a>
                <a
                  href="#contato"
                  className="w-10 h-10 rounded-xl border border-white/15 flex items-center justify-center hover:bg-primary hover:border-primary text-sm font-bold text-white transition-all hover:scale-105"
                  title="Instagram"
                >
                  I
                </a>
                <a
                  href="#contato"
                  className="w-10 h-10 rounded-xl border border-white/15 flex items-center justify-center hover:bg-primary hover:border-primary text-sm font-bold text-white transition-all hover:scale-105"
                  title="Facebook"
                >
                  F
                </a>
              </div>
            </div>
          </div>

          {/* Right Block - Interactive contact form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-14 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSuccess && (
                <div id="contact-success-banner" className="bg-success/10 text-success p-4 rounded-xl border border-success/20 flex gap-3 items-start animate-fade-in">
                  <Check className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h6 className="font-semibold text-sm">Mensagem de Contato Enviada!</h6>
                    <p className="text-xs text-secondary mt-0.5">
                      Nossos analistas de condomínio receberam a sua solicitação comercial.
                    </p>
                    {supabaseStatus === 'success' && (
                      <p className="text-[10px] text-green-700 bg-green-50 px-2 py-1 rounded mt-2 inline-flex items-center gap-1 font-semibold border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Sincronizado com Supabase (Tabela: contact_messages)
                      </p>
                    )}
                    {supabaseStatus === 'fallback' && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2 inline-flex items-center gap-1 font-semibold border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Armazenado com sucesso (Modo simulação local ativo)
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label htmlFor="nome" className="font-sans font-bold text-xs text-on-surface uppercase tracking-wider block">
                    Seu Nome
                  </label>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      if (errors.nome) setErrors({ ...errors, nome: '' });
                    }}
                    placeholder="Ex: João Silva"
                    className={`w-full bg-[#F1F4F8] border border-transparent focus:border-primary focus:ring-0 rounded-lg p-4 font-sans text-sm outline-none transition-colors ${
                      errors.nome ? 'border-primary/50' : ''
                    }`}
                  />
                  {errors.nome && (
                    <p className="text-primary text-xs flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.nome}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="font-sans font-bold text-xs text-on-surface uppercase tracking-wider block">
                    Seu E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="exemplo@email.com"
                    className={`w-full bg-[#F1F4F8] border border-transparent focus:border-primary focus:ring-0 rounded-lg p-4 font-sans text-sm outline-none transition-colors ${
                      errors.email ? 'border-primary/50' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-primary text-xs flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label htmlFor="telefone" className="font-sans font-bold text-xs text-on-surface uppercase tracking-wider block">
                  Telefone
                </label>
                <input
                  id="telefone"
                  type="text"
                  value={telefone}
                  onChange={(e) => {
                    setTelefone(e.target.value);
                    if (errors.telefone) setErrors({ ...errors, telefone: '' });
                  }}
                  placeholder="(13) 99999-9999"
                  className={`w-full bg-[#F1F4F8] border border-transparent focus:border-primary focus:ring-0 rounded-lg p-4 font-sans text-sm outline-none transition-colors ${
                    errors.telefone ? 'border-primary/50' : ''
                  }`}
                />
                {errors.telefone && (
                  <p className="text-primary text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.telefone}
                  </p>
                )}
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <label htmlFor="mensagem" className="font-sans font-bold text-xs text-on-surface uppercase tracking-wider block">
                  Mensagem
                </label>
                <textarea
                  id="mensagem"
                  value={mensagem}
                  onChange={(e) => {
                    setMensagem(e.target.value);
                    if (errors.mensagem) setErrors({ ...errors, mensagem: '' });
                  }}
                  placeholder="Como podemos ajudar o seu condomínio?"
                  rows={4}
                  className={`w-full bg-[#F1F4F8] border border-transparent focus:border-primary focus:ring-0 rounded-lg p-4 font-sans text-sm outline-none transition-colors resize-none ${
                    errors.mensagem ? 'border-primary/50' : ''
                  }`}
                />
                {errors.mensagem && (
                  <p className="text-primary text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.mensagem}
                  </p>
                )}
              </div>

              {/* Privacy agreement */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (errors.agreed) setErrors({ ...errors, agreed: '' });
                    }}
                    className="rounded text-primary focus:ring-primary h-5 w-5 border-light"
                  />
                  <label htmlFor="terms" className="text-xs text-secondary font-sans cursor-pointer">
                    Concordo com os termos de privacidade e autorizo o contato.
                  </label>
                </div>
                {errors.agreed && (
                  <p className="text-primary text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.agreed}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="contact-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-hover text-white text-base py-4 font-bold rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Enviando Solicitação...' : 'Enviar Solicitação'}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
