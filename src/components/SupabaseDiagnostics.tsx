import { useState, useEffect } from 'react';
import { 
  Database, 
  Code, 
  Copy, 
  Check, 
  Trash2, 
  Terminal, 
  ExternalLink, 
  FileText, 
  RefreshCw, 
  Sparkles, 
  X,
  Play,
  Mail,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { supabase, isSupabaseConfigured, getSimulatedData, SQL_SETUP_SCRIPT } from '../lib/supabaseClient';
import { ContactMessage, QuoteRequest, Booking, Ticket } from '../types';

interface SupabaseDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
  onShowMessage: (headline: string, text: string) => void;
}

export default function SupabaseDiagnostics({ isOpen, onClose, onShowMessage }: SupabaseDiagnosticsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'messages' | 'quotes' | 'portal'>('status');
  const [copied, setCopied] = useState(false);
  
  // Real or simulated states
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllStats = async () => {
    setIsLoading(true);
    try {
      // 1. If supabase is configured, fetch real records
      if (isSupabaseConfigured && supabase) {
        const { data: dbMsgs } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        const { data: dbQuotes } = await supabase.from('quote_requests').select('*').order('created_at', { ascending: false });
        const { data: dbBkgs } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        const { data: dbTkts } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });

        if (dbMsgs) {
          setMessages(dbMsgs.map((m: any) => ({
            nome: m.nome,
            email: m.email,
            telefone: m.telefone || '',
            mensagem: m.mensagem || '',
            data: m.data || new Date(m.created_at).toLocaleDateString('pt-BR')
          })));
        } else {
          setMessages([]);
        }

        if (dbQuotes) {
          setQuotes(dbQuotes.map((q: any) => ({
            id: q.id,
            condominioNome: q.condominio_nome,
            endereco: q.endereco || '',
            unidades: q.unidades || 0,
            contatoNome: q.contato_nome,
            contatoEmail: q.contato_email,
            contatoTelefone: q.contato_telefone || '',
            cargo: q.cargo as any
          })));
        } else {
          setQuotes([]);
        }

        if (dbBkgs) {
          setBookings(dbBkgs.map((b: any) => ({
            id: b.id,
            area: b.area,
            data: b.data,
            periodo: b.periodo as any,
            status: b.status as any
          })));
        } else {
          setBookings([]);
        }

        if (dbTkts) {
          setTickets(dbTkts.map((t: any) => ({
            id: t.id,
            categoria: t.categoria as any,
            titulo: t.titulo,
            descricao: t.descricao || '',
            dataCriacao: t.data_criacao,
            status: t.status as any
          })));
        } else {
          setTickets([]);
        }
      } else {
        // Fallback to local simulation storage
        setMessages(getSimulatedData<ContactMessage>('contact_messages'));
        setQuotes(getSimulatedData<QuoteRequest>('quote_requests'));
        setBookings(getSimulatedData<Booking>('bookings'));
        setTickets(getSimulatedData<Ticket>('tickets'));
      }
    } catch (err) {
      console.warn('Diagnostics fetch failed:', err);
      // fallback
      setMessages(getSimulatedData<ContactMessage>('contact_messages'));
      setQuotes(getSimulatedData<QuoteRequest>('quote_requests'));
      setBookings(getSimulatedData<Booking>('bookings'));
      setTickets(getSimulatedData<Ticket>('tickets'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllStats();
    }
  }, [isOpen]);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setCopied(true);
    onShowMessage('Copiado!', 'Script SQL copiado com sucesso. Cole no seu painel Supabase.');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClearSimulation = () => {
    if (confirm('Deseja limpar todos os dados simulados gravados localmente nesta sessão?')) {
      localStorage.removeItem('supabase_sim_contact_messages');
      localStorage.removeItem('supabase_sim_quote_requests');
      localStorage.removeItem('supabase_sim_bookings');
      localStorage.removeItem('supabase_sim_tickets');
      fetchAllStats();
      onShowMessage('Simuladores Limpados!', 'Todo o histórico de caches locais foi reiniciado.');
    }
  };

  if (!isOpen) return null;

  return (
    <div id="supa-diag-overlay" className="fixed inset-0 bg-[#070b12]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div id="supa-diag-card" className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] border border-[#cfdbec] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Active Header panel */}
        <div className="bg-[#101c29] p-6 text-white flex justify-between items-center border-b border-white/5">
          <div className="flex gap-3 items-center">
            <div className="bg-[#3ecf8e]/15 p-2.5 rounded-xl text-[#3ecf8e] border border-[#3ecf8e]/30">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold font-display text-base uppercase tracking-wider flex items-center gap-2">
                Conexão Supabase <span className="text-[10px] bg-[#3ecf8e] text-[#101c29] px-2 py-0.5 rounded font-bold font-mono">DASHBOARD</span>
              </h3>
              <p className="text-xs text-gray-400">Verifique status, sincronize dados e emita comandos SQL</p>
            </div>
          </div>
          <button 
            id="supa-diag-close" 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Line badge */}
        <div className="bg-[#182a3d] px-6 py-3 flex flex-wrap justify-between items-center text-xs text-white border-b border-white/5 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Status da Chave:</span>
            {isSupabaseConfigured ? (
              <span className="bg-green-500/10 text-green-400 px-2.5 py-1 rounded inline-flex items-center gap-1.5 border border-green-500/20 font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                CONECTADO AO SUPABASE REAL
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded inline-flex items-center gap-1.5 border border-amber-500/20 font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                MODO SIMULAÇÃO LOCAL ATIVO
              </span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <button
              onClick={fetchAllStats}
              disabled={isLoading}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar Agora
            </button>
            <button
              onClick={handleClearSimulation}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded border border-red-500/20 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Limpar Simulações
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-150 bg-gray-50 px-6 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveSubTab('status')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors ${
              activeSubTab === 'status' ? 'border-[#3ecf8e] text-[#101c29] font-bold' : 'border-transparent text-secondary hover:text-[#101c29]'
            }`}
          >
            1. Guia de Configuração & SQL
          </button>
          <button
            onClick={() => setActiveSubTab('messages')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'messages' ? 'border-[#3ecf8e] text-[#101c29] font-bold' : 'border-transparent text-secondary hover:text-[#101c29]'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-gray-500" />
            Contatos ({messages.length})
          </button>
          <button
            onClick={() => setActiveSubTab('quotes')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'quotes' ? 'border-[#3ecf8e] text-[#101c29] font-bold' : 'border-transparent text-secondary hover:text-[#101c29]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            Orçamentos ({quotes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('portal')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'portal' ? 'border-[#3ecf8e] text-[#101c29] font-bold' : 'border-transparent text-secondary hover:text-[#101c29]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            Atividades Portal ({bookings.length + tickets.length})
          </button>
        </div>

        {/* Tab Body Contents scroll */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fafbfe]">
          
          {/* TAB 1: HOW TO CONFIGURE & SQL SCRIPT */}
          {activeSubTab === 'status' && (
            <div className="space-y-6">
              
              {/* Instructions banner */}
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex gap-3 text-sm text-blue-900 leading-relaxed text-left">
                <Terminal className="w-5 h-5 mt-0.5 text-blue-600 shrink-0" />
                <div>
                  <h6 className="font-bold">Como Conectar seu Supabase definitivo:</h6>
                  <p className="text-xs text-blue-800 mt-1">
                    Para trocar o simulador offline pelo seu banco de dados Supabase em nuvem, acesse o painel <strong>Secrets (Configurações)</strong> do AI Studio e adicione as seguintes variáveis de ambiente:
                  </p>
                  <ol className="list-decimal text-xs ml-4 mt-2 space-y-1 font-mono text-gray-700 bg-white/60 p-3 rounded-lg border border-blue-100">
                    <li><strong>VITE_SUPABASE_URL</strong> = Sua URL da API do projeto no Supabase</li>
                    <li><strong>VITE_SUPABASE_ANON_KEY</strong> = Sua chave anônima (anon public key)</li>
                  </ol>
                  <p className="text-xs text-blue-800 mt-2">
                    O applet detecta a presença destas credenciais e se sincroniza dinamicamente em tempo real!
                  </p>
                </div>
              </div>

              {/* SQL script component */}
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#101c29] uppercase flex items-center gap-1">
                    <Code className="w-4 h-4 text-primary" /> Script SQL das Tabelas
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="bg-[#3ecf8e] hover:bg-[#32b078] text-[#111] font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer select-none"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar SQL de Tabelas'}
                  </button>
                </div>

                <div className="relative">
                  <pre className="bg-[#0f172a] text-[#38bdf8] p-5 rounded-2xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                    {SQL_SETUP_SCRIPT}
                  </pre>
                  <p className="text-[10px] text-gray-500 mt-1.5 italic">
                    * Esse script cria as tabelas "contact_messages", "quote_requests", "bookings" e "tickets" e desliga o sandbox (RLS) para permitir inserções vindas diretamente do site.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTS LIST */}
          {activeSubTab === 'messages' && (
            <div className="space-y-4 text-left">
              <h5 className="font-bold text-sm text-[#101c29]">Registros na tabela: <code className="bg-gray-100 text-[#af101a] font-mono px-2 py-0.5 rounded text-xs pb-1">contact_messages</code></h5>
              {messages.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
                  <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-secondary">Nenhuma mensagem enviada até o momento.</p>
                  <p className="text-xs text-gray-400 mt-1">Preencha o formulário de Contato no site para registrar o primeiro lead!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m, idx) => (
                    <div key={idx} className="bg-white border border-[#cfdbec] p-5 rounded-2xl shadow-sm text-sm hover:border-primary/40 transition-colors">
                      <div className="flex justify-between items-start flex-wrap gap-2 border-b border-gray-100 pb-2 mb-3">
                        <div>
                          <h6 className="font-bold text-[#101c29] text-base">{m.nome}</h6>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">E-mail: <span className="font-semibold text-secondary">{m.email}</span> | Tel: <span className="font-semibold text-secondary">{m.telefone}</span></p>
                        </div>
                        <span className="text-xs font-semibold text-primary">{m.data}</span>
                      </div>
                      <p className="text-secondary whitespace-pre-line text-xs leading-relaxed font-sans mt-2 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                        {m.mensagem}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUOTES LIST */}
          {activeSubTab === 'quotes' && (
            <div className="space-y-4 text-left">
              <h5 className="font-bold text-sm text-[#101c29]">Registros na tabela: <code className="bg-gray-100 text-[#af101a] font-mono px-2 py-0.5 rounded text-xs pb-1">quote_requests</code></h5>
              {quotes.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-secondary">Sua caixa de propostas e viabilidades está vazia.</p>
                  <p className="text-xs text-gray-400 mt-1">Clique em "Solicitar Proposta" no site para gerar o primeiro cálculo automático!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quotes.map((q, idx) => (
                    <div key={idx} className="bg-white border border-[#cfdbec] p-5 rounded-2xl shadow-sm hover:border-primary/40 transition-colors">
                      <div className="flex justify-between items-start flex-wrap gap-2 border-b border-gray-100 pb-2 mb-3">
                        <div>
                          <span className="text-[10px] text-primary uppercase font-mono font-bold">{q.id}</span>
                          <h6 className="font-extrabold text-[#101c29] text-base leading-none mt-1">{q.condominioNome}</h6>
                          <p className="text-xs text-gray-400 mt-1">Endereço: <span className="font-semibold text-secondary">{q.endereco || 'Não informado'}</span></p>
                        </div>
                        <span className="text-xs bg-[#ffe5e5] text-[#af101a] font-bold px-3 py-1 rounded-full">{q.unidades} Unidades</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400">Solicitante:</p>
                          <p className="font-semibold text-[#101c29]">{q.contatoNome} ({q.cargo})</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Contatos:</p>
                          <p className="font-semibold text-[#101c29]">{q.contatoEmail} / {q.contatoTelefone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PORTAL ACTIVITIES (BOOKINGS & TICKETS) */}
          {activeSubTab === 'portal' && (
            <div className="space-y-6 text-left">
              
              {/* Bookings sub section */}
              <div className="space-y-3">
                <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-2">
                  <span className="w-2 h-2 rounded-full bg-[#3ecf8e]"></span>
                  Reservas de Lazer (<code className="font-mono text-[#af101a] lowercase">bookings</code>)
                </h5>
                {bookings.length === 0 ? (
                  <p className="text-xs text-secondary italic p-4 bg-white border border-gray-150 rounded-xl">Sem reservas cadastradas neste canal.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bookings.map((b, idx) => (
                      <div key={idx} className="bg-white border border-[#cfdbec] p-4 rounded-xl flex justify-between items-center shadow-xs">
                        <div>
                          <p className="font-bold text-xs text-[#101c29]">{b.area}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Agendado: <strong>{b.data}</strong> ({b.periodo})</p>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-success bg-green-50 px-2 py-0.5 rounded border border-green-100">{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tickets sub section */}
              <div className="space-y-3">
                <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Chamados & Ocorrências (<code className="font-mono text-[#af101a] lowercase">tickets</code>)
                </h5>
                {tickets.length === 0 ? (
                  <p className="text-xs text-secondary italic p-4 bg-white border border-gray-150 rounded-xl">Sem chamados cadastrados até o momento.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tickets.map((t, idx) => (
                      <div key={idx} className="bg-white border border-[#cfdbec] p-4 rounded-xl space-y-2 relative">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="bg-red-50 text-[#af101a] px-2 py-0.5 rounded select-none">{t.categoria}</span>
                          <span className="text-gray-400">{t.dataCriacao}</span>
                        </div>
                        <h6 className="font-bold text-xs text-[#101c29] leading-snug">{t.titulo}</h6>
                        <p className="text-[11px] text-secondary leading-normal">{t.descricao}</p>
                        <div className="flex justify-between items-center text-[9px] pt-2 border-t border-gray-100">
                          <span className="font-mono font-bold text-gray-300">{t.id}</span>
                          <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-bold uppercase">{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal footer credits */}
        <div className="bg-gray-50 border-t border-gray-150 px-6 py-4 flex justify-between items-center text-[10px] text-gray-400 shrink-0 select-none">
          <span>Facilities Construtor Integrado - Supabase v12</span>
          <span>Sincronização Ativa em Produção</span>
        </div>

      </div>
    </div>
  );
}
