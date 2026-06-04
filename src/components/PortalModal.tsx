import { useState, useEffect, FormEvent } from 'react';
import {
  X,
  FileText,
  Calendar,
  Check,
  Copy,
  PlusCircle,
  CreditCard,
  LogOut,
  Info,
  DollarSign,
  Home,
  User,
  Vote,
  AlertTriangle,
  HelpCircle,
  ThumbsUp,
  Inbox
} from 'lucide-react';
import { Boleto, Booking, Assembly, Ticket } from '../types';
import { supabase, isSupabaseConfigured, saveSimulatedData, getSimulatedData } from '../lib/supabaseClient';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification: (headline: string, text: string) => void;
}

export default function PortalModal({ isOpen, onClose, onShowNotification }: PortalModalProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('Roberto Silva');
  const [apartmentCode, setApartmentCode] = useState('Apto 41-B');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'financeiro' | 'reservas' | 'ocorrencias' | 'atas' | 'balanço'>('financeiro');

  // Sub-dialogs
  const [barCodeModal, setBarCodeModal] = useState<Boleto | null>(null);

  // In-memory persistent states for demo
  const [boletos, setBoletos] = useState<Boleto[]>([
    {
      id: 'BOL-1092',
      referencia: 'Junho/2026',
      vencimento: '10/06/2026',
      valor: 645.90,
      status: 'Pendente',
      codigoBarras: '34191.79001 01043.513184 91020.150008 7 94520000064590'
    },
    {
      id: 'BOL-1081',
      referencia: 'Maio/2026',
      vencimento: '10/05/2026',
      valor: 645.90,
      status: 'Pago',
      codigoBarras: '34191.79001 01043.513184 91020.150008 7 94520000064590'
    },
    {
      id: 'BOL-1070',
      referencia: 'Abril/2026',
      vencimento: '10/04/2026',
      valor: 695.90,
      status: 'Pago',
      codigoBarras: '34191.79001 01043.513184 91020.150008 7 94520000069590'
    }
  ]);

  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'BKG-098',
      area: 'Churrasqueira Superior',
      data: '13/06/2026',
      periodo: 'Tarde',
      status: 'Confirmado'
    }
  ]);

  const [assemblies, setAssemblies] = useState<Assembly[]>([
    {
      id: 'ASM-401',
      titulo: 'Reforma da Fachada Externa',
      data: '18/06/2026',
      hora: '19:30',
      pauta: 'Deliberação e aprovação da taxa extra para pintura impermeabilizante da fachada do bloco A e B.',
      votacaoAtiva: true,
      perguntaVotacao: 'Aprovar taxa extra de R$ 45,00 por apartamento durante 6 meses para pintura?',
      votosFavor: 24,
      votosContra: 11,
      votoUsuario: undefined
    },
    {
      id: 'ASM-399',
      titulo: 'Instalação de Câmeras na Garagem G2',
      data: '22/04/2026',
      hora: '20:00',
      pauta: 'Substituição das câmeras analógicas antigas por câmeras digitais IP full HD com monitoramento.',
      votacaoAtiva: false,
      votoUsuario: 'Favor'
    }
  ]);

  const [ocorrencias, setOcorrencias] = useState<Ticket[]>([
    {
      id: 'TKT-2900',
      categoria: 'Manutenção',
      titulo: 'Luz queimada no corredor do 4º andar',
      descricao: 'A lâmpada em frente ao elevador social do bloco B está piscando e queima com frequência.',
      dataCriacao: '01/06/2026',
      status: 'Aberto'
    }
  ]);

  // Form states inside tabs
  const [newBookingArea, setNewBookingArea] = useState('Salão de Festas Master');
  const [newBookingDate, setNewBookingDate] = useState('18/06/2026');
  const [newBookingPeriod, setNewBookingPeriod] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>('Noite');

  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'Manutenção' | 'Limpeza' | 'Barulho' | 'Financeiro' | 'Outros'>('Manutenção');
  const [newTicketDesc, setNewTicketDesc] = useState('');

  // Sincronização inicial com o Supabase
  useEffect(() => {
    if (!isOpen) return;

    const fetchSupabaseData = async () => {
      // Carrega dados offline salvos anteriormente nesta sessão local
      const localBkgs = getSimulatedData<Booking>('bookings');
      const localTkts = getSimulatedData<Ticket>('tickets');
      
      if (localBkgs.length > 0) {
        setBookings(prev => {
          const combined = [...localBkgs, ...prev];
          return combined.filter((val, index, self) => self.findIndex(t => t.id === val.id) === index);
        });
      }
      if (localTkts.length > 0) {
        setOcorrencias(prev => {
          const combined = [...localTkts, ...prev];
          return combined.filter((val, index, self) => self.findIndex(t => t.id === val.id) === index);
        });
      }

      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data: dbBkgs, error: errBkgs } = await supabase.from('bookings').select('*');
        if (dbBkgs && !errBkgs) {
          const mappedBkgs: Booking[] = dbBkgs.map(b => ({
            id: b.id,
            area: b.area,
            data: b.data,
            periodo: b.periodo as any,
            status: b.status as any
          }));
          setBookings(prev => {
            const combined = [...mappedBkgs, ...prev];
            return combined.filter((val, index, self) => self.findIndex(t => t.id === val.id) === index);
          });
        }

        const { data: dbTkts, error: errTkts } = await supabase.from('tickets').select('*');
        if (dbTkts && !errTkts) {
          const mappedTkts: Ticket[] = dbTkts.map(t => ({
            id: t.id,
            categoria: t.categoria as any,
            titulo: t.titulo,
            descricao: t.descricao || '',
            dataCriacao: t.data_criacao,
            status: t.status as any
          }));
          setOcorrencias(prev => {
            const combined = [...mappedTkts, ...prev];
            return combined.filter((val, index, self) => self.findIndex(t => t.id === val.id) === index);
          });
        }
      } catch (err) {
        console.warn('Falha ao conectar com tabelas do Supabase corporativo:', err);
      }
    };

    fetchSupabaseData();
  }, [isOpen]);

  // Handle simulated Quick Login
  const handleDemoLogin = (role: 'morador' | 'sindico') => {
    if (role === 'sindico') {
      setUsername('Cristhiane Xavier');
      setApartmentCode('Síndico Profissional');
    } else {
      setUsername('Roberto Silva');
      setApartmentCode('Apto 41-B');
    }
    setIsLoggedIn(true);
    onShowNotification('Login efetuado!', 'Bem-vindo ao painel demonstrativo Facilities.');
  };

  const handleCustomLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!cpf || !password) {
      alert('Por favor, informe credenciais demonstrativas para entrar.');
      return;
    }
    setIsLoggedIn(true);
    onShowNotification('Seja bem-vindo!', 'Seu login simulado de residente foi efetuado.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCpf('');
    setPassword('');
  };

  const handleCopyBarcode = (bolId: string) => {
    navigator.clipboard.writeText('34191790010104351318491020150008794520000064590');
    onShowNotification('Copiado!', 'Código de barras copiado para a área de transferência.');
  };

  const handleSimulatePayment = (bolId: string) => {
    setBoletos(prev =>
      prev.map(b => b.id === bolId ? { ...b, status: 'Pago' } : b)
    );
    setBarCodeModal(null);
    onShowNotification('Sucesso Pix!', 'Boleto considerado pago no demonstrativo local! Saldo compensado.');
  };

  const handleAddBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBookingDate) {
      alert('Escolha uma data.');
      return;
    }

    const newBkg: Booking = {
      id: 'BKG-' + Math.floor(Math.random() * 1000),
      area: newBookingArea,
      data: newBookingDate.split('-').reverse().join('/'),
      periodo: newBookingPeriod,
      status: 'Confirmado'
    };

    setBookings(prev => [newBkg, ...prev]);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('bookings').insert([
          {
            id: newBkg.id,
            area: newBkg.area,
            data: newBkg.data,
            periodo: newBkg.periodo,
            status: newBkg.status
          }
        ]);
        if (error) throw error;
        onShowNotification('Reserva Confirmada!', `${newBookingArea} salva no banco Supabase para o dia ${newBkg.data}.`);
      } else {
        saveSimulatedData<Booking>('bookings', newBkg);
        onShowNotification('Reserva Confirmada!', `${newBookingArea} agendada com sucesso para ${newBkg.data}.`);
      }
    } catch (err) {
      console.warn('Supabase booking insert failed, saved offline:', err);
      saveSimulatedData<Booking>('bookings', newBkg);
      onShowNotification('Reserva Confirmada!', `${newBookingArea} agendada localmente.`);
    }
  };

  const handleAddTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) {
      alert('Digite o título do ocorrência.');
      return;
    }

    const newTkt: Ticket = {
      id: 'TKT-' + Math.floor(Math.random() * 10000),
      categoria: newTicketCategory,
      titulo: newTicketTitle,
      descricao: newTicketDesc,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      status: 'Aberto'
    };

    setOcorrencias(prev => [newTkt, ...prev]);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('tickets').insert([
          {
            id: newTkt.id,
            categoria: newTkt.categoria,
            titulo: newTkt.titulo,
            descricao: newTkt.descricao,
            data_criacao: newTkt.dataCriacao,
            status: newTkt.status
          }
        ]);
        if (error) throw error;
        onShowNotification('Ocorrência Salva!', 'Registrado com sucesso no banco Supabase.');
      } else {
        saveSimulatedData<Ticket>('tickets', newTkt);
        onShowNotification('Chamado Criado!', 'A equipe Facilities foi notificada e resolverá o chamado.');
      }
    } catch (err) {
      console.warn('Supabase ticket insert failed, saved offline:', err);
      saveSimulatedData<Ticket>('tickets', newTkt);
      onShowNotification('Chamado Criado!', 'Ocorrência salva offline com sucesso.');
    }

    setNewTicketTitle('');
    setNewTicketDesc('');
  };

  const handleVote = (asmId: string, choice: 'Favor' | 'Contra') => {
    setAssemblies(prev =>
      prev.map(asm => {
        if (asm.id === asmId) {
          const isY = choice === 'Favor';
          return {
            ...asm,
            votoUsuario: choice,
            votosFavor: (asm.votosFavor || 0) + (isY ? 1 : 0),
            votosContra: (asm.votosContra || 0) + (isY ? 0 : 1)
          };
        }
        return asm;
      })
    );
    onShowNotification('Voto Computado!', 'Sua deliberação foi registrada com validade jurídica.');
  };

  if (!isOpen) return null;

  return (
    <div id="portal-modal-overlay" className="fixed inset-0 bg-[#101c29]/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6 overflow-y-auto animate-fade-in">
      <div id="portal-modal-card" className="bg-[#f8f9ff] rounded-[24px] w-full max-w-5xl h-full max-h-[85vh] border border-[#cfdbec] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Header Panel */}
        <div className="bg-[#101c29] p-5 text-white flex justify-between items-center shrink-0 border-b border-white/10">
          <div className="flex gap-3 items-center">
            <div className="bg-[#af101a] p-2 rounded-xl text-white">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-base tracking-wide">Área do Condômino Facilities</h3>
              <p className="text-[10px] text-gray-300">Acesso integrado - Superlógica & Jurisprudência</p>
            </div>
          </div>
          <button
            id="portal-modal-close"
            onClick={onClose}
            className="p-1 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white/90"
          >
            Sair &times;
          </button>
        </div>

        {/* Not Logged In Screen */}
        {!isLoggedIn ? (
          <div id="portal-login-screen" className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            
            {/* Left pitch side */}
            <div className="max-w-xs space-y-4 text-center md:text-left">
              <span className="text-xs bg-[#ffe5e5] text-[#af101a] px-3 py-1 rounded-full font-bold">Portal do Empreendimento</span>
              <h4 className="text-2xl font-bold font-display text-[#101c29]">Tudo o que seu condomínio precisa</h4>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Emita 2ª via de boleto, reserve áreas de lazer, registre ocorrências na gestão e consulte contas online em segundos.
              </p>
              
              <div className="bg-white/60 p-4 rounded-xl border border-[#cfdbec] space-y-3">
                <p className="text-[10px] uppercase font-bold text-gray-500">Testar Demonstrativo Grátis</p>
                <div className="flex flex-col gap-2">
                  <button
                    id="login-quick-morador"
                    onClick={() => handleDemoLogin('morador')}
                    className="w-full bg-[#af101a] hover:bg-primary-hover text-white py-2 text-xs font-bold rounded-lg transition-transform active:scale-95"
                  >
                    Entrar como Morador (Exemplo)
                  </button>
                  <button
                    id="login-quick-sindico"
                    onClick={() => handleDemoLogin('sindico')}
                    className="w-full bg-[#101c29] hover:bg-slate-800 text-white py-2 text-xs font-bold rounded-lg transition-transform active:scale-95"
                  >
                    Entrar como Síndico (Exemplo)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Standard Login Form container */}
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl border border-[#cfdbec] shadow-md">
              <form onSubmit={handleCustomLogin} className="space-y-4">
                <h5 className="font-bold text-center text-sm font-display uppercase tracking-wider text-[#101c29]">Acesso Certificado</h5>
                
                <div className="space-y-1">
                  <label htmlFor="portal-cpf-input" className="text-[10px] font-bold text-secondary uppercase block">CPF do Beneficiário</label>
                  <input
                    id="portal-cpf-input"
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-gray-50 border border-gray-200 outline-none focus:border-primary p-3 rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="portal-pass-input" className="text-[10px] font-bold text-secondary uppercase block">Senha de Acesso</label>
                  <input
                    id="portal-pass-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 outline-none focus:border-primary p-3 rounded-lg text-sm"
                  />
                </div>

                <button
                  id="portal-form-submit"
                  type="submit"
                  className="w-full bg-[#af101a] hover:bg-primary-hover text-white py-3 rounded-lg font-bold transition-all text-xs cursor-pointer"
                >
                  Entrar no Condomínio
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Portal Dashboard Active Logged State */
          <div id="portal-dashboard-screen" className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
            
            {/* Left panel menu bar on desktop, Horizontal scroll tag on mobile */}
            <div className="w-full md:w-56 bg-white border-r border-[#cfdbec] p-4 flex flex-row md:flex-col justify-between shrink-0 overflow-x-auto md:overflow-x-visible">
              
              {/* Profile Card details */}
              <div className="hidden md:block p-4 border-b border-gray-100 space-y-2 pb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-display text-sm">
                  {username.charAt(0)}
                </div>
                <div>
                  <h6 className="font-sans font-bold text-sm text-[#101c29] truncate">{username}</h6>
                  <p className="text-xs text-secondary">{apartmentCode}</p>
                </div>
                <div className="text-[9px] uppercase font-bold text-success bg-green-50 p-1.5 rounded inline-block">
                  ● Conexão Online
                </div>
              </div>

              {/* Functional tabs navigation */}
              <div id="portal-menu-tabs" className="flex flex-row md:flex-col gap-2 py-4 flex-1 w-full shrink-0">
                <button
                  id="portal-tab-financeiro"
                  onClick={() => setActiveTab('financeiro')}
                  className={`px-4 py-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 truncate whitespace-nowrap ${
                    activeTab === 'financeiro' ? 'bg-[#af101a] text-white' : 'text-[#5f5e5e] hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Meus Boletos
                </button>

                <button
                  id="portal-tab-reservas"
                  onClick={() => setActiveTab('reservas')}
                  className={`px-4 py-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 truncate whitespace-nowrap ${
                    activeTab === 'reservas' ? 'bg-[#af101a] text-white' : 'text-[#5f5e5e] hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Reservas de Lazer
                </button>

                <button
                  id="portal-tab-ocorrencias"
                  onClick={() => setActiveTab('ocorrencias')}
                  className={`px-4 py-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 truncate whitespace-nowrap ${
                    activeTab === 'ocorrencias' ? 'bg-[#af101a] text-white' : 'text-[#5f5e5e] hover:bg-gray-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Registrar Ocorrências
                </button>

                <button
                  id="portal-tab-atas"
                  onClick={() => setActiveTab('atas')}
                  className={`px-4 py-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 truncate whitespace-nowrap ${
                    activeTab === 'atas' ? 'bg-[#af101a] text-white' : 'text-[#5f5e5e] hover:bg-gray-100'
                  }`}
                >
                  <Vote className="w-4 h-4" />
                  Assembleia & Votos
                </button>

                <button
                  id="portal-tab-balanço"
                  onClick={() => setActiveTab('balanço')}
                  className={`px-4 py-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 truncate whitespace-nowrap ${
                    activeTab === 'balanço' ? 'bg-[#af101a] text-white' : 'text-[#5f5e5e] hover:bg-gray-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Contas do Condomínio
                </button>
              </div>

              {/* Logout mechanism button */}
              <button
                id="portal-logout-btn"
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 text-xs font-bold text-[#af101a] p-3 rounded-lg hover:bg-red-50 mt-auto cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Desconectar Conta
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div id="portal-tab-content" className="flex-1 p-6 md:p-8 overflow-y-auto">
              
              {/* TAB 1: FINANCEIRO / BOLETOS */}
              {activeTab === 'financeiro' && (
                <div id="portal-financeiro-panel" className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border-light shadow-sm">
                    <div>
                      <h4 className="text-base font-bold text-on-surface">Seu Faturamento Geral</h4>
                      <p className="text-xs text-secondary leading-none mt-1">Status de quotas condominiais em curso</p>
                    </div>
                    <span className="text-xs bg-surface-container font-semibold px-3 py-1.5 rounded-lg text-[#af101a]">
                      3 Boletos Mapeados
                    </span>
                  </div>

                  <div className="space-y-3">
                    {boletos.map((bol) => (
                      <div
                        key={bol.id}
                        id={`boleto-item-${bol.id}`}
                        className="bg-white p-5 rounded-2xl border border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-300 transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            bol.status === 'Pago' ? 'bg-green-50 text-success' : 'bg-red-50 text-red-500'
                          }`}>
                            <CreditCard className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase inline-block">{bol.id}</span>
                            <h5 className="font-sans font-bold text-sm text-[#101c29] leading-tight">Cota Condominial Ordinária - {bol.referencia}</h5>
                            <p className="text-xs text-secondary">Vencimento em: <strong className="font-semibold text-on-surface">{bol.vencimento}</strong></p>
                          </div>
                        </div>

                        {/* Middle pricing with status */}
                        <div className="flex md:flex-col items-baseline md:items-end gap-2 shrink-0">
                          <span className="text-sm font-sans font-bold text-[#101c29]">R$ {bol.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className={`text-[10px] uppercase font-bold text-center px-2 py-0.5 rounded ${
                            bol.status === 'Pago' ? 'bg-green-150 text-success' : 'bg-red-100 text-red-600'
                          }`}>
                            {bol.status}
                          </span>
                        </div>

                        {/* Interactive simulation and copy actions */}
                        <div className="flex gap-2 w-full md:w-auto pt-2 md:pt-0 border-t border-gray-100 md:border-0">
                          {bol.status === 'Pendente' ? (
                            <>
                              <button
                                id={`boleto-btn-pay-${bol.id}`}
                                onClick={() => handleSimulatePayment(bol.id)}
                                className="flex-1 md:flex-none text-xs font-bold bg-[#fafafa] border border-gray-250 text-on-surface hover:bg-gray-150 py-2.5 px-4 rounded-xl active:scale-95 transition-all cursor-pointer"
                              >
                                Pagar com Pix (Simulado)
                              </button>
                              <button
                                id={`boleto-btn-bar-${bol.id}`}
                                onClick={() => setBarCodeModal(bol)}
                                className="flex-1 md:flex-none text-xs font-bold bg-primary text-on-primary hover:bg-primary-hover py-2.5 px-4 rounded-xl active:scale-95 transition-all cursor-pointer"
                              >
                                Código de Barras
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-green-500 font-bold flex items-center gap-1.5 py-2 px-3 bg-green-50/50 rounded-xl border border-green-100 w-full md:w-auto justify-center text-center">
                              ✓ Pago e Liquidado em Conta
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: RESERVA DE ÁREAS */}
              {activeTab === 'reservas' && (
                <div id="portal-reservas-panel" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Add Booking Form card */}
                    <div className="bg-white p-6 rounded-2xl border border-border-light shadow-sm space-y-4">
                      <h4 className="text-sm font-bold font-display text-on-surface">Agendar Nova Reserva</h4>
                      <form onSubmit={handleAddBooking} className="space-y-4">
                        <div className="space-y-1">
                          <label htmlFor="reserva-area-sel" className="text-[10px] font-bold text-secondary uppercase block">Selecione Área de Lazer</label>
                          <select
                            id="reserva-area-sel"
                            value={newBookingArea}
                            onChange={(e) => setNewBookingArea(e.target.value)}
                            className="w-full bg-[#F1F4F8] p-3 text-sm rounded-lg outline-none"
                          >
                            <option value="Salão de Festas Master">Salão de Festas Master (Bloco B)</option>
                            <option value="Churrasqueira Superior">Churrasqueira Gourmet (Cobertura)</option>
                            <option value="Quadra Esportiva Sintética">Quadra Esportiva Sintética</option>
                            <option value="Espaço Kids / Brinquedoteca">Espaço Kids / Brinquedoteca</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label htmlFor="reserva-date-inp" className="text-[10px] font-bold text-secondary uppercase block">Escolha Data</label>
                            <input
                              id="reserva-date-inp"
                              type="date"
                              onChange={(e) => setNewBookingDate(e.target.value)}
                              className="w-full bg-[#F1F4F8] p-3 text-xs rounded-lg outline-none"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="reserva-period-sel" className="text-[10px] font-bold text-secondary uppercase block">Período Desejado</label>
                            <select
                              id="reserva-period-sel"
                              value={newBookingPeriod}
                              onChange={(e) => setNewBookingPeriod(e.target.value as any)}
                              className="w-full bg-[#F1F4F8] p-3 text-xs rounded-lg outline-none"
                            >
                              <option value="Manhã">Manhã (08h às 12h)</option>
                              <option value="Tarde">Tarde (13h às 17h)</option>
                              <option value="Noite">Noite (18h às 22h)</option>
                              <option value="Integral">Integral (09h às 22h)</option>
                            </select>
                          </div>
                        </div>

                        <button
                          id="reserva-submit-btn"
                          type="submit"
                          className="w-full bg-primary hover:bg-primary-hover text-on-primary font-bold py-3 text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
                        >
                          Confirmar Minha Reserva
                        </button>
                      </form>
                    </div>

                    {/* Active bookings list card */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold font-display text-on-surface">Minhas Reservas Ativas</h4>
                      {bookings.length === 0 ? (
                        <div id="booking-empty-box" className="p-10 border-2 border-dashed border-gray-200 text-center rounded-2xl">
                          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-secondary">Nenhum evento ou área reservada por você.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {bookings.map((bkg) => (
                            <div
                              key={bkg.id}
                              id={`booking-card-${bkg.id}`}
                              className="bg-white p-4 rounded-xl border border-gray-150 flex justify-between items-center shadow-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <p className="font-sans font-bold text-xs text-on-surface">{bkg.area}</p>
                                  <p className="text-[10px] text-secondary mt-0.5">
                                    Agendado: <strong className="font-semibold text-on-surface">{bkg.data}</strong> ({bkg.periodo})
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] uppercase font-bold text-success bg-green-50 px-2 py-0.5 rounded">
                                {bkg.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OCORRÊNCIAS / CHAMADOS */}
              {activeTab === 'ocorrencias' && (
                <div id="portal-ocorrencias-panel" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Add incident form */}
                    <div className="bg-white p-6 rounded-2xl border border-border-light shadow-sm space-y-4">
                      <h4 className="text-sm font-bold font-display text-on-surface">Registrar Nova Ocorrência</h4>
                      <form onSubmit={handleAddTicket} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label htmlFor="ocorrencia-titulo-inp" className="text-[10px] font-bold text-secondary uppercase block">Título do Assunto *</label>
                            <input
                              id="ocorrencia-titulo-inp"
                              type="text"
                              required
                              value={newTicketTitle}
                              onChange={(e) => setNewTicketTitle(e.target.value)}
                              placeholder="Ex: Elevador social travado"
                              className="w-full bg-[#F1F4F8] p-3 text-xs rounded-lg outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="ocorrencia-cat-sel" className="text-[10px] font-bold text-secondary uppercase block">Categoria</label>
                            <select
                              id="ocorrencia-cat-sel"
                              value={newTicketCategory}
                              onChange={(e) => setNewTicketCategory(e.target.value as any)}
                              className="w-full bg-[#F1F4F8] p-3 text-xs rounded-lg outline-none"
                            >
                              <option value="Manutenção">Manutenção Geral</option>
                              <option value="Limpeza">Limpeza de Áreas</option>
                              <option value="Barulho">Barulho e Clima</option>
                              <option value="Financeiro">Financeiro / Taxas</option>
                              <option value="Outros">Outras Demandas</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="ocorrencia-desc-txa" className="text-[10px] font-bold text-secondary uppercase block">Descrição Detalhada *</label>
                          <textarea
                            id="ocorrencia-desc-txa"
                            value={newTicketDesc}
                            onChange={(e) => setNewTicketDesc(e.target.value)}
                            placeholder="Descreva o local e detalhes para que a gerência tome providência."
                            rows={3}
                            className="w-full bg-[#F1F4F8] p-3 text-xs rounded-lg outline-none resize-none"
                            required
                          />
                        </div>

                        <button
                          id="ocorrencia-submit-btn"
                          type="submit"
                          className="w-full bg-[#af101a] hover:bg-primary-hover text-on-primary font-bold py-3 text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
                        >
                          Protocolar Ocorrência
                        </button>
                      </form>
                    </div>

                    {/* Active tickets listings */}
                    <div className="space-y-4 text-left">
                      <h4 className="text-sm font-bold font-display text-on-surface">Meus Protocolos Abertos</h4>
                      <div className="space-y-3">
                        {ocorrencias.map((tkt) => (
                          <div
                            key={tkt.id}
                            id={`ticket-card-${tkt.id}`}
                            className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-[9px] uppercase font-bold text-primary bg-red-50 px-2 py-0.5 rounded">
                                {tkt.categoria}
                              </span>
                              <span className="text-[9px] font-sans font-semibold text-gray-400">{tkt.dataCriacao}</span>
                            </div>
                            <h5 className="font-sans font-bold text-xs text-on-surface mt-2">{tkt.titulo}</h5>
                            <p className="text-[11px] text-secondary mt-1">{tkt.descricao}</p>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                              <span className="text-[10px] text-gray-400 font-semibold uppercase">{tkt.id}</span>
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                {tkt.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ASSEMBLEIAS & ATAS */}
              {activeTab === 'atas' && (
                <div id="portal-atas-panel" className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border-light shadow-sm">
                    <div>
                      <h4 className="text-base font-bold text-on-surface">Deliberações Ativas Eletrônicas</h4>
                      <p className="text-xs text-secondary leading-none mt-1">Sua voz amparada juridicamente no app</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {assemblies.map((asm) => (
                      <div
                        key={asm.id}
                        id={`assembly-card-${asm.id}`}
                        className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4"
                      >
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{asm.id}</span>
                            <h5 className="font-sans font-bold text-[#101c29] text-sm">{asm.titulo}</h5>
                          </div>
                          <span className={`text-[9px] font-semibold uppercase px-2 py-1 rounded ${
                            asm.votacaoAtiva ? 'bg-primary text-on-primary animate-pulse' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {asm.votacaoAtiva ? 'Votação Aberta' : 'Concluído'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-primary">Pauta Técnica:</p>
                          <p className="text-xs text-secondary leading-relaxed font-sans">{asm.pauta}</p>
                        </div>

                        {/* Interactive poll representation */}
                        {asm.votacaoAtiva ? (
                          <div className="bg-background p-4 rounded-xl border border-[#cfdbec] space-y-4">
                            <p className="text-xs font-bold text-on-surface flex items-center gap-1.5 leading-snug">
                              <Info className="w-4 h-4 text-primary shrink-0" />
                              {asm.perguntaVotacao}
                            </p>

                            {!asm.votoUsuario ? (
                              <div className="flex gap-2">
                                <button
                                  id={`vote-btn-sim-${asm.id}`}
                                  onClick={() => handleVote(asm.id, 'Favor')}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-lg mr-2 leading-none cursor-pointer"
                                >
                                  SIM (Aprovo)
                                </button>
                                <button
                                  id={`vote-btn-nao-${asm.id}`}
                                  onClick={() => handleVote(asm.id, 'Contra')}
                                  className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 rounded-lg leading-none cursor-pointer"
                                >
                                  NÃO (Rejeito)
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-xs text-success font-bold">✓ Seu voto foi registrado como: "{asm.votoUsuario?.toUpperCase()}"</p>
                                
                                <div className="space-y-1.5 pt-2">
                                  <div className="flex justify-between text-[10px] font-bold text-secondary">
                                    <span>A favor: {asm.votosFavor} votos</span>
                                    <span>Rejeitados: {asm.votosContra} votos</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                                    <div
                                      style={{ width: `${((asm.votosFavor || 0) / ((asm.votosFavor || 0) + (asm.votosContra || 0) || 1)) * 100}%` }}
                                      className="bg-green-500 h-full"
                                    ></div>
                                    <div
                                      style={{ width: `${((asm.votosContra || 0) / ((asm.votosFavor || 0) + (asm.votosContra || 0) || 1)) * 100}%` }}
                                      className="bg-red-500 h-full"
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-xl text-xs text-secondary flex items-center justify-between font-semibold">
                            <span>✓ Deliberação encerrada. Ata arquivada por unanimidade.</span>
                            <button className="text-primary hover:underline underline-offset-2 hover:text-primary-hover">Baixar PDF</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: PRESTAÇÃO DE CONTAS / DYNAMIC CHARTS */}
              {activeTab === 'balanço' && (
                <div id="portal-balanço-panel" className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border-light shadow-sm">
                    <div>
                      <h4 className="text-base font-bold text-on-surface font-display">Balanço do Condomínio</h4>
                      <p className="text-xs text-secondary leading-none mt-1">Rateio transparente de receitas e despesas</p>
                    </div>
                  </div>

                  {/* Balanced values card summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Total Receitas</p>
                      <h5 className="text-xl font-bold text-green-600 font-display mt-0.5">R$ 54.890,00</h5>
                      <span className="text-[10px] text-success">✓ 97% das cotas recebidas em dia</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Total Despesas</p>
                      <h5 className="text-xl font-bold text-[#af101a] font-display mt-0.5">R$ 48.102,40</h5>
                      <span className="text-[10px] text-secondary">Manutenção de elevadores e pessoal inclusos</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm text-left col-span-1 md:col-span-2 lg:col-span-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Fundo De Reserva</p>
                      <h5 className="text-xl font-bold text-[#101c29] font-display mt-0.5">R$ 342.900,00</h5>
                      <span className="text-[10px] text-gray-400">Garantia para reformas extraordinárias</span>
                    </div>
                  </div>

                  {/* Transparent custom bar charts */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <h5 className="text-sm font-bold text-on-surface font-display border-b border-gray-100 pb-3">Divisão das Despesas Operacionais - Mês Atual</h5>
                    
                    <div className="space-y-4">
                      {/* Pessoal */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-secondary">
                          <span>Folha de Pessoal & Zeladoria (35%)</span>
                          <span>R$ 16.835,84</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '35%' }}></div>
                        </div>
                      </div>

                      {/* Concessionarias */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-secondary">
                          <span>Água, Luz e Gás do Prédio (28%)</span>
                          <span>R$ 13.468,67</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-[#101c29] h-full rounded-full" style={{ width: '28%' }}></div>
                        </div>
                      </div>

                      {/* Conservacao */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-secondary">
                          <span>Manutenção Contratual Elevadores & Bomba (15%)</span>
                          <span>R$ 7.215,36</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: '15%' }}></div>
                        </div>
                      </div>

                      {/* Administracao */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-secondary">
                          <span>Honorários de Administração & Seguros (12%)</span>
                          <span>R$ 5.772,28</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: '12%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Bar Code modal simulation */}
        {barCodeModal && (
          <div id="barcode-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div id="barcode-modal" className="bg-white rounded-2xl p-6 max-w-md w-full border border-border-light shadow-2xl relative">
              <button
                id="barcode-close"
                onClick={() => setBarCodeModal(null)}
                className="absolute top-4 right-4 text-secondary hover:text-black font-semibold text-sm"
              >
                &times; Fechar
              </button>
              
              <div className="space-y-4 text-center pt-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-on-surface font-display leading-tight">Liquidação Ordinária</h5>
                <p className="text-xs text-secondary">Copie o código abaixo no seu banco para pagamento do Condomínio {barCodeModal.referencia}.</p>
                
                {/* Visual simulate barcode ticks */}
                <div className="bg-gray-100 p-3 rounded font-mono text-[9px] select-all break-all border border-gray-200">
                  {barCodeModal.codigoBarras}
                </div>

                <div className="flex gap-2">
                  <button
                    id="barcode-btn-copy"
                    onClick={() => handleCopyBarcode(barCodeModal.id)}
                    className="flex-1 bg-gray-50 border border-gray-250 hover:bg-gray-150 p-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar Código
                  </button>
                  <button
                    id="barcode-btn-pay"
                    onClick={() => handleSimulatePayment(barCodeModal.id)}
                    className="flex-1 bg-success hover:bg-green-700 text-white p-2 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Simular Liquidação Pix
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
