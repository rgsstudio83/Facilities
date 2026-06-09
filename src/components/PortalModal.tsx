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
  Inbox,
  Compass,
  Building2,
  Users,
  Wallet,
  Key,
  Activity,
  ShieldAlert,
  Trash2,
  Edit2,
  Plus
} from 'lucide-react';
import { Boleto, Booking, Assembly, Ticket } from '../types';
import { supabase, isSupabaseConfigured, saveSimulatedData, getSimulatedData } from '../lib/supabaseClient';
import { usePortalRouter } from './PortalRouter';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification: (headline: string, text: string) => void;
  onLoginSuccess?: (username: string, profile: string, unit: string) => void;
}

export default function PortalModal({ isOpen, onClose, onShowNotification, onLoginSuccess }: PortalModalProps) {
  const router = usePortalRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('Roberto Silva');
  const [apartmentCode, setApartmentCode] = useState('Apto 41-B');
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<string>('financeiro');

  // Inline Supabase configurations
  const [inlineUrl, setInlineUrl] = useState(() => localStorage.getItem('VITE_SUPABASE_URL') || '');
  const [inlineKey, setInlineKey] = useState(() => localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '');
  const [showInlineSetup, setShowInlineSetup] = useState(false);

  // Registration & profile states
  const [formTab, setFormTab] = useState<'login' | 'register' | 'esqueci-senha' | 'alterar-senha'>('login');
  const [profileType, setProfileType] = useState<string>('Morador');
  const [quickRole, setQuickRole] = useState<string>('Morador');
  const [regName, setRegName] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUnit, setRegUnit] = useState('Apto Geral');
  const [loading, setLoading] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Sync state tab mode based on active router location hash
  useEffect(() => {
    const cleanHash = router.currentRoute.replace('#', '');
    if (cleanHash === 'login') {
      setFormTab('login');
    } else if (cleanHash === 'register') {
      setFormTab('register');
    } else if (cleanHash === 'esqueci-senha') {
      setFormTab('esqueci-senha');
    } else if (cleanHash === 'alterar-senha') {
      setFormTab('alterar-senha');
    }
  }, [router.currentRoute]);

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setLoading(true);
    try {
      await router.resetPassword(recoveryEmail);
      setFormTab('login');
      window.location.hash = '#login';
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPasswordValue) return;
    setLoading(true);
    try {
      await router.updatePassword(newPasswordValue);
      setFormTab('login');
      window.location.hash = '#login';
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const [usersDb, setUsersDb] = useState<{cpf: string, email: string, pass: string, name: string, unit: string, profile: string}[]>(() => {
    const saved = localStorage.getItem('facilities_portal_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { cpf: '123', email: 'contato@facilities.com.br', pass: '123', name: 'Roberto Silva', unit: 'Apto 41-B', profile: 'Morador' },
      { cpf: '456', email: 'admin@facilities.com.br', pass: '456', name: 'Dr. Cristhiane Xavier', unit: 'Sede Administrativa', profile: 'Administrador' },
      { cpf: '789', email: 'colaborador@facilities.com.br', pass: '789', name: 'Lucas Ferreira', unit: 'Supervisor Campo', profile: 'Colaborador' }
    ];
  });

  // --- Administrative and Collaborator States ---
  const [condos, setCondos] = useState<any[]>([]);
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Admin form state variables
  const [selectedCondoId, setSelectedCondoId] = useState<string | null>(null);
  const [newCondoName, setNewCondoName] = useState('');
  const [newCondoCnpj, setNewCondoCnpj] = useState('');
  const [newCondoSindico, setNewCondoSindico] = useState('');
  const [newCondoUnidades, setNewCondoUnidades] = useState(60);

  const [newMoradorNome, setNewMoradorNome] = useState('');
  const [newMoradorCpf, setNewMoradorCpf] = useState('');
  const [newMoradorUnidade, setNewMoradorUnidade] = useState('');
  const [newMoradorCondoId, setNewMoradorCondoId] = useState('cd-1');
  const [newMoradorEmail, setNewMoradorEmail] = useState('');
  const [newMoradorSenha, setNewMoradorSenha] = useState('');
  const [newMoradorRole, setNewMoradorRole] = useState('Morador');

  const [newVisitorNome, setNewVisitorNome] = useState('');
  const [newVisitorRg, setNewVisitorRg] = useState('');
  const [newVisitorUnidade, setNewVisitorUnidade] = useState('');

  const [newPackageDest, setNewPackageDest] = useState('');
  const [newPackageUnidade, setNewPackageUnidade] = useState('');
  const [newPackageDesc, setNewPackageDesc] = useState('');
  const [newPackageTransp, setNewPackageTransp] = useState('');

  // Keep them synced to localStorage
  useEffect(() => {
    localStorage.setItem('facilities_portal_condos', JSON.stringify(condos));
  }, [condos]);
  useEffect(() => {
    localStorage.setItem('facilities_portal_visitantes', JSON.stringify(visitantes));
  }, [visitantes]);
  useEffect(() => {
    localStorage.setItem('facilities_portal_encomendas', JSON.stringify(encomendas));
  }, [encomendas]);
  useEffect(() => {
    localStorage.setItem('facilities_portal_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Handle activeTab setting when profile switches or logs in
  useEffect(() => {
    if (isLoggedIn) {
      const prof = (profileType || '').toLowerCase();
      if (prof === 'porteiro') {
        setActiveTab('admin_portaria');
      } else if (prof.includes('admin')) {
        setActiveTab('admin_dashboard');
      } else if (prof.includes('colab')) {
        setActiveTab('admin_dashboard');
      } else if (prof.includes('sindico') || prof.includes('síndico') || prof.includes('subsindico') || prof.includes('subsíndico')) {
        setActiveTab('admin_dashboard');
      } else if (prof.includes('conselheiro')) {
        setActiveTab('balanço');
      } else {
        setActiveTab('financeiro');
      }
    }
  }, [isLoggedIn, profileType]);

  // Check if this is a preset simulation/demo account, so we can isolate mock statistics from real registered databases
  const isDemoSession = isLoggedIn && (
    username === 'Roberto Silva' || 
    username === 'Dr. Cristhiane Xavier' || 
    username === 'Cristhiane Xavier' || 
    username === 'Lucas Ferreira'
  );

  const getFilteredBoletos = () => {
    if (isLoggedIn && !isDemoSession) {
      return [];
    }
    return boletos;
  };

  const getFilteredBookings = () => {
    if (isLoggedIn && !isDemoSession) {
      return bookings.filter(b => b.id !== 'BKG-098');
    }
    return bookings;
  };

  const getFilteredOcorrencias = () => {
    if (isLoggedIn && !isDemoSession) {
      return ocorrencias.filter(t => t.id !== 'TKT-2900');
    }
    return ocorrencias;
  };

  const getFilteredAssemblies = () => {
    if (isLoggedIn && !isDemoSession) {
      return [];
    }
    return assemblies;
  };

  const getFilteredCondos = () => {
    if (isLoggedIn && !isDemoSession) {
      return condos.filter(c => c.id !== 'cd-1');
    }
    return condos;
  };

  const getFilteredVisitantes = () => {
    if (isLoggedIn && !isDemoSession) {
      return visitantes.filter(v => v.id !== 'v-1' && v.id !== 'v-2');
    }
    return visitantes;
  };

  const getFilteredEncomendas = () => {
    if (isLoggedIn && !isDemoSession) {
      return encomendas.filter(e => e.id !== 'e-1' && e.id !== 'e-2');
    }
    return encomendas;
  };

  const getFilteredAuditLogs = () => {
    if (isLoggedIn && !isDemoSession) {
      return auditLogs.filter(l => l.id !== 'log-1' && l.id !== 'log-2' && l.id !== 'log-3');
    }
    return auditLogs;
  };

  const getFilteredUsersDb = () => {
    if (isLoggedIn && !isDemoSession) {
      return usersDb.filter(u => u.cpf !== '123' && u.cpf !== '456' && u.cpf !== '789');
    }
    return usersDb;
  };

  const addAuditLog = (action: 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'BLOQUEIO' | 'EXPORTAR', entity: string, details: string) => {
    const now = new Date();
    const newLog = {
      id: `log-${Date.now()}`,
      data: now.toLocaleDateString('pt-BR'),
      hora: now.toLocaleTimeString('pt-BR'),
      quem: username || 'Usuário Autenticado',
      perfil: (profileType || 'Morador').toUpperCase(),
      acao: action,
      entidade: entity,
      detalhes: details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Sync users to localStorage whenever the user directory changes
  useEffect(() => {
    localStorage.setItem('facilities_portal_users', JSON.stringify(usersDb));
  }, [usersDb]);

  // Sub-dialogs
  const [barCodeModal, setBarCodeModal] = useState<Boleto | null>(null);

  // In-memory persistent states for demo - set to empty by default
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ticket[]>([]);

  // Form states inside tabs
  const [newBookingArea, setNewBookingArea] = useState('Salão de Festas Master');
  const [newBookingDate, setNewBookingDate] = useState('18/06/2026');
  const [newBookingPeriod, setNewBookingPeriod] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>('Noite');

  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'Manutenção' | 'Limpeza' | 'Barulho' | 'Financeiro' | 'Outros'>('Manutenção');
  const [newTicketDesc, setNewTicketDesc] = useState('');

  // Sincronização inicial com o Supabase - Apenas dados reais do banco de dados
  useEffect(() => {
    if (!isOpen) return;

    const fetchSupabaseData = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setBookings([]);
        setOcorrencias([]);
        setBoletos([]);
        setAssemblies([]);
        setCondos([]);
        setVisitantes([]);
        setEncomendas([]);
        setAuditLogs([]);
        return;
      }

      try {
        // Authenticate automatically if there is an active session on mount
        const { data: authData } = await supabase.auth.getSession();
        if (authData?.session?.user) {
          const user = authData.session.user;
          let actualName = '';
          let actualUnit = '';
          let actualProfile = '';

          try {
            const { data: dbProfile, error: profileErr } = await supabase
              .from('perfis')
              .select('*')
              .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
              .maybeSingle();

            if (dbProfile && !profileErr) {
              actualName = dbProfile.nome || '';
              actualUnit = dbProfile.unidade || '';
              
              const rawTipo = dbProfile.tipo || dbProfile.perfil || 'Morador';
              actualProfile = rawTipo.charAt(0).toUpperCase() + rawTipo.slice(1);
              if (actualProfile === 'Sindico') actualProfile = 'Síndico';
              if (actualProfile === 'Subsindico') actualProfile = 'Subsíndico';
              if (actualProfile === 'Proprietario') actualProfile = 'Proprietário';
            }
          } catch (profileFetchErr) {
            console.error('Error fetching profile from tables:', profileFetchErr);
          }

          const meta = user.user_metadata || {};
          setUsername(actualName || meta.full_name || user.email || 'Usuário Autenticado');
          setApartmentCode(actualUnit || meta.unit || 'Apto 41-B');
          setProfileType(actualProfile || meta.profile || 'Morador');
          setIsLoggedIn(true);
        }

        // 1. Fetch Bookings
        const { data: dbBkgs, error: errBkgs } = await supabase.from('bookings').select('*');
        if (dbBkgs && !errBkgs) {
          setBookings(dbBkgs.map(b => ({
            id: b.id,
            area: b.area,
            data: b.data,
            periodo: b.periodo as any,
            status: b.status as any
          })));
        } else {
          setBookings([]);
        }

        // 2. Fetch Tickets/Ocorrencias
        const { data: dbTkts, error: errTkts } = await supabase.from('tickets').select('*');
        if (dbTkts && !errTkts) {
          setOcorrencias(dbTkts.map(t => ({
            id: t.id,
            categoria: t.categoria as any,
            titulo: t.titulo,
            descricao: t.descricao || '',
            dataCriacao: t.data_criacao,
            status: t.status as any
          })));
        } else {
          setOcorrencias([]);
        }

        // 3. Fetch Boletos
        const { data: dbBoletos, error: errBoletos } = await supabase.from('boletos').select('*');
        if (dbBoletos && !errBoletos) {
          setBoletos(dbBoletos.map(b => ({
            id: b.id,
            referencia: b.referencia,
            vencimento: b.vencimento,
            valor: Number(b.valor || 0),
            status: b.status as any,
            codigoBarras: b.codigo_barras || ''
          })));
        } else {
          setBoletos([]);
        }

        // 4. Fetch Assemblies
        const { data: dbAssemblies, error: errAssemblies } = await supabase.from('assemblies').select('*');
        if (dbAssemblies && !errAssemblies) {
          setAssemblies(dbAssemblies.map(a => ({
            id: a.id,
            titulo: a.titulo,
            data: a.data,
            hora: a.hora,
            pauta: a.pauta,
            votacaoAtiva: a.votacao_ativa ?? true,
            perguntaVotacao: a.pergunta_votacao,
            votosFavor: Number(a.votos_favor || 0),
            votosContra: Number(a.votos_contra || 0),
            votoUsuario: a.voto_usuario
          })));
        } else {
          setAssemblies([]);
        }

        // 5. Fetch Condos
        const { data: dbCondos, error: errCondos } = await supabase.from('condominios').select('*');
        if (dbCondos && !errCondos) {
          setCondos(dbCondos);
        } else {
          setCondos([]);
        }

        // 6. Fetch Visitantes
        const { data: dbVisitantes, error: errVisitantes } = await supabase.from('visitantes').select('*');
        if (dbVisitantes && !errVisitantes) {
          setVisitantes(dbVisitantes);
        } else {
          setVisitantes([]);
        }

        // 7. Fetch Encomendas
        const { data: dbEncomendas, error: errEncomendas } = await supabase.from('encomendas').select('*');
        if (dbEncomendas && !errEncomendas) {
          setEncomendas(dbEncomendas);
        } else {
          setEncomendas([]);
        }

        // 8. Fetch AuditLogs
        const { data: dbAudit, error: errAudit } = await supabase.from('auditoria').select('*');
        if (dbAudit && !errAudit) {
          setAuditLogs(dbAudit);
        } else {
          setAuditLogs([]);
        }
      } catch (err) {
        console.warn('Falha ao conectar com tabelas do Supabase corporativo – modo offline:', err);
      }
    };

    fetchSupabaseData();
  }, [isOpen]);

  // Handle simulated Quick Login
  const handleDemoLogin = (role: string) => {
    let dName = 'Roberto Silva';
    let dUnit = 'Apto 41-B';
    let dProfile = 'Morador';

    const cleanRole = role.toLowerCase()
      .replace('síndico', 'sindico')
      .replace('subsíndico', 'subsindico')
      .replace('proprietário', 'proprietario')
      .trim();

    if (cleanRole === 'sindico' || cleanRole === 'síndico') {
      dName = 'Cristhiane Xavier';
      dUnit = 'Síndico Geral';
      dProfile = 'Síndico';
    } else if (cleanRole === 'subsindico' || cleanRole === 'subsíndico') {
      dName = 'Gustavo Mendes';
      dUnit = 'Subsíndico Setorial';
      dProfile = 'Subsíndico';
    } else if (cleanRole === 'administrador' || cleanRole === 'admin') {
      dName = 'Administrador Facilities';
      dUnit = 'Hub Corporativo';
      dProfile = 'Administrador';
    } else if (cleanRole === 'conselheiro') {
      dName = 'Felipe Noronha';
      dUnit = 'Apto 102';
      dProfile = 'Conselheiro';
    } else if (cleanRole === 'porteiro') {
      dName = 'Jorge Alencar';
      dUnit = 'Portaria Principal';
      dProfile = 'Porteiro';
    } else if (cleanRole === 'colaborador' || cleanRole === 'colab') {
      dName = 'Silvia Rodrigues';
      dUnit = 'Suporte Técnico';
      dProfile = 'Colaborador';
    } else if (cleanRole === 'proprietario' || cleanRole === 'proprietário') {
      dName = 'Mariana Couto';
      dUnit = 'Apto 204';
      dProfile = 'Proprietário';
    }

    setUsername(dName);
    setApartmentCode(dUnit);
    setProfileType(dProfile);

    onShowNotification('Login efetuado!', `Bem-vindo ao painel demonstrativo Facilities como ${dProfile}.`);

    if (onLoginSuccess) {
      onLoginSuccess(dName, dProfile, dUnit);
    } else {
      setIsLoggedIn(true);
    }
  };

  const handleCustomLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !password) {
      alert('Por favor, informe suas credenciais para entrar.');
      return;
    }

    setLoading(true);
    try {
      console.log('Autenticando via Supabase Auth (signInWithPassword):', loginEmail);
      const data = await router.login(loginEmail.trim(), password);
      
      if (data && data.user) {
        // Encontrar profile para carregar dados na sessão
        const { data: dbProfile } = await supabase
          .from('perfis')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        const resolvedProfile = dbProfile || {
          nome: data.user.user_metadata?.full_name || 'Usuário Autenticado',
          unidade: data.user.user_metadata?.unit || 'Apto Geral',
          tipo: data.user.user_metadata?.profile || 'Morador'
        };

        setUsername(resolvedProfile.nome);
        setApartmentCode(resolvedProfile.unidade || 'Apto Geral');
        setProfileType(resolvedProfile.tipo || 'Morador');

        if (onLoginSuccess) {
          onLoginSuccess(resolvedProfile.nome, resolvedProfile.tipo || 'Morador', resolvedProfile.unidade || 'Apto Geral');
        } else {
          setIsLoggedIn(true);
        }
      }
      onClose();
    } catch (err: any) {
      alert(`Falha na Autenticação Supabase Auth: ${err.message || 'Verifique seus dados.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regCpf.trim() || !regEmail.trim() || !regPassword.trim() || !regUnit.trim()) {
      alert('Por favor, preencha todos os dados obrigatórios para criar sua conta.');
      return;
    }

    setLoading(true);
    try {
      console.log('Efetuando registro e sincronização pela central Supabase Auth...');
      const data = await router.signUp(
        regEmail.trim(),
        regPassword,
        regName.trim(),
        regUnit.trim(),
        profileType,
        regCpf.trim()
      );

      // Reset form variables
      const finalName = regName.trim();
      const finalProfile = profileType;
      const finalUnit = regUnit.trim();

      setRegName('');
      setRegCpf('');
      setRegEmail('');
      setRegPassword('');
      setRegUnit('Apto Geral');
      
      if (onLoginSuccess) {
        onLoginSuccess(finalName, finalProfile, finalUnit);
      }
      onClose();
    } catch (err: any) {
      const isFetchErr = err.message?.toLowerCase().includes('failed to fetch') || 
                         err.message?.toLowerCase().includes('fetch failed') || 
                         err.message?.toLowerCase().includes('networkerr');
      if (isFetchErr) {
        alert(
          `🔴 ERRO DE CONEXÃO COM O SUPABASE (Failed to Fetch)\n\n` +
          `Isso ocorre quando a requisição do seu navegador para as APIs do Supabase é bloqueada ou falha. Por favor, verifique:\n\n` +
          `1. O SEU PROJETO SUPABASE ESTÁ PAUSADO? (Muito comum na versão gratuita se ficou alguns dias sem uso). Acesse http://supabase.com/dashboard, entre no seu projeto e clique para Restaurar/Reativar (Restore).\n\n` +
          `2. ADBLOCKER OU EXTENSÃO DE PRIVACIDADE: Extensões como uBlock Origin, Privacy Badger ou Brave Shields costumam bloquear o domínio do Supabase. Desative-os temporariamente para esta página ou use uma Aba Anônima.\n\n` +
          `3. CHAVES CONFIGURADAS CORRETAMENTE: Verifique nas Configurações (Secrets) do seu projeto no AI Studio se os valores de VITE_SUPABASE_URL (Ex: https://xxxx.supabase.co) e VITE_SUPABASE_ANON_KEY estão gravados de forma limpa, sem aspas, espaços extras ou barras no final.`
        );
      } else {
        alert(`Erro ao cadastrar usuário: ${err.message || 'Verifique se o e-mail ou o CPF já existem.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('Erro ao sair do Supabase:', signOutErr);
      }
    }
    setIsLoggedIn(false);
    setLoginEmail('');
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

  const getPortalTabs = () => {
    const prof = (profileType || 'Morador').toLowerCase();
    if (prof.includes('porteiro')) {
      return [
        { id: 'admin_portaria', label: 'Ronda & Portaria', icon: <Key className="w-4 h-4" /> },
        { id: 'admin_moradores', label: 'Consultar Moradores', icon: <Users className="w-4 h-4" /> },
      ];
    } else if (prof.includes('admin') || prof === 'administrador') {
      return [
        { id: 'admin_dashboard', label: 'Monitor Geral', icon: <Compass className="w-4 h-4" /> },
        { id: 'admin_condominios', label: 'Condomínios', icon: <Building2 className="w-4 h-4" /> },
        { id: 'admin_moradores', label: 'Moradores Base', icon: <Users className="w-4 h-4" /> },
        { id: 'admin_financeiro', label: 'Financeiro Geral', icon: <Wallet className="w-4 h-4" /> },
        { id: 'admin_portaria', label: 'Portaria Hub', icon: <Key className="w-4 h-4" /> },
        { id: 'admin_relatorios', label: 'Relatórios Master', icon: <FileText className="w-4 h-4" /> },
        { id: 'admin_auditoria', label: 'Auditoria Logs', icon: <Activity className="w-4 h-4 text-emerald-500" /> },
        { id: 'admin_config', label: 'Configurações RLS', icon: <ShieldAlert className="w-4 h-4" /> },
      ];
    } else if (prof.includes('colab')) {
      return [
        { id: 'admin_dashboard', label: 'Painel Geral', icon: <Compass className="w-4 h-4" /> },
        { id: 'admin_condominios', label: 'Visualizar Condos', icon: <Building2 className="w-4 h-4" /> },
        { id: 'admin_moradores', label: 'Cadastrar Moradores', icon: <Users className="w-4 h-4" /> },
        { id: 'admin_portaria', label: 'Ronda & Portaria', icon: <Key className="w-4 h-4" /> },
        { id: 'admin_relatorios', label: 'Exportar Relatórios', icon: <FileText className="w-4 h-4" /> },
      ];
    } else if (prof.includes('sindico') || prof.includes('síndico')) {
      return [
        { id: 'admin_dashboard', label: 'Faturamento & Visão', icon: <Compass className="w-4 h-4" /> },
        { id: 'admin_financeiro', label: 'Prestação de Contas', icon: <Wallet className="w-4 h-4" /> },
        { id: 'admin_moradores', label: 'Consultar Moradores', icon: <Users className="w-4 h-4" /> },
        { id: 'admin_portaria', label: 'Controle Portaria', icon: <Key className="w-4 h-4" /> },
      ];
    } else if (prof.includes('conselheiro')) {
      return [
        { id: 'balanço', label: 'Contas do Condomínio', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'atas', label: 'Assembleia & Votos', icon: <Vote className="w-4 h-4" /> },
        { id: 'ocorrencias', label: 'Registrar Ocorrências', icon: <AlertTriangle className="w-4 h-4" /> },
      ];
    } else {
      // Residents:
      return [
        { id: 'financeiro', label: 'Meus Boletos', icon: <FileText className="w-4 h-4" /> },
        { id: 'reservas', label: 'Reservas de Lazer', icon: <Calendar className="w-4 h-4" /> },
        { id: 'ocorrencias', label: 'Registrar Ocorrências', icon: <AlertTriangle className="w-4 h-4" /> },
        { id: 'atas', label: 'Assembleia & Votos', icon: <Vote className="w-4 h-4" /> },
        { id: 'balanço', label: 'Contas do Condomínio', icon: <DollarSign className="w-4 h-4" /> },
      ];
    }
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
              
              <div className="bg-white/65 p-4 rounded-xl border border-[#cfdbec] space-y-3">
                <p className="text-[10px] uppercase font-bold text-gray-500">Testar Demonstrativo Grátis</p>
                <div className="space-y-2 text-left">
                  <label htmlFor="quick-role-select" className="text-[9px] font-bold text-secondary uppercase block">Selecione o Papel</label>
                  <select
                    id="quick-role-select"
                    value={quickRole}
                    onChange={(e) => setQuickRole(e.target.value)}
                    className="w-full bg-white border border-gray-200 outline-none focus:border-primary p-2 rounded text-xs text-[#101c29] font-semibold cursor-pointer"
                  >
                    <option value="Morador">Morador (Residente)</option>
                    <option value="Proprietário">Proprietário (Donatário)</option>
                    <option value="Síndico">Síndico (Gestão Geral)</option>
                    <option value="Subsíndico">Subsíndico (Gestão Setorial)</option>
                    <option value="Conselheiro">Conselheiro (Conselho Fiscal)</option>
                    <option value="Porteiro">Porteiro (Controle de Acesso)</option>
                    <option value="Administrador">Administrador (Facilities Adm)</option>
                    <option value="Colaborador">Colaborador (Prestador Interno)</option>
                  </select>
                  
                  <button
                    id="login-quick-selected"
                    onClick={() => handleDemoLogin(quickRole)}
                    className="w-full bg-[#af101a] hover:bg-primary-hover text-white py-2.5 text-xs font-bold rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Acessar Demonstrativo
                  </button>
                </div>
              </div>
            </div>

            {/* Right Standard Login Form / Register container */}
            <div className="w-full max-w-sm bg-white p-6 md:p-8 rounded-2xl border border-[#cfdbec] shadow-md flex flex-col">
              
              {/* Form Mode Selector tabs */}
              {(formTab === 'login' || formTab === 'register') && (
                <div className="flex border-b border-gray-200 mb-5 font-sans text-xs font-bold uppercase tracking-wider">
                  <button
                    id="tab-mode-login"
                    type="button"
                    onClick={() => {
                      setFormTab('login');
                      window.location.hash = '#login';
                    }}
                    className={`flex-1 pb-2.5 text-center transition-all border-b-2 cursor-pointer ${
                      formTab === 'login'
                        ? 'border-[#af101a] text-[#af101a] font-extrabold'
                        : 'border-transparent text-secondary hover:text-primary'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    id="tab-mode-register"
                    type="button"
                    onClick={() => {
                      setFormTab('register');
                      window.location.hash = '#register';
                    }}
                    className={`flex-1 pb-2.5 text-center transition-all border-b-2 cursor-pointer ${
                      formTab === 'register'
                        ? 'border-[#af101a] text-[#af101a] font-extrabold'
                        : 'border-transparent text-secondary hover:text-primary'
                    }`}
                  >
                    Criar Conta
                  </button>
                </div>
              )}

              {formTab === 'login' && (
                <form onSubmit={handleCustomLogin} className="space-y-4">
                  <h5 className="font-bold text-center text-xs font-display uppercase tracking-wider text-[#101c29]">Acesso Certificado</h5>
                  
                  <div className="space-y-1">
                    <label htmlFor="portal-email-input" className="text-[10px] font-bold text-[#101c29] uppercase block">E-mail de Acesso</label>
                    <input
                      id="portal-email-input"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-[#f8f9ff] border border-gray-250 outline-none focus:border-primary p-3 rounded-lg text-sm text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="portal-pass-input" className="text-[10px] font-bold text-[#101c29] uppercase block">Senha de Acesso</label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormTab('esqueci-senha');
                          window.location.hash = '#esqueci-senha';
                        }}
                        className="text-[10px] text-gray-500 hover:text-primary hover:underline font-bold cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <input
                      id="portal-pass-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#f8f9ff] border border-gray-250 outline-none focus:border-primary p-3 rounded-lg text-sm text-[#101c29]"
                    />
                  </div>

                  <button
                    id="portal-form-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#af101a] hover:bg-primary-hover text-white py-3 rounded-lg font-bold transition-all text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 animate-pulse-subtle"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
                        Autenticando...
                      </>
                    ) : (
                      'Entrar no Condomínio'
                    )}
                  </button>
                </form>
              )}

              {formTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  <h5 className="font-bold text-center text-xs font-display uppercase tracking-wider text-[#101c29] mb-1">Novo Cadastro</h5>
                  
                  <div className="space-y-0.5">
                    <label htmlFor="reg-name-input" className="text-[9px] font-bold text-secondary uppercase block">Nome Completo</label>
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex: Roberto Silva"
                      className="w-full bg-[#f8f9ff] border border-gray-200 outline-none focus:border-primary p-2 rounded text-xs text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label htmlFor="reg-cpf-input" className="text-[9px] font-bold text-secondary uppercase block">CPF</label>
                    <input
                      id="reg-cpf-input"
                      type="text"
                      required
                      value={regCpf}
                      onChange={(e) => setRegCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full bg-[#f8f9ff] border border-gray-200 outline-none focus:border-primary p-2 rounded text-xs text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label htmlFor="reg-email-input" className="text-[9px] font-bold text-secondary uppercase block">E-mail Corporativo</label>
                    <input
                      id="reg-email-input"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-[#f8f9ff] border border-gray-200 outline-none focus:border-primary p-2 rounded text-xs text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label htmlFor="reg-profile-select" className="text-[9px] font-bold text-[#af101a] uppercase block">Tipo de Perfil</label>
                    <select
                      id="reg-profile-select"
                      required
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value)}
                      className="w-full bg-white border border-primary/40 outline-none focus:border-primary p-2 rounded text-xs text-[#101c29] font-bold cursor-pointer"
                    >
                      <option value="Morador">Morador (Residente)</option>
                      <option value="Proprietário">Proprietário (Donatário)</option>
                      <option value="Síndico">Síndico (Gestão Geral)</option>
                      <option value="Subsíndico">Subsíndico (Gestão Setorial)</option>
                      <option value="Conselheiro">Conselheiro (Conselho Fiscal)</option>
                      <option value="Porteiro">Porteiro (Controle de Acesso)</option>
                      <option value="Administrador">Administrador (Facilities Adm)</option>
                      <option value="Colaborador">Colaborador (Prestador Interno)</option>
                    </select>
                  </div>

                  <div className="space-y-0.5">
                    <label htmlFor="reg-pass-input" className="text-[9px] font-bold text-secondary uppercase block">Senha de Acesso</label>
                    <input
                      id="reg-pass-input"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Crie uma senha de acesso"
                      className="w-full bg-[#f8f9ff] border border-gray-200 outline-none focus:border-primary p-2 rounded text-xs text-[#101c29]"
                    />
                  </div>

                  <button
                    id="portal-reg-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#af101a] hover:bg-primary-hover text-white py-2.5 rounded font-bold transition-all text-xs cursor-pointer mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
                        Processando Cadastro...
                      </>
                    ) : (
                      'Criar Conta & Acessar'
                    )}
                  </button>
                </form>
              )}

              {formTab === 'esqueci-senha' && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <h5 className="font-bold text-center text-xs font-display uppercase tracking-wider text-[#101c29]">Recuperar Minha Senha</h5>
                  
                  <div className="space-y-1">
                    <label htmlFor="recovery-email" className="text-[10px] font-bold text-[#101c29] uppercase block">Seu E-mail Cadastrado</label>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="digite@seuemail.com"
                      className="w-full bg-[#f8f9ff] border border-gray-250 outline-none focus:border-primary p-3 rounded-lg text-sm text-[#101c29]"
                    />
                  </div>

                  <button
                    id="recovery-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#af101a] hover:bg-primary-hover text-white py-3 rounded-lg font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
                        Enviando...
                      </>
                    ) : (
                      'Enviar E-mail de Recuperação'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormTab('login');
                      window.location.hash = '#login';
                    }}
                    className="w-full text-center text-xs text-gray-400 hover:text-black hover:underline font-bold mt-2 cursor-pointer"
                  >
                    Voltar para o Login
                  </button>
                </form>
              )}

              {formTab === 'alterar-senha' && (
                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <h5 className="font-bold text-center text-xs font-display uppercase tracking-wider text-[#101c29]">Registrar Nova Senha</h5>
                  
                  <div className="space-y-1">
                    <label htmlFor="reset-new-password" className="text-[10px] font-bold text-[#101c29] uppercase block">Nova Senha</label>
                    <input
                      id="reset-new-password"
                      type="password"
                      required
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      placeholder="Crie uma nova senha de acesso"
                      className="w-full bg-[#f8f9ff] border border-gray-250 outline-none focus:border-primary p-3 rounded-lg text-sm text-[#101c29]"
                    />
                  </div>

                  <button
                    id="reset-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#af101a] hover:bg-primary-hover text-white py-3 rounded-lg font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
                        Atualizando...
                      </>
                    ) : (
                      'Salvar Nova Senha'
                    )}
                  </button>
                </form>
              )}

              {/* Database sync status info indicator */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-secondary font-medium">Serviço de Autenticação:</span>
                  {isSupabaseConfigured && supabase ? (
                    <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Supabase Cloud Ativo
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowInlineSetup(!showInlineSetup)}
                      className="text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Conectar Supabase Real ⚙️
                    </button>
                  )}
                </div>

                {!isSupabaseConfigured && showInlineSetup && (
                  <div className="bg-[#fcf8f2] border border-amber-200 rounded-xl p-3.5 mt-1 text-left space-y-2">
                    <p className="font-extrabold text-[#9c510e] uppercase text-[9px] block">⚙️ Configurar Meu Supabase Real</p>
                    <p className="text-[9px] text-[#805020] leading-normal font-sans">
                      Insira sua URL e Anon Key do Supabase abaixo. Elas serão salvas no seu navegador para habilitar a autenticação real imediatamente!
                    </p>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[8px] font-bold text-[#805020] uppercase block mb-0.5">SUPABASE URL</label>
                        <input
                          type="text"
                          value={inlineUrl}
                          onChange={(e) => setInlineUrl(e.target.value)}
                          placeholder="Ex: https://xxxxxx.supabase.co"
                          className="w-full bg-white border border-amber-300 outline-none p-1.5 rounded text-[10px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-[#805020] uppercase block mb-0.5">SUPABASE ANON KEY</label>
                        <input
                          type="text"
                          value={inlineKey}
                          onChange={(e) => setInlineKey(e.target.value)}
                          placeholder="Cole sua anon public key completa..."
                          className="w-full bg-white border border-amber-300 outline-none p-1.5 rounded text-[10px] font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!inlineUrl.trim() || !inlineKey.trim()) {
                            alert('Por favor, preencha a URL e a Anon Key para estabelecer a conexão.');
                            return;
                          }
                          
                          let sanitizedUrl = inlineUrl.trim();
                          while (sanitizedUrl.startsWith('"') || sanitizedUrl.endsWith('"') || sanitizedUrl.startsWith("'") || sanitizedUrl.endsWith("'")) {
                            sanitizedUrl = sanitizedUrl.replace(/^['"]|['"]$/g, '').trim();
                          }
                          sanitizedUrl = sanitizedUrl.replace(/\/$/, '');

                          let sanitizedKey = inlineKey.trim();
                          while (sanitizedKey.startsWith('"') || sanitizedKey.endsWith('"') || sanitizedKey.startsWith("'") || sanitizedKey.endsWith("'")) {
                            sanitizedKey = sanitizedKey.replace(/^['"]|['"]$/g, '').trim();
                          }

                          localStorage.setItem('VITE_SUPABASE_URL', sanitizedUrl);
                          localStorage.setItem('VITE_SUPABASE_ANON_KEY', sanitizedKey);
                          onShowNotification('Sucesso!', 'Credenciais salvas no navegador! Recarregando a página para conectar...');
                          setTimeout(() => {
                            window.location.reload();
                          }, 1200);
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2 rounded text-[10px] cursor-pointer text-center"
                      >
                        Salvar e Conectar Agora
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                  <p className="text-xs text-secondary leading-none">{apartmentCode}</p>
                  <span className="text-[10px] text-primary font-bold mt-1 block">Perfil: {profileType}</span>
                </div>
                <div className="text-[9px] uppercase font-bold text-success bg-green-50 p-1.5 rounded inline-block">
                  ● Conexão Online
                </div>
              </div>

              {/* Functional tabs navigation */}
              <div id="portal-menu-tabs" className="flex flex-row md:flex-col gap-1.5 py-4 flex-1 w-full shrink-0 md:overflow-y-auto">
                {getPortalTabs().map((tab) => (
                  <button
                    key={tab.id}
                    id={`portal-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 truncate whitespace-nowrap transition-all ${
                      activeTab === tab.id ? 'bg-[#af101a] text-white font-extrabold shadow-sm' : 'text-[#5f5e5e] hover:bg-gray-100 font-bold font-sans'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
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
                      {getFilteredBoletos().length} {getFilteredBoletos().length === 1 ? 'Boleto Mapeado' : 'Boletos Mapeados'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {getFilteredBoletos().length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-gray-150 text-center text-sm text-secondary">
                        <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold">Nenhum boleto localizado para sua unidade.</p>
                        <p className="text-xs mt-1 text-gray-400">Entre em contato com a administração caso julgue necessário.</p>
                      </div>
                    ) : (
                      getFilteredBoletos().map((bol) => (
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
                    )))}
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
                      {getFilteredBookings().length === 0 ? (
                        <div id="booking-empty-box" className="p-10 border-2 border-dashed border-gray-200 text-center rounded-2xl">
                          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-secondary">Nenhum evento ou área reservada por você.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getFilteredBookings().map((bkg) => (
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
                        {getFilteredOcorrencias().length === 0 ? (
                          <div className="bg-white p-6 rounded-xl border border-dashed border-gray-200 text-center text-xs text-secondary">
                            Nenhuma ocorrência registrada por você.
                          </div>
                        ) : (
                          getFilteredOcorrencias().map((tkt) => (
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
                          ))
                        )}
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
                    {getFilteredAssemblies().length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-gray-150 text-center text-sm text-secondary">
                        <Vote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold">Nenhuma deliberação ativa ou ata arquivada.</p>
                      </div>
                    ) : (
                      getFilteredAssemblies().map((asm) => (
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
                      ))
                    )}
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

              {/* ADMIN TAB: MONITOR GERAL */}
              {activeTab === 'admin_dashboard' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#af101a]/10 p-5 rounded-2xl border border-[#af101a]/20 text-left">
                    <div>
                      <h4 className="text-base font-bold text-[#af101a] font-display">Facilities Premium Executive - Intel Monitor</h4>
                      <p className="text-xs text-[#523131] mt-0.5">Visão consolidada para {profileType} e controle operacional de todos os residenciais integrados.</p>
                    </div>
                    <span className="text-[10px] bg-[#af101a] text-white px-3 py-1 rounded-full font-bold mt-2 md:mt-0 uppercase tracking-widest">{profileType} Ativo</span>
                  </div>

                  {/* Operational indicators layout row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Total de Condomínios</p>
                      <h5 className="text-2xl font-bold text-[#101c29] font-display mt-0.5">{getFilteredCondos().length}</h5>
                      <span className="text-[10px] text-green-600 font-semibold">100% integrados</span>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Total Unidades</p>
                      <h5 className="text-2xl font-bold text-[#101c29] font-display mt-0.5">
                        {getFilteredCondos().reduce((acc, c) => acc + c.unidades, 0)}
                      </h5>
                      <span className="text-[10px] text-secondary">Méd. {Math.round(getFilteredCondos().reduce((acc, c) => acc + c.unidades, 0)/Math.max(1, getFilteredCondos().length))} unids/bloco</span>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Moradores Cadastrados Base</p>
                      <h5 className="text-2xl font-bold text-primary font-display mt-0.5">
                        {getFilteredUsersDb().length + getFilteredCondos().reduce((acc, c) => acc + c.moradores, 0)}
                      </h5>
                      <span className="text-[10px] text-success font-semibold">✓ Banco de dados Sandbox</span>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Inadimplência Média</p>
                      <h5 className="text-2xl font-bold text-[#af101a] font-display mt-0.5">
                        {getFilteredCondos().length === 0 ? '0.0' : (getFilteredCondos().reduce((acc, c) => acc + c.inadimplenciaPercent, 0) / getFilteredCondos().length).toFixed(1)}%
                      </h5>
                      <span className="text-[10px] text-secondary">Cálculo real em lote</span>
                    </div>
                  </div>

                  {/* Custom delinquency list bar gauges */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
                    <h5 className="text-sm font-bold text-[#101c29] font-display border-b border-gray-100 pb-3">Indicador de Riscos Financeiros por Condomínio</h5>
                    <div className="space-y-3.5">
                      {getFilteredCondos().length === 0 ? (
                        <p className="text-xs text-secondary italic">Nenhum condomínio cadastrado ou vinculado.</p>
                      ) : (
                        getFilteredCondos().map(c => (
                          <div key={c.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-secondary">
                              <span>{c.nome}</span>
                              <span className={c.inadimplenciaPercent > 15 ? 'text-[#af101a] font-bold' : 'text-[#101c29]'}>{c.inadimplenciaPercent}% inadimplência</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${
                                c.inadimplenciaPercent > 15 ? 'bg-[#af101a]' : c.inadimplenciaPercent > 8 ? 'bg-amber-500' : 'bg-[#101c29]'
                              }`} style={{ width: `${Math.min(c.inadimplenciaPercent * 3, 100)}%` }}></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick stats on financial collection */}
                  <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 text-left">
                    <h5 className="text-sm font-bold text-[#101c29] font-display border-b border-gray-100 pb-3">Resumo Geral de Arrecadação Ordinária</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4.5 rounded-xl border border-gray-200">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Consolidado Receitas Estimadas</p>
                        <h5 className="text-xl font-bold text-green-700 font-display leading-none mt-1">
                          R$ {getFilteredCondos().reduce((acc, c) => acc + c.receita, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h5>
                        <p className="text-[10px] text-secondary mt-1.5">Soma estimada de faturamentos mensais</p>
                      </div>

                      <div className="bg-gray-50 p-4.5 rounded-xl border border-gray-200">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Consolidado Despesas Contratuais</p>
                        <h5 className="text-xl font-bold text-red-700 font-display leading-none mt-1">
                          R$ {getFilteredCondos().reduce((acc, c) => acc + c.despesa, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h5>
                        <p className="text-[10px] text-secondary mt-1.5">Soma de salários, zeladoria e concessionárias</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: GESTÃO DE CONDOMÍNIOS */}
              {activeTab === 'admin_condominios' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-left">
                    <div>
                      <h4 className="text-base font-bold text-[#101c29] font-display">Residenciais e Condomínios Integrados</h4>
                      <p className="text-xs text-secondary mt-0.5">Gerenciador de complexos habitacionais e empresariais parceiros Facilities.</p>
                    </div>
                  </div>

                  {/* Inline collapse form to create condo */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
                    <h5 className="text-xs font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                       Novo Condomínio
                    </h5>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!newCondoName || !newCondoCnpj) return;
                      const newId = `cd-${Date.now()}`;
                      const newObj = {
                        id: newId,
                        nome: newCondoName,
                        cnpj: newCondoCnpj,
                        endereco: 'Rua Principal, ' + (condos.length * 200 + 100),
                        cidade: 'São Paulo',
                        estado: 'SP',
                        sindico: newCondoSindico || 'Administradora Facilities',
                        unidades: Number(newCondoUnidades) || 80,
                        moradores: Math.round(Number(newCondoUnidades) * 2.8) || 200,
                        proprietarios: Math.round(Number(newCondoUnidades) * 0.95),
                        receita: Number(newCondoUnidades) * 750,
                        despesa: Number(newCondoUnidades) * 620,
                        inadimplenciaPercent: 5.0,
                        status: 'Normal'
                      };
                      setCondos(prev => [...prev, newObj]);
                      
                      if (isSupabaseConfigured && supabase) {
                        supabase.from('condominios').insert({
                          id: newObj.id,
                          nome: newObj.nome,
                          cnpj: newObj.cnpj,
                          endereco: newObj.endereco,
                          bairro: 'Centro',
                          cidade: newObj.cidade,
                          estado: newObj.estado,
                          sindico: newObj.sindico,
                          unidades: newObj.unidades,
                          moradores: newObj.moradores,
                          proprietarios: newObj.proprietarios,
                          receita: newObj.receita,
                          despesa: newObj.despesa,
                          inadimplencia_percent: newObj.inadimplenciaPercent,
                          status: newObj.status
                        }).then(({ error }) => {
                          if (error) console.error('Erro ao salvar condomínio no Supabase:', error.message);
                        });
                      }

                      addAuditLog('CRIAR', 'condominios', `Registrado condomínio ${newCondoName} com ${newCondoUnidades} unidades.`);
                      onShowNotification('Sucesso!', `Condomínio ${newCondoName} foi adicionado à base.`);
                      setNewCondoName('');
                      setNewCondoCnpj('');
                      setNewCondoSindico('');
                    }} className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                      <input
                        type="text"
                        required
                        placeholder="Nome do Condomínio"
                        value={newCondoName}
                        onChange={(e) => setNewCondoName(e.target.value)}
                        className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="CNPJ"
                        value={newCondoCnpj}
                        onChange={(e) => setNewCondoCnpj(e.target.value)}
                        className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      />
                      <input
                        type="text"
                        placeholder="Síndico Responsável"
                        value={newCondoSindico}
                        onChange={(e) => setNewCondoSindico(e.target.value)}
                        className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Unidades"
                          value={newCondoUnidades}
                          onChange={(e) => setNewCondoUnidades(Number(e.target.value))}
                          className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] w-24"
                        />
                        <button
                          type="submit"
                          className="flex-1 bg-[#af101a] hover:bg-[#900e15] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Incluir
                        </button>
                      </div>
                    </form>
                  </div>

                   {/* Condominios List Representation */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {getFilteredCondos().length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-gray-150 text-center text-sm text-secondary col-span-2 w-full">
                        <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold">Nenhum condomínio cadastrado na sua carteira.</p>
                        <p className="text-xs mt-1 text-gray-400">Use o formulário acima para cadastrar seu primeiro condomínio.</p>
                      </div>
                    ) : (
                      getFilteredCondos().map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-start text-left">
                            <div>
                              <span className="text-[10px] text-primary font-bold uppercase tracking-wide">{item.id}</span>
                              <h5 className="font-sans font-bold text-[#101c29] text-base leading-snug">{item.nome}</h5>
                              <p className="text-[11px] text-gray-400 font-medium">CNPJ: {item.cnpj}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              item.status === 'Crítico' ? 'bg-red-50 text-[#af101a]' : item.status === 'Alerta' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-gray-100 text-left">
                            <div>
                              <p className="text-[9px] uppercase font-bold text-gray-400">Síndico</p>
                              <p className="text-xs font-bold text-[#101c29] truncate">{item.sindico}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-gray-400">Total Unidades</p>
                              <p className="text-xs font-bold text-[#101c29]">{item.unidades} aptos</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-gray-400">Moradores Est.</p>
                              <p className="text-xs font-bold text-[#101c29]">{item.moradores} morad.</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-secondary bg-gray-50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                            <span className="font-medium text-[11px]">Receita: R$ {item.receita.toLocaleString('pt-BR')}/mês</span>
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir o condomínio ${item.nome}?`)) {
                                  setCondos(prev => prev.filter(c => c.id !== item.id));
                                  
                                  if (isSupabaseConfigured && supabase) {
                                    supabase.from('condominios').delete().eq('id', item.id).then(({ error }) => {
                                      if (error) console.error('Erro ao excluir condomínio no Supabase:', error.message);
                                    });
                                  }

                                  addAuditLog('EXCLUIR', 'condominios', `Excluído condomínio ${item.nome}.`);
                                  onShowNotification('Excluído!', `Condomínio ${item.nome} removido da base.`);
                                }
                              }}
                              className="text-[#af101a] hover:underline font-bold text-[11px] cursor-pointer"
                            >
                              Excluir Registro
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ADMIN TAB: CADASTRO DE MORADORES */}
              {activeTab === 'admin_moradores' && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h4 className="text-base font-bold text-[#101c29] font-display">Base Geral de Moradores e Perfis</h4>
                    <p className="text-xs text-secondary mt-0.5">Controle integral de contas habilitadas e permissões. Adicione moradores que poderão acessar o app instantaneamente.</p>
                  </div>

                  {/* Inline resident creation form */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-left">
                    <h5 className="text-xs font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                       Conceder Acesso a Novo Beneficiário / Perfil
                    </h5>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!newMoradorNome || !newMoradorCpf) return;
                      
                      const cleanCpf = newMoradorCpf.replace(/\D/g, '');
                      const duplicate = usersDb.find(u => u.cpf.replace(/\D/g, '') === cleanCpf);
                      if (duplicate) {
                        alert('Este CPF já está cadastrado na base de dados.');
                        return;
                      }

                      const newU = {
                        name: newMoradorNome,
                        cpf: cleanCpf,
                        email: newMoradorEmail || `${cleanCpf}@facilitiescondominal.com`,
                        pass: newMoradorSenha || '123',
                        unit: newMoradorUnidade || 'Apto 101',
                        profile: newMoradorRole
                      };
                      
                      setUsersDb(prev => [...prev, newU]);
                      addAuditLog('CRIAR', 'moradores', `Concedido acesso para ${newMoradorNome} como ${newMoradorRole}.`);
                      onShowNotification('Conta Ativada!', `${newMoradorNome} foi adicionado à base de acesso.`);
                      setNewMoradorNome('');
                      setNewMoradorCpf('');
                      setNewMoradorEmail('');
                      setNewMoradorSenha('');
                      setNewMoradorUnidade('');
                    }} className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <input
                        type="text"
                        required
                        placeholder="Nome Completo do Beneficiário"
                        value={newMoradorNome}
                        onChange={(e) => setNewMoradorNome(e.target.value)}
                        className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="CPF (apenas números)"
                        value={newMoradorCpf}
                        onChange={(e) => setNewMoradorCpf(e.target.value)}
                        className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      />
                      <input
                        type="text"
                        placeholder="Unidade / Bloco (Ex: Apto 24-B)"
                        value={newMoradorUnidade}
                        onChange={(e) => setNewMoradorUnidade(e.target.value)}
                        className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      />
                      <input
                        type="email"
                        placeholder="E-mail (Opcional)"
                        value={newMoradorEmail}
                        onChange={(e) => setNewMoradorEmail(e.target.value)}
                        className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      />
                      <input
                        type="password"
                        placeholder="Senha de Login (Padrão: 123)"
                        value={newMoradorSenha}
                        onChange={(e) => setNewMoradorSenha(e.target.value)}
                        className="bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newMoradorRole}
                          onChange={(e) => setNewMoradorRole(e.target.value)}
                          className="bg-[#f8f9ff] border border-[#cfdbec] p-2 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] flex-1 font-semibold"
                        >
                          <option value="Morador">Morador</option>
                          <option value="Síndico">Síndico</option>
                          <option value="Colaborador">Colaborador</option>
                          <option value="Administrador">Administrador</option>
                          <option value="Conselheiro">Conselheiro</option>
                          <option value="Porteiro">Porteiro</option>
                        </select>
                        <button
                          type="submit"
                          className="bg-[#af101a] hover:bg-[#900e15] text-white font-bold px-4 rounded-lg text-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1"
                        >
                          Habilitar
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Registered Residents Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h5 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">Contas Ativas no Supabase / Sandbox</h5>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100/60 text-secondary border-b border-gray-200">
                            <th className="p-4 font-bold">Colaborador/Nome</th>
                            <th className="p-4 font-bold">CPF Credencial</th>
                            <th className="p-4 font-bold">Unidade Associada</th>
                            <th className="p-4 font-bold">Nível / Perfil</th>
                            <th className="p-4 font-bold">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {getFilteredUsersDb().map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-4 font-bold text-[#101c29]">{item.name}</td>
                              <td className="p-4 font-mono text-secondary">{item.cpf}</td>
                              <td className="p-4 font-semibold text-secondary">{item.unit}</td>
                              <td className="p-4 font-bold">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                                  (item.profile || 'Morador').toLowerCase().includes('admin')
                                    ? 'bg-red-50 text-primary'
                                    : (item.profile || 'Morador').toLowerCase().includes('colab')
                                    ? 'bg-blue-50 text-blue-600'
                                    : (item.profile || 'Morador').toLowerCase().includes('sindico') || (item.profile || 'Morador').toLowerCase().includes('síndico')
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {item.profile || 'Morador'}
                                </span>
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => {
                                    if (item.cpf === '123' || item.cpf === '456') {
                                      alert('Esta conta master protege o sistema e não pode ser deletada.');
                                      return;
                                    }
                                    if (confirm(`Excluir conta de acesso para ${item.name}?`)) {
                                      setUsersDb(prev => prev.filter((_, i) => i !== idx));
                                      addAuditLog('EXCLUIR', 'moradores', `Excluído morador ${item.name}`);
                                      onShowNotification('Sucesso', 'Morador excluído da base.');
                                    }
                                  }}
                                  className="text-[#af101a] hover:underline font-bold cursor-pointer"
                                >
                                  Deletar Acesso
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: FINANCEIRO GERAL */}
              {activeTab === 'admin_financeiro' && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h4 className="text-base font-bold text-[#101c29] font-display">Balancete e Faturamento Geral Ordinário</h4>
                    <p className="text-xs text-secondary mt-0.5">Painel de receitas líquidas e controle de caixa unificado para condomínios.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#af101a] text-white p-5 rounded-2xl shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-white/70">Receita Total Acumulada</p>
                      <h5 className="text-2xl font-bold font-display mt-0.5">R$ {condos.reduce((acc, c) => acc + c.receita, 0).toLocaleString('pt-BR')}</h5>
                      <span className="text-[10px] text-white/50">Estimativa do mês corrente</span>
                    </div>

                    <div className="bg-[#101c29] text-white p-5 rounded-2xl shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-white/70">Despesa Concessionária</p>
                      <h5 className="text-2xl font-bold font-display mt-0.5">R$ {getFilteredCondos().reduce((acc, c) => acc + c.despesa, 0).toLocaleString('pt-BR')}</h5>
                      <span className="text-[10px] text-white/50">Incluindo taxas e pessoal</span>
                    </div>

                    <div className="bg-white text-[#101c29] p-5 rounded-2xl border border-gray-150 shadow-sm text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Arrecadação Média Líquida</p>
                      <h5 className="text-2xl font-bold font-display mt-0.5 text-green-650">R$ {(getFilteredCondos().reduce((acc, c) => acc + c.receita, 0) - getFilteredCondos().reduce((acc, c) => acc + c.despesa, 0)).toLocaleString('pt-BR')}</h5>
                      <span className="text-[10px] text-success">✓ Superávit estimado registrado</span>
                    </div>
                  </div>

                  {/* High Quality Ledger Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h5 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">Demonstrativo Detalhado por Complexo</h5>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100/60 text-secondary border-b border-gray-200">
                            <th className="p-4 font-bold">Condomínio Parceiro</th>
                            <th className="p-4 font-bold">Faturamento Estimado</th>
                            <th className="p-4 font-bold">Inadimplência</th>
                            <th className="p-4 font-bold">Estatuto Financeiro</th>
                            <th className="p-4 font-bold">Saldo Mensal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {getFilteredCondos().length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-secondary text-sm">
                                Nenhum condomínio cadastrado na carteira financeira.
                              </td>
                            </tr>
                          ) : (
                            getFilteredCondos().map((item, idx) => {
                              const saldo = item.receita - item.despesa;
                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="p-4 font-bold text-[#101c29]">{item.nome}</td>
                                  <td className="p-4 font-semibold text-secondary">R$ {item.receita.toLocaleString('pt-BR')}</td>
                                  <td className="p-4 font-bold text-[#af101a]">{item.inadimplenciaPercent}%</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                                      saldo > 0 ? 'bg-emerald-50 text-emerald-600 font-extrabold' : 'bg-red-50 text-[#af101a] font-extrabold'
                                    }`}>
                                      {saldo > 0 ? 'Superavitário' : 'Déficit no Caixa'}
                                    </span>
                                  </td>
                                  <td className={`p-4 font-bold ${saldo > 0 ? 'text-emerald-600' : 'text-[#af101a]'}`}>
                                    R$ {saldo.toLocaleString('pt-BR')}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: PORTARIA HUB */}
              {activeTab === 'admin_portaria' && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h4 className="text-base font-bold text-[#101c29] font-display">Portaria Hub e Controle de Segurança</h4>
                    <p className="text-xs text-secondary mt-0.5">Monitore rondas de segurança presenciais, controle acessos de visitantes cadastrados e gerencie encomendas.</p>
                  </div>

                  {/* Two columns: Visitors vs Packages with quick inline creation forms */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* VISITOR CONTROL SECTION */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-left">
                      <h5 className="text-xs font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                        Controle e Liberação de Visitantes
                      </h5>

                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newVisitorNome || !newVisitorRg) return;
                        const newV = {
                          id: `v-${Date.now()}`,
                          nome: newVisitorNome,
                          rg: newVisitorRg,
                          unidade: newVisitorUnidade || 'Apto-Geral',
                          condominioId: 'cd-1',
                          dataEntrada: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').substring(0, 5),
                          status: 'Liberado'
                        };
                        setVisitantes(prev => [newV, ...prev]);
                        addAuditLog('CRIAR', 'visitantes', `Entrada autorizada para ${newVisitorNome} (RG ${newVisitorRg}) com destino a ${newVisitorUnidade}.`);
                        onShowNotification('Autorizado!', `${newVisitorNome} foi registrado para entrada.`);
                        setNewVisitorNome('');
                        setNewVisitorRg('');
                        setNewVisitorUnidade('');
                      }} className="space-y-2 pt-2 border-t border-gray-150">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nome Completo"
                            value={newVisitorNome}
                            onChange={(e) => setNewVisitorNome(e.target.value)}
                            className="bg-[#f8f9ff] border border-gray-250 p-2 rounded text-xs outline-none focus:border-primary text-[#101c29]"
                          />
                          <input
                            type="text"
                            required
                            placeholder="RG"
                            value={newVisitorRg}
                            onChange={(e) => setNewVisitorRg(e.target.value)}
                            className="bg-[#f8f9ff] border border-gray-250 p-2 rounded text-xs outline-none focus:border-primary text-[#101c29]"
                          />
                          <input
                            type="text"
                            placeholder="Unidade"
                            value={newVisitorUnidade}
                            onChange={(e) => setNewVisitorUnidade(e.target.value)}
                            className="bg-[#f8f9ff] border border-gray-250 p-2 rounded text-xs outline-none focus:border-primary text-[#101c29]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-[#af101a] hover:bg-[#900e15] text-white py-2 font-bold rounded text-xs cursor-pointer transition-colors"
                        >
                          Liberar Entrada
                        </button>
                      </form>

                      {/* Visitors logs list */}
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {getFilteredVisitantes().map(v => (
                          <div key={v.id} className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-[#101c29]">{v.nome}</p>
                              <p className="text-[10px] text-secondary">RG: {v.rg} • Unidade: <strong className="text-secondary">{v.unidade}</strong></p>
                              <p className="text-[9px] text-[#5c6e84] mt-0.5">Entrada: {v.dataEntrada}</p>
                            </div>
                            <div className="text-right">
                              {v.status === 'Liberado' ? (
                                <button
                                  onClick={() => {
                                    setVisitantes(prev => prev.map(item => {
                                      if (item.id === v.id) {
                                        return { ...item, status: 'Concluído', dataSaida: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').substring(0, 5) };
                                      }
                                      return item;
                                    }));
                                    addAuditLog('EDITAR', 'visitantes', `Registrada saída para o visitante ${v.nome}.`);
                                    onShowNotification('Sucesso', `Saída para ${v.nome} registrada.`);
                                  }}
                                  className="bg-[#101c29] text-white text-[10px] font-extrabold px-2 py-1 rounded hover:bg-black uppercase cursor-pointer"
                                >
                                  Registrar Saída
                                </button>
                              ) : (
                                <div className="text-right">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-200 px-2 py-0.5 rounded">Concluido</span>
                                  <p className="text-[8px] text-gray-400 mt-0.5 font-semibold">Saída: {v.dataSaida}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* INCOMING PACKAGES CONTROL SECTION */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-left">
                      <h5 className="text-xs font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                        Entrada e Entrega de Encomendas
                      </h5>

                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newPackageDest || !newPackageDesc) return;
                        const newE = {
                          id: `e-${Date.now()}`,
                          destinatario: newPackageDest,
                          unidade: newPackageUnidade || 'Geral',
                          condominioId: 'cd-1',
                          descricao: newPackageDesc,
                          transportadora: newPackageTransp || 'Mercado Livre',
                          dataRegistro: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').substring(0, 5),
                          status: 'Aguardando'
                        };
                        setEncomendas(prev => [newE, ...prev]);
                        addAuditLog('CRIAR', 'encomendas', `Registrado pacote para ${newPackageDest} (${newPackageDesc}) vindo por ${newPackageTransp}.`);
                        onShowNotification('Encomenda Registrada!', `Adicionada na portaria com sucesso.`);
                        setNewPackageDest('');
                        setNewPackageDesc('');
                        setNewPackageTransp('');
                        setNewPackageUnidade('');
                      }} className="space-y-2 pt-2 border-t border-gray-150">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nome Destinatário"
                            value={newPackageDest}
                            onChange={(e) => setNewPackageDest(e.target.value)}
                            className="bg-[#f8f9ff] border border-gray-250 p-2 rounded text-xs outline-none focus:border-primary text-[#101c29]"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Unidade (Ex: Apto 102)"
                            value={newPackageUnidade}
                            onChange={(e) => setNewPackageUnidade(e.target.value)}
                            className="bg-[#f8f9ff] border border-gray-250 p-2 rounded text-xs outline-none focus:border-primary text-[#101c29]"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Descrição Pacote"
                            value={newPackageDesc}
                            onChange={(e) => setNewPackageDesc(e.target.value)}
                            className="bg-[#f8f9ff] border border-gray-250 p-2 rounded text-xs outline-none focus:border-primary text-[#101c29]"
                          />
                          <input
                            type="text"
                            placeholder="Transportadora"
                            value={newPackageTransp}
                            onChange={(e) => setNewPackageTransp(e.target.value)}
                            className="bg-[#f8f9ff] border border-gray-250 p-2 rounded text-xs outline-none focus:border-primary text-[#101c29]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-[#af101a] hover:bg-[#900e15] text-white py-2 font-bold rounded text-xs cursor-pointer transition-colors"
                        >
                          Registrar Pacote
                        </button>
                      </form>

                      {/* Packages logs list */}
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {getFilteredEncomendas().map(e => (
                          <div key={e.id} className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-[#101c29]">{e.destinatario} ({e.unidade})</p>
                              <p className="text-[10px] text-secondary">Aviso: <strong className="text-secondary">{e.descricao}</strong> • Transp: {e.transportadora}</p>
                              <p className="text-[9px] text-[#5c6e84] mt-0.5">Recebido em: {e.dataRegistro}</p>
                            </div>
                            <div className="text-right">
                              {e.status === 'Aguardando' ? (
                                <button
                                  onClick={() => {
                                    setEncomendas(prev => prev.map(item => {
                                      if (item.id === e.id) {
                                        return { ...item, status: 'Retirada', dataRetirada: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').substring(0, 5) };
                                      }
                                      return item;
                                    }));
                                    addAuditLog('EDITAR', 'encomendas', `Registrado retirada do pacote pelo assinante ${e.destinatario}.`);
                                    onShowNotification('Retirado!', `Registro de entrega arquivado.`);
                                  }}
                                  className="bg-green-600 text-white text-[10px] font-extrabold px-2 py-1 rounded hover:bg-green-700 uppercase cursor-pointer"
                                >
                                  Retirar
                                </button>
                              ) : (
                                <div className="text-right">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-200 px-2 py-0.5 rounded">Entregue</span>
                                  <p className="text-[8px] text-gray-400 mt-0.5 font-semibold">Retirada: {e.dataRetirada}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: EXP-RELATORIOS */}
              {activeTab === 'admin_relatorios' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h4 className="text-base font-bold text-[#101c29] font-display">Exportação de Relatórios Gerenciais</h4>
                    <p className="text-xs text-secondary mt-0.5">Baixe arquivos certificados e balancetes regulamentares auditados pela equipe jurídica Facilities.</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <h5 className="text-sm font-bold text-[#101c29] font-display">Relatórios Disponíveis no Servidor</h5>
                    <div className="divide-y divide-gray-150">
                      {[
                        { titulo: 'Relação Geral de Condomínio & Inadimplência', extensao: '.xlsx', tamanho: '4.2 MB', data: '04/06/2026' },
                        { titulo: 'Prestação de Contas Consolidadas da Administração', extensao: '.pdf', tamanho: '12.8 MB', data: '28/05/2026' },
                        { titulo: 'Histórico Completo de Auditoria RLS e Sandbox', extensao: '.csv', tamanho: '950 KB', data: 'Hoje' },
                        { titulo: 'Planilha Consolidada de Ocorrências Técnicas de Elevadores', extensao: '.xlsx', tamanho: '1.4 MB', data: '01/06/2026' },
                      ].map((rel, idx) => (
                        <div key={idx} className="py-4 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-primary mr-2">{rel.extensao}</span>
                            <span className="font-bold text-[#101c29] font-sans">{rel.titulo}</span>
                            <p className="text-[10px] text-secondary mt-1 font-semibold">Tamanho: {rel.tamanho} • Revisado em: {rel.data}</p>
                          </div>
                          <button
                            onClick={() => {
                              addAuditLog('EXPORTAR', 'relatorios', `Compilado e exportado relatório ${rel.titulo} em formato ${rel.extensao}`);
                              onShowNotification('Compilado!', `Arquivo ${rel.extensao} gerado pelo servidor e baixado.`);
                            }}
                            className="bg-gray-100 hover:bg-gray-200 border border-gray-250 p-2 font-bold rounded-lg cursor-pointer text-[#101c29]"
                          >
                            Exportar Relatório
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: DYNAMIC AUDIT LOGS */}
              {activeTab === 'admin_auditoria' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h4 className="text-base font-bold text-[#101c29] font-display">Livro de Registro de Auditoria (Audit Logs)</h4>
                    <p className="text-xs text-secondary mt-0.5 font-sans">Rastreamento de solicitações e mudanças cadastrais para regulamentação LGPD e governança.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                      <h5 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">Histórico de Alterações</h5>
                      <button
                        onClick={() => {
                          if (confirm('Deseja limpar todos os registros de auditoria locais?')) {
                            setAuditLogs([]);
                            onShowNotification('Sucesso', 'Logs de auditoria redefinidos.');
                          }
                        }}
                        className="text-[10px] text-primary font-bold uppercase hover:underline cursor-pointer"
                      >
                        Limpar Logs
                      </button>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto w-full">
                      <div className="divide-y divide-gray-100">
                        {getFilteredAuditLogs().length === 0 ? (
                          <div className="p-8 text-center text-xs text-secondary">Nenhum evento registrado.</div>
                        ) : (
                          getFilteredAuditLogs().map(log => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 text-xs">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                    log.acao === 'CRIAR' ? 'bg-green-50 text-green-700' : log.acao === 'EXCLUIR' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    {log.acao}
                                  </span>
                                  <span className="font-semibold text-secondary lowercase">em {log.entidade}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono">{log.data} às {log.hora}</span>
                              </div>
                              <p className="font-bold text-[#101c29] mt-1.5 leading-relaxed">{log.detalhes}</p>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#556980]">
                                <span className="font-bold">Efetuado por:</span> {log.quem}
                                <span className="bg-[#f0f2f5] px-1.5 py-0.5 rounded font-mono text-[9px] font-bold text-gray-500">{log.perfil}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: CONFIGURAÇÕES RLS */}
              {activeTab === 'admin_config' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h4 className="text-base font-bold text-[#101c29] font-display">Row Level Security (RLS) & Supabase Sandbox Settings</h4>
                    <p className="text-xs text-secondary mt-0.5">Parâmetros de configuração e blindagem lógica garantida pelas policies do banco de dados.</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <h5 className="text-sm font-bold text-[#101c29] font-display border-b border-gray-100 pb-2">Estado de Segurança Governamental</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4.5 bg-green-50/50 border border-green-200 rounded-xl space-y-2">
                        <h6 className="font-bold text-emerald-850 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          POLICIES ATIVAS (SELECT)
                        </h6>
                        <p className="text-[#3b5944] leading-relaxed">Cada usuário autenticado visualiza apenas as faturas e reservas associadas exclusivamente ao seu código de apartamento cadastrado e autenticado.</p>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded inline-block font-mono font-bold">Status: Enforced Supabase</span>
                      </div>

                      <div className="p-4.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                        <h6 className="font-bold text-blue-900 flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                          POLICIES DE ESCRITA (INSERT/UPDATE)
                        </h6>
                        <p className="text-blue-900 leading-relaxed font-sans">Vedada a modificação de logs de auditoria ou extrato financeiro. Apenas o perfil 'Administrador' possui permissão de escrita direta nestas tabelas.</p>
                        <span className="text-[10px] text-blue-800 bg-blue-100/50 px-2 py-0.5 rounded inline-block font-mono font-bold">Status: Enforced Supabase</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4.5 rounded-xl border border-gray-250 space-y-2.5 text-xs text-secondary">
                      <h6 className="font-bold text-[#101c29]">Verificação Técnica de Chaves Autênticas</h6>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span>Database Engine:</span>
                        <strong className="text-[#101c29]">PostgreSQL 16 (Supabase Host)</strong>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span>RLS Schema Token:</span>
                        <strong className="text-primary font-mono text-[10px]">jwt_claim_credential_facilities_admin_true</strong>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>SSL Connection Security:</span>
                        <strong className="text-green-650 font-bold font-mono">TLS_AES_256_GCM_SHA384 (Ativo)</strong>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-4 border-t border-gray-150 text-left">
                      <div className="flex justify-between items-center">
                        <h6 className="font-bold text-[#101c29] text-xs uppercase flex items-center gap-1.5">
                          <span className="p-1 bg-primary/10 text-primary rounded-md">🛡️</span>
                          Script SQL das Políticas de RLS (Supabase)
                        </h6>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`-- 1. Helper function to check condomínio bound profile validation
CREATE OR REPLACE FUNCTION public.user_belongs_to_condominio(condo_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
    user_p UUID;
    user_t TEXT;
    user_c UUID;
BEGIN
    SELECT id, tipo, condominio_id INTO user_p, user_t, user_c FROM public.perfis WHERE auth_user_id = auth.uid() LIMIT 1;
    
    -- Admins/colab have global access
    IF user_t IN ('administrador', 'colaborador') THEN
        RETURN TRUE;
    END IF;

    -- Se o perfil possui vínculo direto com o condomínio correspondente
    IF user_c IS NOT NULL AND user_c = condo_id THEN
        RETURN TRUE;
    END IF;

    -- Moradores/Conselheiros/Proprietarios linked to the condo
    RETURN EXISTS (
        SELECT 1 
        FROM public.unidades u
        JOIN public.blocos b ON u.bloco_id = b.id
        LEFT JOIN public.moradores m ON m.unidade_id = u.id
        LEFT JOIN public.proprietarios p ON p.unidade_id = u.id
        WHERE b.condominio_id = condo_id
          AND (m.perfil_id = user_p OR p.perfil_id = user_p)
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Applying Row Level Security to Condominium bound tables
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso apenas ao condomínio vinculado para os perfis autorizados"
    ON public.condominios FOR SELECT
    USING (public.user_belongs_to_condominio(id));

-- 3. Block read policy validation
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso apenas aos blocos do condomínio vinculado"
    ON public.blocos FOR SELECT
    USING (public.user_belongs_to_condominio(condominio_id));

-- 4. Unit read policy validation
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso às unidades do condomínio ao qual possui relacionamento"
    ON public.unidades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.blocos b
            WHERE b.id = bloco_id AND public.user_belongs_to_condominio(b.condominio_id)
        )
    );`);
                            onShowNotification('Copiado!', 'Script SQL das políticas RLS copiado para a área de transferência.');
                          }}
                          className="bg-primary hover:bg-[#900e15] text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 select-none"
                        >
                          Copiar SQL RLS
                        </button>
                      </div>
                      <p className="text-[11px] text-secondary leading-relaxed font-sans">
                        Execute o script abaixo no editor SQL do Supabase. Ele cria a função de verificação que busca os privilégios na tabela <code className="font-mono bg-gray-100 text-[#101c29] px-1 py-0.5 rounded text-[10px]">perfis</code> e valida se o id de condomínio é correspondente antes de liberar os registros das tabelas.
                      </p>
                      <pre className="bg-[#0f172a] text-[#38bdf8] p-4.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 border border-slate-800 leading-relaxed text-left">
{`-- SQL DE ATIVAÇÃO DE RLS COM VALIDAÇÃO DE PERFIL
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso apenas ao condomínio vinculado"
    ON public.condominios FOR SELECT
    USING (public.user_belongs_to_condominio(id));

-- Valida o perfil correspondente na tabela 'perfis'
CREATE OR REPLACE FUNCTION public.user_belongs_to_condominio(condo_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
    user_p UUID;
    user_t TEXT;
    user_c UUID;
BEGIN
    -- Valida perfil buscando pelo auth_user_id autenticado
    SELECT id, tipo, condominio_id INTO user_p, user_t, user_c 
    FROM public.perfis 
    WHERE auth_user_id = auth.uid() LIMIT 1;
    
    -- Admins e colaboradores têm liberação automática
    IF user_t IN ('administrador', 'colaborador') THEN
        RETURN TRUE;
    END IF;

    -- Se o perfil possui vínculo direto de condomínio cadastrado
    IF user_c IS NOT NULL AND user_c = condo_id THEN
        RETURN TRUE;
    END IF;

    -- Fallback: verifica se há unidades vinculadas com moradores/proprietários
    RETURN EXISTS (
        SELECT 1 FROM public.unidades u
        JOIN public.blocos b ON u.bloco_id = b.id
        LEFT JOIN public.moradores m ON m.unidade_id = u.id
        LEFT JOIN public.proprietarios p ON p.unidade_id = u.id
        WHERE b.condominio_id = condo_id
          AND (m.perfil_id = user_p OR p.perfil_id = user_p)
    );
END;
$$ LANGUAGE plpgsql;`}
                      </pre>
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
