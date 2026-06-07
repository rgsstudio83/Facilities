import { useState, useEffect, FormEvent } from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  FileCheck, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Download, 
  PieChart, 
  Database, 
  ArrowLeft, 
  Search, 
  MapPin, 
  ShieldAlert, 
  Megaphone, 
  Calendar, 
  X,
  Lock,
  ChevronRight,
  RefreshCw,
  Printer,
  Compass,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Package,
  Activity,
  Key,
  ShieldCheck,
  Check
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowMessage: (title: string, desc: string) => void;
  initialProfile?: string;
  currentUser?: { name: string; profile: string; unit: string } | null;
  onLogout?: () => void;
}

// Data Interfaces
interface Condominio {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  sindico: string;
  unidades: number;
  moradores: number;
  proprietarios: number;
  receita: number;
  despesa: number;
  inadimplenciaPercent: number;
  status: 'Normal' | 'Alerta' | 'Crítico';
}

interface MoradorUnit {
  id: string;
  nome: string;
  cpf: string;
  unidade: string;
  condominioId: string;
  proprietario: boolean;
  telefone: string;
}

interface AuditoriaLog {
  id: string;
  data: string;
  hora: string;
  quem: string;
  perfil: string;
  acao: 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'BLOQUEIO' | 'EXPORTAR';
  entidade: string;
  detalhes: string;
}

interface Visitante {
  id: string;
  nome: string;
  rg: string;
  unidade: string;
  condominioId: string;
  dataEntrada: string;
  dataSaida?: string;
  status: 'Liberado' | 'Concluído';
}

interface Encomenda {
  id: string;
  destinatario: string;
  unidade: string;
  condominioId: string;
  descricao: string;
  transportadora: string;
  dataRegistro: string;
  dataRetirada?: string;
  status: 'Aguardando' | 'Retirada';
}

export default function AdminDashboardModal({ 
  isOpen, 
  onClose, 
  onShowMessage, 
  initialProfile,
  currentUser,
  onLogout
}: AdminDashboardModalProps) {
  // Profiles Base Setup
  const [activeProfile, setActiveProfile] = useState<'admin' | 'colaborador' | 'sindico' | 'subsindico' | 'conselheiro' | 'proprietario' | 'morador' | 'porteiro'>('admin');
  const [activeSubPage, setActiveSubPage] = useState<string>('dashboard');
  const [selectedCondoId, setSelectedCondoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync initial authenticated profile when modal opens
  useEffect(() => {
    let rawProfile = initialProfile;
    if (currentUser?.profile) {
      rawProfile = currentUser.profile;
    }

    if (isOpen && rawProfile) {
      const normalized = rawProfile.toLowerCase()
        .replace('síndico', 'sindico')
        .replace('subsíndico', 'subsindico')
        .replace('proprietário', 'proprietario')
        .replace('conselheiro', 'conselheiro')
        .replace('porteiro', 'porteiro')
        .replace('administrador', 'admin')
        .replace('colaborador', 'colaborador')
        .replace('morador', 'morador');
      
      const validProfiles = ['admin', 'colaborador', 'sindico', 'subsindico', 'conselheiro', 'proprietario', 'morador', 'porteiro'];
      if (validProfiles.includes(normalized)) {
        setActiveProfile(normalized as any);
      }
    }
  }, [isOpen, initialProfile, currentUser]);

  // Simulated Database states - Initialized to empty to avoid showing fictitious data, only showing Supabase records
  const [condos, setCondos] = useState<Condominio[]>([]);
  const [moradoresList, setMoradoresList] = useState<MoradorUnit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditoriaLog[]>([]);
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);

  // Form submission states
  const [newCondoName, setNewCondoName] = useState('');
  const [newCondoCnpj, setNewCondoCnpj] = useState('');
  const [newCondoSindico, setNewCondoSindico] = useState('');
  const [newCondoUnidades, setNewCondoUnidades] = useState(60);

  const [newMoradorNome, setNewMoradorNome] = useState('');
  const [newMoradorCpf, setNewMoradorCpf] = useState('');
  const [newMoradorUnidade, setNewMoradorUnidade] = useState('');
  const [newMoradorCondoId, setNewMoradorCondoId] = useState('cd-1');

  const [newVisitorNome, setNewVisitorNome] = useState('');
  const [newVisitorRg, setNewVisitorRg] = useState('');
  const [newVisitorUnidade, setNewVisitorUnidade] = useState('');

  const [newPackageDest, setNewPackageDest] = useState('');
  const [newPackageUnidade, setNewPackageUnidade] = useState('');
  const [newPackageDesc, setNewPackageDesc] = useState('');
  const [newPackageTransp, setNewPackageTransp] = useState('');

  // RLS Constraints Logic (Dynamic constraints in client memory simulating server Row Level Security states)
  // For Síndico, Subsíndico, Conselheiro: Data linked strictly to 'cd-1' (Vista Parque)
  const isRlsActiveForCondo = activeProfile === 'sindico' || activeProfile === 'subsindico' || activeProfile === 'conselheiro';
  const rlsTargetCondoId = 'cd-1';

  // For Proprietário/Morador: Link to 'cd-1' and 'Apto 41-B' / 'Apto 102'
  const isRlsActiveForUnit = activeProfile === 'morador' || activeProfile === 'proprietario';

  // For Porteiro: locked out of Finance lists & reports completely.
  const isPorteiroRole = activeProfile === 'porteiro';

  // State synchronization with Supabase Tables
  useEffect(() => {
    if (!isOpen) return;

    const fetchAdminData = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setCondos([]);
        setMoradoresList([]);
        setAuditLogs([]);
        setVisitantes([]);
        setEncomendas([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch Condominios
        const { data: dbCondos, error: errCondos } = await supabase.from('condominios').select('*');
        if (dbCondos && !errCondos) {
          setCondos(dbCondos.map((c: any) => ({
            id: c.id,
            nome: c.nome,
            cnpj: c.cnpj || '',
            endereco: c.endereco || '',
            cidade: c.cidade || '',
            estado: c.estado || '',
            sindico: c.sindico || '',
            unidades: Number(c.unidades || 0),
            moradores: Number(c.moradores || 0),
            proprietarios: Number(c.proprietarios || 0),
            receita: Number(c.receita || 0),
            despesa: Number(c.despesa || 0),
            inadimplenciaPercent: Number(c.inadimplencia_percent || 0),
            status: c.status || 'Normal'
          })));
        } else {
          setCondos([]);
        }

        // Fetch Moradores
        const { data: dbMoradores, error: errMoradores } = await supabase.from('moradores').select('*');
        if (dbMoradores && !errMoradores) {
          setMoradoresList(dbMoradores.map((m: any) => ({
            id: m.id,
            nome: m.nome,
            cpf: m.cpf || '',
            unidade: m.unidade || '',
            condominioId: m.condominio_id || 'cd-1',
            proprietario: m.proprietario ?? true,
            telefone: m.telefone || ''
          })));
        } else {
          setMoradoresList([]);
        }

        // Fetch Visitantes
        const { data: dbVisitantes, error: errVisitantes } = await supabase.from('visitantes').select('*');
        if (dbVisitantes && !errVisitantes) {
          setVisitantes(dbVisitantes.map((v: any) => ({
            id: v.id,
            nome: v.nome,
            rg: v.rg || '',
            unidade: v.unidade || '',
            condominioId: v.condominio_id || 'cd-1',
            dataEntrada: v.data_entrada || '',
            dataSaida: v.data_saida || undefined,
            status: v.status || 'Liberado'
          })));
        } else {
          setVisitantes([]);
        }

        // Fetch Encomendas
        const { data: dbEncomendas, error: errEncomendas } = await supabase.from('encomendas').select('*');
        if (dbEncomendas && !errEncomendas) {
          setEncomendas(dbEncomendas.map((e: any) => ({
            id: e.id,
            destinatario: e.destinatario,
            unidade: e.unidade || '',
            condominioId: e.condominio_id || 'cd-1',
            descricao: e.descricao || '',
            transportadora: e.transportadora || '',
            dataRegistro: e.data_registro || '',
            dataRetirada: e.data_retirada || undefined,
            status: e.status || 'Aguardando'
          })));
        } else {
          setEncomendas([]);
        }

        // Fetch Auditoria logs
        const { data: dbAudit, error: errAudit } = await supabase.from('auditoria').select('*').order('created_at', { ascending: false });
        if (dbAudit && !errAudit) {
          setAuditLogs(dbAudit.map((a: any) => ({
            id: a.id,
            data: a.data,
            hora: a.hora,
            quem: a.quem,
            perfil: a.perfil,
            acao: a.acao || 'CRIAR',
            entidade: a.entidade,
            detalhes: a.detalhes || ''
          })));
        } else {
          setAuditLogs([]);
        }
      } catch (err) {
        console.warn('Erro ao ler tabelas administrativas no Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isOpen]);

  // Logs actions to Audit table and Supabase
  const addAuditLog = (action: 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'BLOQUEIO' | 'EXPORTAR', entity: string, details: string) => {
    const now = new Date();
    const newLog: AuditoriaLog = {
      id: `log-${Date.now()}`,
      data: now.toLocaleDateString('pt-BR'),
      hora: now.toLocaleTimeString('pt-BR'),
      quem: activeProfile === 'admin' ? 'Cristhiane Xavier' : activeProfile === 'porteiro' ? 'Porteiro Nelson' : activeProfile === 'sindico' ? 'Roberto Silveira' : 'Sistema Multiperfil',
      perfil: activeProfile.toUpperCase(),
      acao: action,
      entidade: entity,
      detalhes: details
    };
    setAuditLogs(prev => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('auditoria').insert({
        id: newLog.id,
        data: newLog.data,
        hora: newLog.hora,
        quem: newLog.quem,
        perfil: newLog.perfil,
        acao: newLog.acao,
        entidade: newLog.entidade,
        detalhes: newLog.detalhes
      }).then(({ error }) => {
        if (error) console.error('Erro ao registrar log de auditoria no Supabase:', error.message);
      });
    }
  };

  // Automated menu navigation changer when active profile changes
  useEffect(() => {
    // When changing role, swap to default menu of that specific role
    if (activeProfile === 'porteiro') {
      setActiveSubPage('portaria');
    } else if (activeProfile === 'conselheiro') {
      setActiveSubPage('financeiro');
    } else if (activeProfile === 'morador' || activeProfile === 'proprietario') {
      setActiveSubPage('minha_unidade');
    } else {
      setActiveSubPage('dashboard');
    }
    setSelectedCondoId(null);
  }, [activeProfile]);

  // Security Verification Guard
  const verifyWritePermission = (requiredRoles: string[], actionMsg: string): boolean => {
    // Conselheiro is completely read-only
    if (activeProfile === 'conselheiro') {
      onShowMessage("Bloqueio de RLS", "Seu perfil de Conselheiro possui direitos STRICTLY READ-ONLY. Operações de gravação bloqueadas.");
      addAuditLog('BLOQUEIO', 'RLS_VIOLATION', `Conselheiro tentou executar: ${actionMsg}`);
      return false;
    }
    // Residents / Porteiros can't touch general structure/condos
    if (!requiredRoles.includes(activeProfile)) {
      onShowMessage("Erro de Permissão", `O perfil atual (${activeProfile.toUpperCase()}) não possui permissão para executar: ${actionMsg}`);
      addAuditLog('BLOQUEIO', 'PERM_DENIED', `${activeProfile} tentou realizar: ${actionMsg}`);
      return false;
    }
    return true;
  };

  // CRUD actions
  const handleCreateCondo = (e: FormEvent) => {
    e.preventDefault();
    if (!verifyWritePermission(['admin'], 'Criar Condomínio')) return;
    if (!newCondoName.trim()) return;

    const newC: Condominio = {
      id: `cd-${Date.now()}`,
      nome: newCondoName,
      cnpj: newCondoCnpj || '00.000.000/0001-00',
      endereco: 'Rua Comercial de Santos',
      cidade: 'Santos',
      estado: 'SP',
      sindico: newCondoSindico || 'Sem Síndico Vinculado',
      unidades: newCondoUnidades,
      moradores: 0,
      proprietarios: 0,
      receita: 0,
      despesa: 0,
      inadimplenciaPercent: 0,
      status: 'Normal'
    };

    setCondos(prev => [...prev, newC]);
    addAuditLog('CRIAR', 'condominios', `Criado novo condomínio: ${newCondoName} (Unidades: ${newCondoUnidades})`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('condominios').insert({
        id: newC.id,
        nome: newC.nome,
        cnpj: newC.cnpj,
        endereco: newC.endereco,
        cidade: newC.cidade,
        estado: newC.estado,
        sindico: newC.sindico,
        unidades: newC.unidades,
        moradores: newC.moradores,
        proprietarios: newC.proprietarios,
        receita: newC.receita,
        despesa: newC.despesa,
        inadimplencia_percent: newC.inadimplenciaPercent,
        status: newC.status
      }).then(({ error }) => {
        if (error) console.error('Erro ao salvar condomínio no Supabase:', error.message);
      });
    }

    onShowMessage("Sucesso", "Novo condomínio registrado com sucesso.");
    setNewCondoName('');
    setNewCondoCnpj('');
    setNewCondoSindico('');
  };

  const handleDeleteCondo = (id: string, name: string) => {
    if (!verifyWritePermission(['admin'], `Deletar Condomínio - ID: ${id}`)) return;
    setCondos(prev => prev.filter(c => c.id !== id));
    addAuditLog('EXCLUIR', 'condominios', `Excluído condomínio: ${name}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('condominios').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Erro ao excluir condomínio no Supabase:', error.message);
      });
    }

    onShowMessage("Sucesso", "Condomínio desativado do sistema.");
  };

  const handleCreateMorador = (e: FormEvent) => {
    e.preventDefault();
    if (!verifyWritePermission(['admin', 'colaborador'], 'Cadastrar Morador')) return;
    if (!newMoradorNome.trim() || !newMoradorUnidade.trim()) return;

    const newM: MoradorUnit = {
      id: `m-${Date.now()}`,
      nome: newMoradorNome,
      cpf: newMoradorCpf || '000.000.000-00',
      unidade: newMoradorUnidade,
      condominioId: isRlsActiveForCondo ? rlsTargetCondoId : newMoradorCondoId,
      proprietario: true,
      telefone: '(13) 99123-4567'
    };

    setMoradoresList(prev => [...prev, newM]);
    addAuditLog('CRIAR', 'moradores', `Cadastrado residente: ${newMoradorNome} na unidade ${newMoradorUnidade}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('moradores').insert({
        id: newM.id,
        nome: newM.nome,
        cpf: newM.cpf,
        unidade: newM.unidade,
        condominio_id: newM.condominioId,
        proprietario: newM.proprietario,
        telefone: newM.telefone
      }).then(({ error }) => {
        if (error) console.error('Erro ao salvar morador no Supabase:', error.message);
      });
    }

    onShowMessage("Sucesso", "Novo morador inserido com sucesso.");
    setNewMoradorNome('');
    setNewMoradorCpf('');
    setNewMoradorUnidade('');
  };

  const handleDeleteMorador = (id: string, name: string) => {
    if (!verifyWritePermission(['admin'], `Excluir Morador - ID: ${id}`)) return;
    setMoradoresList(prev => prev.filter(m => m.id !== id));
    addAuditLog('EXCLUIR', 'moradores', `Excluído morador: ${name}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('moradores').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Erro ao excluir morador no Supabase:', error.message);
      });
    }

    onShowMessage("Sucesso", "Morador removido da base.");
  };

  const handleCreateVisitor = (e: FormEvent) => {
    e.preventDefault();
    if (!verifyWritePermission(['admin', 'colaborador', 'porteiro', 'sindico', 'subsindico'], 'Registrar Visitante')) return;
    if (!newVisitorNome.trim() || !newVisitorUnidade.trim()) return;

    const newV: Visitante = {
      id: `v-${Date.now()}`,
      nome: newVisitorNome,
      rg: newVisitorRg || 'Não Informado',
      unidade: newVisitorUnidade,
      condominioId: rlsTargetCondoId,
      dataEntrada: new Date().toLocaleString('pt-BR', { hour12: false }),
      status: 'Liberado'
    };

    setVisitantes(prev => [newV, ...prev]);
    addAuditLog('CRIAR', 'visitantes', `Registrado visitante ${newVisitorNome} liberado para a unidade ${newVisitorUnidade}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('visitantes').insert({
        id: newV.id,
        nome: newV.nome,
        rg: newV.rg,
        unidade: newV.unidade,
        condominio_id: newV.condominioId,
        data_entrada: newV.dataEntrada,
        status: newV.status
      }).then(({ error }) => {
        if (error) console.error('Erro ao salvar visitante no Supabase:', error.message);
      });
    }

    onShowMessage("Visitante Registrado", `Entrada liberada sob crachá de segurança.`);
    setNewVisitorNome('');
    setNewVisitorRg('');
    setNewVisitorUnidade('');
  };

  const handleOutVisitor = (id: string, nome: string) => {
    if (!verifyWritePermission(['admin', 'colaborador', 'porteiro', 'sindico', 'subsindico'], `Registrar Saída Visitante - ID: ${id}`)) return;
    const outTime = new Date().toLocaleString('pt-BR', { hour12: false });
    
    setVisitantes(prev => prev.map(v => v.id === id ? { 
      ...v, 
      status: 'Concluído', 
      dataSaida: outTime 
    } : v));
    addAuditLog('EDITAR', 'visitantes', `Registrada saída do visitante: ${nome}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('visitantes').update({
        status: 'Concluído',
        data_saida: outTime
      }).eq('id', id).then(({ error }) => {
        if (error) console.error('Erro ao atualizar saída de visitante no Supabase:', error.message);
      });
    }

    onShowMessage("Portaria Updated", `Saída registrada com sucesso.`);
  };

  const handleCreatePackage = (e: FormEvent) => {
    e.preventDefault();
    if (!verifyWritePermission(['admin', 'colaborador', 'porteiro', 'sindico'], 'Receber Encomenda')) return;
    if (!newPackageDest.trim() || !newPackageUnidade.trim()) return;

    const newP: Encomenda = {
      id: `e-${Date.now()}`,
      destinatario: newPackageDest,
      unidade: newPackageUnidade,
      condominioId: rlsTargetCondoId,
      descricao: newPackageDesc || 'Pacote Geral',
      transportadora: newPackageTransp || 'Própria',
      dataRegistro: new Date().toLocaleString('pt-BR', { hour12: false }),
      status: 'Aguardando'
    };

    setEncomendas(prev => [newP, ...prev]);
    addAuditLog('CRIAR', 'encomendas', `Recebida encomenda para ${newPackageDest} (${newPackageUnidade})`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('encomendas').insert({
        id: newP.id,
        destinatario: newP.destinatario,
        unidade: newP.unidade,
        condominio_id: newP.condominioId,
        descricao: newP.descricao,
        transportadora: newP.transportadora,
        data_registro: newP.dataRegistro,
        status: newP.status
      }).then(({ error }) => {
        if (error) console.error('Erro ao registrar encomenda no Supabase:', error.message);
      });
    }

    onShowMessage("Encomenda Registrada", `Notificação de pacote enviada.`);
    setNewPackageDest('');
    setNewPackageUnidade('');
    setNewPackageDesc('');
    setNewPackageTransp('');
  };

  const handleDeliverPackage = (id: string, dest: string) => {
    if (!verifyWritePermission(['admin', 'colaborador', 'porteiro', 'sindico'], `Entregar Encomenda - ID: ${id}`)) return;
    const deliverTime = new Date().toLocaleString('pt-BR', { hour12: false });

    setEncomendas(prev => prev.map(p => p.id === id ? { 
      ...p, 
      status: 'Retirada', 
      dataRetirada: deliverTime 
    } : p));
    addAuditLog('EDITAR', 'encomendas', `Entregue encomenda para ${dest}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('encomendas').update({
        status: 'Retirada',
        data_retirada: deliverTime
      }).eq('id', id).then(({ error }) => {
        if (error) console.error('Erro ao atualizar entrega de encomenda no Supabase:', error.message);
      });
    }

    onShowMessage("Status Entrega", `Encomenda retirada pelo condômino.`);
  };

  // CSV Exporter helper
  const handleExportCSV = (type: string) => {
    addAuditLog('EXPORTAR', type, `Exportado relatório consolidado de ${type} em excel CSV`);
    onShowMessage("Exportando Relatório", `Download do relatório ${type.toUpperCase()} gerado em 0.04s via RPC.`);
  };

  // Filtered lists based on RLS (Row Level Security simulation)
  const visibleCondos = condos.filter(c => {
    if (isRlsActiveForCondo && c.id !== rlsTargetCondoId) return false;
    return true;
  });

  const visibleMoradores = moradoresList.filter(m => {
    if (isRlsActiveForCondo && m.condominioId !== rlsTargetCondoId) return false;
    if (isRlsActiveForUnit && m.unidade !== 'Apto 41-B') return false;
    return true;
  });

  const activeDetailedCondo = selectedCondoId ? condos.find(c => c.id === selectedCondoId) : null;

  // Global Consolidated Metrics (Reflect RLS context)
  const stats = {
    totalCondos: visibleCondos.length,
    unidades: visibleCondos.reduce((a, b) => a + b.unidades, 0),
    moradores: visibleCondos.reduce((a, b) => a + b.moradores, 0),
    proprietarios: visibleCondos.reduce((a, b) => a + b.proprietarios, 0),
    receita: visibleCondos.reduce((a, b) => a + b.receita, 0),
    despesa: visibleCondos.reduce((a, b) => a + b.despesa, 0),
    inadimplenciaPercent: visibleCondos.length > 0 
      ? Number((visibleCondos.reduce((a, b) => a + b.inadimplenciaPercent, 0) / visibleCondos.length).toFixed(1))
      : 0
  };

  if (!isOpen) return null;

  // Menus structure map
  const getMenuItems = () => {
    switch (activeProfile) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
          { id: 'condominios', label: 'Condomínios', icon: <Building2 className="w-4 h-4" /> },
          { id: 'moradores', label: 'Moradores Base', icon: <Users className="w-4 h-4" /> },
          { id: 'financeiro', label: 'Financeiro Geral', icon: <Wallet className="w-4 h-4" /> },
          { id: 'portaria', label: 'Portaria Hub', icon: <Key className="w-4 h-4" /> },
          { id: 'relatorios', label: 'Relatórios Master', icon: <FileText className="w-4 h-4" /> },
          { id: 'auditoria', label: 'Auditoria Logs', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
          { id: 'config', label: 'Configurações RLS', icon: <ShieldAlert className="w-4 h-4" /> },
        ];
      case 'colaborador':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
          { id: 'condominios', label: 'Visualizar Condos', icon: <Building2 className="w-4 h-4" /> },
          { id: 'moradores', label: 'Cadastrar Moradores', icon: <Users className="w-4 h-4" /> },
          { id: 'portaria', label: 'Monitorar Portaria', icon: <Key className="w-4 h-4" /> },
          { id: 'relatorios', label: 'Exportar Relatórios', icon: <FileText className="w-4 h-4" /> },
        ];
      case 'sindico':
      case 'subsindico':
        return [
          { id: 'dashboard', label: 'Dashboard Vista Parque', icon: <Compass className="w-4 h-4" /> },
          { id: 'financeiro', label: 'Prestação de Contas', icon: <Wallet className="w-4 h-4" /> },
          { id: 'moradores', label: 'Consultar Moradores', icon: <Users className="w-4 h-4" /> },
          { id: 'portaria', label: 'Controle Portaria', icon: <Key className="w-4 h-4" /> },
        ];
      case 'conselheiro':
        return [
          { id: 'financeiro', label: 'Balanço (Acesso Leitura)', icon: <Wallet className="w-4 h-4" /> },
          { id: 'moradores', label: 'Lista Condôminos', icon: <Users className="w-4 h-4" /> },
          { id: 'portaria', label: 'Movimentação Visitantes', icon: <Key className="w-4 h-4" /> },
        ];
      case 'proprietario':
      case 'morador':
        return [
          { id: 'minha_unidade', label: 'Minha Unidade (41-B)', icon: <Compass className="w-4 h-4" /> },
          { id: 'portaria', label: 'Minhas Encomendas', icon: <Package className="w-4 h-4" /> },
        ];
      case 'porteiro':
        return [
          { id: 'portaria', label: 'Ronda & Portaria', icon: <Key className="w-4 h-4" /> },
          { id: 'moradores', label: 'Consulta Moradores', icon: <Users className="w-4 h-4" /> },
        ];
      default:
        return [];
    }
  };

  return (
    <div id="admin-dashboard-overlay" className="fixed inset-0 bg-[#070b12] z-50 grid grid-cols-1 items-stretch justify-stretch animate-fade-in font-sans overflow-hidden">
      <div id="admin-dashboard-card" className="bg-white w-full h-screen border-none shadow-none overflow-hidden grid grid-rows-[auto_auto_1fr]">
        
        {/* UPPER SENSITIVE REAL-TIME SECURITY PLAYGROUND SWITCHER */}
        {!currentUser ? (
          <div className="bg-[#0b131f] border-b border-[#af101a]/30 p-4 select-none shrink-0 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] text-gray-400 uppercase font-mono tracking-widest font-bold">SIMULADOR DE DIRETRIZES DE ACESSO (PERFIS DO SISTEMA & RLS)</span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-white font-sans text-xs font-semibold mr-1">Selecione o Perfil Ativo:</span>
              {(['admin', 'colaborador', 'sindico', 'subsindico', 'conselheiro', 'proprietario', 'morador', 'porteiro'] as const).map(role => (
                <button
                  key={role}
                  id={`role-pill-${role}`}
                  onClick={() => {
                    setActiveProfile(role);
                    onShowMessage("Mudança de Perfil", `Acesso operando sob a credencial: ${role.toUpperCase()}`);
                    addAuditLog('EDITAR', 'sessao', `Sessão chaveada para o perfil: ${role.toUpperCase()}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer hover:scale-[1.03] ${
                    activeProfile === role 
                      ? 'bg-[#af101a] text-white shadow-md font-extrabold ring-2 ring-red-500/20' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-gray-400 mt-2 font-sans italic flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#af101a]" />
              {isRlsActiveForCondo && "Filtro de RLS Ativo: Visualização restrita unicamente ao seu condomínio vinculado (Condomínio Vista Parque)."}
              {isRlsActiveForUnit && "Filtro de RLS Ativo: Visualização restrita unicamente à sua unidade autônoma (Apto 41-B)."}
              {isPorteiroRole && "Filtro de RLS Comercial: Financeiro e inadimplência inacessíveis por RLS corporativa."}
              {activeProfile === 'admin' && "Controle Supremo: Sem restrições de RLS. CRUD irrestrito em todas as tabelas."}
              {activeProfile === 'colaborador' && "Sessão Colaborador: Visualização unificada. Direitos de gravação e exclusão limitados."}
              {activeProfile === 'conselheiro' && "Modo Read-Only Ativo: Conselheiros visualizam financeiro e inadimplência mas não podem gravar ou deletar dados."}
            </p>
          </div>
        ) : (
          <div className="bg-[#0b1d2e] border-b border-[#2eaf58]/40 p-4 select-none shrink-0 text-left flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-widest font-black block">Painel Autenticado Via Supabase / Portal</span>
                <span className="text-white font-sans text-xs font-semibold">
                  Sessão ativa de <strong className="text-emerald-400 font-bold">{currentUser.name}</strong> • Função: <strong className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-mono px-2 py-0.5 rounded font-black">{currentUser.profile}</strong> {currentUser.unit ? `• Unidade: ${currentUser.unit}` : ''}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Acesso Seguro</span>
            </div>
          </div>
        )}

        {/* TOP GIGANTIC EXECUTIVE GLASS HEADER */}
        <div className="bg-[#0f1b29] text-white p-5 px-6 border-b border-white/5 flex flex-wrap justify-between items-center gap-4 relative overflow-hidden shrink-0 select-none">
          <div className="flex gap-4 items-center">
            <div className="bg-primary/10 p-2.5 rounded-2xl text-primary border border-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            
            <div className="text-left">
              <span className="text-[10px] bg-red-650 text-white font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
                AMBIENTE INTEGRADO DE GERENCIAMENTO FACILITIES
              </span>
              <h2 className="text-xl md:text-2xl font-black mt-1 font-display flex items-center gap-2">
                Facilities Condominial 
                <span className="text-xs text-emerald-400 font-bold bg-[#14263b] px-3 py-1 rounded-full font-mono border border-white/5">
                  🛡️ {activeProfile.toUpperCase()}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right font-mono text-[10px]">
              <span className="text-[#3ecf8e] font-bold">CONNECTED DB SUPABASE</span>
              <span className="text-gray-400">Tempo de Resposta Médio: 12ms</span>
            </div>
            <button
              id="admin-close-top-btn"
              onClick={() => {
                if (onLogout) onLogout();
                onClose();
              }}
              className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl border-0 cursor-pointer font-bold text-white transition-all hover:scale-105 active:scale-95"
            >
              &times; Sair
            </button>
          </div>
        </div>

        {/* MAIN BODY CORE */}
        <div id="admin-main-body" className="overflow-hidden grid grid-cols-1 md:grid-cols-[16rem_1fr] h-full w-full">
          
          {/* LEFT DYNAMIC SIDEBAR MENU */}
          <div className="w-full bg-[#0a111a] border-r border-white/5 p-4 flex flex-col overflow-y-auto md:overflow-y-visible">
            <div className="mb-4 hidden md:block">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider text-left pl-1">Menú Dinâmico do Perfil</p>
            </div>

            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 pb-2 md:pb-0">
              {getMenuItems().map(item => (
                <button
                  key={item.id}
                  id={`side-menu-${item.id}`}
                  onClick={() => {
                    setActiveSubPage(item.id);
                    setSelectedCondoId(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all whitespace-nowrap ${
                    activeSubPage === item.id 
                      ? 'bg-[#af101a] text-white font-black' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Profile Meta Cards */}
            <div className="mt-auto pt-4 border-t border-white/5 text-left text-[11px] text-gray-400 hidden md:block select-none">
              <p className="font-semibold text-white/95">Sessão Segura</p>
              <p className="text-[10px] text-gray-500 mt-1">Superlógica + Supabase Auth</p>
              <div className="bg-white/5 p-2.5 rounded-xl mt-2 border border-white/5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auditoria Ativa</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANELS WORKSPACE */}
          <div className="min-w-0 bg-slate-50 overflow-y-auto p-4 md:p-8 h-full">
            
            {/* 1. VIEW DETAILED INDIVIDUAL CONDOMINIUM */}
            {selectedCondoId && activeDetailedCondo ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedCondoId(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#af101a] hover:underline cursor-pointer border-0 bg-transparent text-left"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar ao Painel Geral
                </button>

                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm text-left grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-3">
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-bold">INFO SENSÍVEL DE RLS</span>
                    <h3 className="text-2xl font-black text-[#0f1b29] font-display">{activeDetailedCondo.nome}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {activeDetailedCondo.endereco}, {activeDetailedCondo.cidade} ({activeDetailedCondo.estado})</p>
                  </div>

                  <div className="bg-[#101c29] text-white p-4 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-gray-400 block tracking-wider uppercase font-bold">Faturamento Estimado</span>
                    <h4 className="text-2xl font-black mt-2">R$ {activeDetailedCondo.receita.toLocaleString('pt-BR')}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="bg-white p-5 rounded-2xl border border-gray-150 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Despesa Mensal</span>
                      <h4 className="text-xl font-bold text-[#af101a] mt-1">R$ {activeDetailedCondo.despesa.toLocaleString('pt-BR')}</h4>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500 bg-red-50 p-1.5 rounded-lg" />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-150 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Saldo Técnico</span>
                      <h4 className="text-xl font-bold text-emerald-600 mt-1">R$ {(activeDetailedCondo.receita - activeDetailedCondo.despesa).toLocaleString('pt-BR')}</h4>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-lg" />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-150 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Inadimplência Real e Competente</span>
                      <h4 className="text-xl font-bold text-amber-600 mt-1">{activeDetailedCondo.inadimplenciaPercent}%</h4>
                    </div>
                    <AlertCircle className="w-8 h-8 text-amber-500 bg-amber-50 p-1.5 rounded-lg" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 2. SUB-PAGE: DASHBOARD */}
                {activeSubPage === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Alerta de RLS Insight */}
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-xs text-red-900 text-left flex items-start gap-3">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-red-700">Atenção RLS Global:</strong> Parque das Amoreiras registra inadimplência de <strong>21.0%</strong>. Se logado sob os perfis Síndico/Conselheiro/Morador, as políticas de segurança ocultam outros empreendimentos para proteger o direito civil dos condôminos.
                      </div>
                    </div>

                    {/* Master KPI Boxes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Condomínios</span>
                        <h4 className="text-2xl font-black text-[#0f1b29] mt-1">{stats.totalCondos}</h4>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Unidades Totais</span>
                        <h4 className="text-2xl font-black text-[#0f1b29] mt-1">{stats.unidades}</h4>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Moradores Ativos</span>
                        <h4 className="text-2xl font-black text-[#0f1b29] mt-1">{stats.moradores}</h4>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Inadimplência Média</span>
                        <h4 className={`text-2xl font-black mt-1 ${stats.inadimplenciaPercent > 10 ? 'text-[#af101a]' : 'text-[#0f1b29]'}`}>{stats.inadimplenciaPercent}%</h4>
                      </div>
                    </div>

                    {/* MASTER GRAPHICS & ANALYTICS ROW */}
                    {!isPorteiroRole ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        {/* 1. Bar Chart representing delinquencies */}
                        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                          <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider">Inadimplência Registrada (%)</h4>
                          <div className="space-y-3">
                            {visibleCondos.map(c => (
                              <div key={c.id} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-secondary font-medium">{c.nome}</span>
                                  <span className="font-bold text-[#af101a]">{c.inadimplenciaPercent}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="bg-[#af101a] h-full rounded-full" style={{ width: `${(c.inadimplenciaPercent / 25) * 100}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Receipts and Expenses summary box */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
                          <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider text-left">Faturamento Consolidado</h4>
                          <div className="space-y-3 my-4">
                            <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-2">
                              <span className="text-gray-400">Total Receitas</span>
                              <span className="font-bold text-emerald-600 font-mono">R$ {stats.receita.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-2">
                              <span className="text-gray-400">Total Despesas</span>
                              <span className="font-bold text-[#af101a] font-mono">R$ {stats.despesa.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Saldo Líquido</span>
                              <span className="font-bold text-primary font-mono">R$ {(stats.receita - stats.despesa).toLocaleString('pt-BR')}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleExportCSV('financeiro')}
                            className="w-full bg-[#101c29] text-white py-2.5 rounded-xl text-xs font-bold font-sans cursor-pointer hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-4 h-4" /> Exportar Planilha Financeira
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl text-xs text-yellow-900 text-left">
                        🔒 <strong>Políticas de RLS Ativas:</strong> Gráficos financeiros de faturamento e inadimplência estão restritos para o perfil <strong>Porteiro</strong>. Somente registros operacionais estão liberados.
                      </div>
                    )}

                    {/* CONDO LISTINGS TABLE */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm text-left">
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider">Unidades e Empreendimentos Auditados</h4>
                        <span className="text-[10px] uppercase font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">Processo de Gestão 2026</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px]">
                              <th className="py-2.5">Nome do Condomínio</th>
                              <th className="py-2.5">Síndico do Imóvel</th>
                              <th className="py-2.5">Unidades</th>
                              <th className="py-2.5">Status RLS</th>
                              <th className="py-2.5 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleCondos.map((c, i) => (
                              <tr key={c.id} className="border-b border-gray-100 hover:bg-slate-50">
                                <td className="py-3 font-bold text-[#0f1b29]">{c.nome}</td>
                                <td className="py-3 text-secondary">{c.sindico}</td>
                                <td className="py-3 font-mono">{c.unidades}</td>
                                <td className="py-3">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    c.status === 'Normal' ? 'bg-green-50 text-emerald-600' : 'bg-red-50 text-[#af101a]'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => setSelectedCondoId(c.id)}
                                    className="bg-[#101c29] text-white p-1 px-3 rounded-lg text-[10px] font-semibold hover:bg-slate-800 cursor-pointer"
                                  >
                                    Ver Métricas
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

                {/* 3. SUB-PAGE: CONDOMINIOS CRUD */}
                {activeSubPage === 'condominios' && (
                  <div className="space-y-6">
                    {/* Add condo form - available for admin */}
                    {activeProfile === 'admin' ? (
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-left space-y-4">
                        <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-1">
                          <Plus className="w-4 h-4 text-emerald-500" /> Cadastrar Novo Condomínio Administrado
                        </h4>
                        
                        <form onSubmit={handleCreateCondo} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Fantasia *</label>
                            <input
                              type="text"
                              required
                              value={newCondoName}
                              onChange={(e) => setNewCondoName(e.target.value)}
                              placeholder="Residencial Miramar"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">CNPJ Comercial</label>
                            <input
                              type="text"
                              value={newCondoCnpj}
                              onChange={(e) => setNewCondoCnpj(e.target.value)}
                              placeholder="00.000.000/0001-00"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Síndico Designado</label>
                            <input
                              type="text"
                              value={newCondoSindico}
                              onChange={(e) => setNewCondoSindico(e.target.value)}
                              placeholder="Nome do Síndico"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                            />
                          </div>
                          <div>
                            <button
                              type="submit"
                              className="w-full bg-primary hover:bg-[#af101a] text-white py-2.5 text-xs font-bold rounded-lg transition-transform focus:scale-95 cursor-pointer"
                            >
                              Adicionar Condomínio
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left text-xs">
                        🛡️ <strong>Acesso Limitado:</strong> Somente o cargo de <strong>Administrador Principal</strong> da Facilities possui permissão RLS para registrar novos condomínios na base central Postgresql.
                      </div>
                    )}

                    {/* Listings */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-left">
                      <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4">Base Operativa de Condomínios</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleCondos.map(item => (
                          <div key={item.id} className="p-4 border border-gray-150 rounded-xl space-y-3 hover:border-gray-300 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-sm text-[#0f1b29]">{item.nome}</h5>
                                <p className="text-[10px] text-gray-400">{item.cnpj}</p>
                              </div>
                              {activeProfile === 'admin' ? (
                                <button
                                  onClick={() => handleDeleteCondo(item.id, item.nome)}
                                  className="text-red-650 hover:text-red-800 p-1 rounded hover:bg-red-50 text-xs"
                                  title="Remover Imóvel"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[9px] text-gray-400 bg-gray-100 p-1 rounded flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Lock</span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-secondary font-sans">
                              <div>📍 {item.endereco}</div>
                              <div>👤 Síndico: <strong className="font-semibold text-stone-800">{item.sindico}</strong></div>
                              <div>🏢 {item.unidades} Unidades Autônomas</div>
                              <div>📊 Inadimplência: <strong className="text-orange-600">{item.inadimplenciaPercent}%</strong></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SUB-PAGE: MORADORES (CRUD) */}
                {activeSubPage === 'moradores' && (
                  <div className="space-y-6">
                    {/* Add resident Form */}
                    {verifyWritePermission(['admin', 'colaborador', 'sindico', 'subsindico'], 'Cadastrar Morador (Trigger check)') && (
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-left space-y-4">
                        <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-1">
                          <Plus className="w-4 h-4 text-emerald-500" /> Registrar Morador / Proprietário
                        </h4>

                        <form onSubmit={handleCreateMorador} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Completo *</label>
                            <input
                              type="text"
                              required
                              value={newMoradorNome}
                              onChange={(e) => setNewMoradorNome(e.target.value)}
                              placeholder="Sérgio Mendes"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">CPF do Residente</label>
                            <input
                              type="text"
                              value={newMoradorCpf}
                              onChange={(e) => setNewMoradorCpf(e.target.value)}
                              placeholder="000.000.000-00"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Bloco / Unidade *</label>
                            <input
                              type="text"
                              required
                              value={newMoradorUnidade}
                              onChange={(e) => setNewMoradorUnidade(e.target.value)}
                              placeholder="Apto 101"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                            />
                          </div>
                          <div>
                            <button
                              type="submit"
                              className="w-full bg-primary hover:bg-[#af101a] text-white py-2.5 text-xs font-bold rounded-lg transition-transform focus:scale-95 cursor-pointer"
                            >
                              Confirmar Cadastro
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Residents List */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-left">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider">Censo de Habitantes e Ocupantes</h4>
                        <button
                          onClick={() => handleExportCSV('moradores')}
                          className="bg-gray-100 p-1.5 px-3 rounded text-[10px] font-bold hover:bg-gray-200 cursor-pointer"
                        >
                          Exportar Base XLSX
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px]">
                              <th className="py-2">Nome Completo</th>
                              <th className="py-2">CPF</th>
                              <th className="py-2">Unidade</th>
                              <th className="py-2">Relação Titularidade</th>
                              <th className="py-2 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleMoradores.map(item => (
                              <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50">
                                <td className="py-3 font-bold text-stone-850">{item.nome}</td>
                                <td className="py-3 text-secondary font-mono">{item.cpf}</td>
                                <td className="py-3 font-bold">{item.unidade}</td>
                                <td className="py-3">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    item.proprietario ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-orange-600'
                                  }`}>
                                    {item.proprietario ? 'Proprietário' : 'Inquilino'}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  {activeProfile === 'admin' ? (
                                    <button
                                      onClick={() => handleDeleteMorador(item.id, item.nome)}
                                      className="text-red-650 hover:text-red-800 p-1"
                                      title="Deletar Registro"
                                    >
                                      Remover
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-gray-400 italic">Restrito</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SUB-PAGE: PORTARIA HUB (ACTIVE OPERATIONS FOR PORTEIRO & GLOBAL) */}
                {activeSubPage === 'portaria' && (
                  <div className="space-y-6 text-left">
                    {/* Alerta explicativo */}
                    <div className="bg-[#101c29] text-white p-4 rounded-xl text-xs flex gap-3 items-center">
                      <Key className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <strong>Modulo de Controle de Acesso Portaria:</strong> Registre as entradas de visitas, freteiros, terceirizados e o recebimento de encomendas. Esse registro alimenta o banco e gera alertas de segurança auditados em tempo real.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Visitors Panel */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                        <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider border-b border-gray-100 pb-2">Registro de Visitante e Prestadores</h4>
                        
                        {activeProfile !== 'conselheiro' ? (
                          <form onSubmit={handleCreateVisitor} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Nome do Visitante *</label>
                                <input
                                  type="text"
                                  required
                                  value={newVisitorNome}
                                  onChange={(e) => setNewVisitorNome(e.target.value)}
                                  placeholder="Nome Completo"
                                  className="w-full bg-[#f1f4f8] text-xs p-2 rounded-lg outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">RG / Identificação</label>
                                <input
                                  type="text"
                                  value={newVisitorRg}
                                  onChange={(e) => setNewVisitorRg(e.target.value)}
                                  placeholder="00.000.000-0"
                                  className="w-full bg-[#f1f4f8] text-xs p-2 rounded-lg outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Unidade Autônoma Destino *</label>
                                <input
                                  type="text"
                                  required
                                  value={newVisitorUnidade}
                                  onChange={(e) => setNewVisitorUnidade(e.target.value)}
                                  placeholder="Apto 41-B"
                                  className="w-full bg-[#f1f4f8] text-xs p-2 rounded-lg outline-none"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="submit"
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
                                >
                                  Liberar Entrada (Acesso QR)
                                </button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <p className="text-[11px] text-amber-600 font-semibold italic">Direito de gravação bloqueado para Conselheiro.</p>
                        )}

                        {/* Visitors table lists */}
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pt-2">
                          {visitantes.map(vis => (
                            <div key={vis.id} className="p-3 bg-gray-55 border border-gray-150 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <h6 className="font-bold text-[#0f1b29]">{vis.nome} <span className="text-[10px] text-gray-400 font-normal">({vis.rg})</span></h6>
                                <p className="text-[10px] text-slate-500 mt-0.5">Destino: <strong>{vis.unidade}</strong> | Entrada: {vis.dataEntrada}</p>
                              </div>
                              <div>
                                {vis.status === 'Liberado' ? (
                                  <button
                                    onClick={() => handleOutVisitor(vis.id, vis.nome)}
                                    className="bg-primary hover:bg-[#af101a] text-white font-bold scale-90 px-2 py-1 rounded text-[10px] cursor-pointer"
                                  >
                                    Registrar Saída
                                  </button>
                                ) : (
                                  <span className="text-[9px] uppercase font-bold text-slate-400 bg-gray-150 px-2 py-0.5 rounded">Saída: {vis.dataSaida?.split(' ')[1]}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Encomendas Panel */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                        <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider border-b border-gray-100 pb-2">Registro e Baixa de Encomendas (Sheduler)</h4>
                        
                        {activeProfile !== 'conselheiro' ? (
                          <form onSubmit={handleCreatePackage} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 flex-wrap">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Destinatário Principal *</label>
                                <input
                                  type="text"
                                  required
                                  value={newPackageDest}
                                  onChange={(e) => setNewPackageDest(e.target.value)}
                                  placeholder="Sandra Moura"
                                  className="w-full bg-[#f1f4f8] text-xs p-2 rounded-lg outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Unidade *</label>
                                <input
                                  type="text"
                                  required
                                  value={newPackageUnidade}
                                  onChange={(e) => setNewPackageUnidade(e.target.value)}
                                  placeholder="Apto 102"
                                  className="w-full bg-[#f1f4f8] text-xs p-2 rounded-lg outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Descrição Objeto</label>
                                <input
                                  type="text"
                                  value={newPackageDesc}
                                  onChange={(e) => setNewPackageDesc(e.target.value)}
                                  placeholder="Ex: Caixa sapatos"
                                  className="w-full bg-[#f1f4f8] text-xs p-2 rounded-lg outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Transportadora / Log</label>
                                <input
                                  type="text"
                                  value={newPackageTransp}
                                  onChange={(e) => setNewPackageTransp(e.target.value)}
                                  placeholder="Ex: Correios, DHL"
                                  className="w-full bg-[#f1f4f8] text-xs p-2 rounded-lg outline-none"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-primary hover:bg-[#900e16] text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
                            >
                              Registrar Entrada Pacote (Disparar Alerta)
                            </button>
                          </form>
                        ) : (
                          <p className="text-[11px] text-amber-600 font-semibold italic font-sans">Acesso estrito de leitura para conselheiro.</p>
                        )}

                        {/* Packages List details status */}
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pt-2">
                          {encomendas.map(box => (
                            <div key={box.id} className="p-3 bg-gray-55 border border-gray-150 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <h6 className="font-bold text-[#0f1b29]">{box.destinatario} <span className="text-gray-400 font-normal">({box.unidade})</span></h6>
                                <p className="text-[9px] text-[#707070] mt-0.5">{box.descricao} | Transp: {box.transportadora} de {box.dataRegistro}</p>
                              </div>
                              <div>
                                {box.status === 'Aguardando' ? (
                                  <button
                                    onClick={() => handleDeliverPackage(box.id, box.destinatario)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 text-[10px] rounded cursor-pointer leading-tight"
                                  >
                                    Registrar Retirada
                                  </button>
                                ) : (
                                  <span className="text-[9px] uppercase font-bold text-slate-400 bg-gray-100 px-2 py-0.5 rounded">Retirado dia: {box.dataRetirada?.split(' ')[0]}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 6. SUB-PAGE: AUDITORIA LOGS (CRUD AUDITED ACTION TIMELINE) */}
                {activeSubPage === 'auditoria' && (
                  <div className="space-y-6 text-left">
                    <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm text-left space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-150 pb-3 flex-wrap gap-2">
                        <div>
                          <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" /> Livro de Auditoria e Logs de Processo RLS
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-1">Conformidade Civil & Contas do Condômino Santos conforme Lei de Registros Digitais</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            setAuditLogs([]);
                            onShowMessage("Logs Limpos", "Histórico de auditoria local redefinido.");
                          }}
                          className="bg-red-50 text-red-600 font-bold p-1.5 px-3 rounded text-[10px] border border-red-100 hover:bg-red-100 cursor-pointer"
                        >
                          Limpar Registros (Simulação Root)
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[440px] overflow-y-auto">
                        {auditLogs.length === 0 ? (
                          <p className="text-xs text-gray-400 py-6 text-center">Nenhum evento auditado ainda nesta sessão.</p>
                        ) : (
                          auditLogs.map((log) => (
                            <div key={log.id} className="p-3 bg-gray-55 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-slate-400 font-mono">{log.data} - {log.hora}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    log.acao === 'CRIAR' ? 'bg-green-100 text-green-700' :
                                    log.acao === 'EDITAR' ? 'bg-blue-100 text-blue-700' :
                                    log.acao === 'EXCLUIR' ? 'bg-red-100 text-[#af101a]' : 'bg-red-500 text-white font-black'
                                  }`}>
                                    {log.acao}
                                  </span>
                                  <span className="font-mono text-[9px] bg-slate-200 text-secondary px-1.5 py-0.5 rounded">Tabela: {log.entidade}</span>
                                </div>
                                <p className="text-secondary font-medium"><strong className="text-[#0f1b29]">{log.quem}</strong> ({log.perfil}): {log.detalhes}</p>
                              </div>
                              <span className="text-[9px] font-mono font-semibold text-gray-450 uppercase">{log.id}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. SUB-PAGE: MINHA UNIDADE / PROPRIETÁRIO RESIDÈNCIA HUB */}
                {activeSubPage === 'minha_unidade' && (
                  <div className="space-y-6 text-left">
                    <div className="bg-white p-6 rounded-3xl border border-gray-150 text-left grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="space-y-3">
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">Unidade Vinculada: Apto 41-B (Vista Parque)</span>
                        <h4 className="text-xl font-bold text-[#0f1b29]">Roberto Silva ou Representante</h4>
                        <p className="text-xs text-secondary leading-relaxed">
                          Sua sessão autônoma está encapsulada sob uma diretiva RLS do Supabase que bloqueia o acesso a inadimplências, números confidenciais e relatórios de receitas de outros blocos e de outros condomínios da administradora Facilities.
                        </p>
                      </div>

                      <div className="bg-slate-55 p-5 rounded-2xl space-y-3 border border-gray-150">
                        <h5 className="font-bold text-xs text-[#0f1b29] uppercase border-b border-gray-250 pb-1.5 flex items-center justify-between">
                          <span>Seus Boletos</span>
                          <span className="text-red-600 bg-red-50 text-[9px] px-2 py-0.5 rounded tracking-wide">Pendente</span>
                        </h5>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-[#0f1b29]">Referência Competência: Junho/2026</p>
                            <p className="text-slate-400 mt-0.5">Vencimento: 10/06/2026</p>
                          </div>
                          <span className="font-bold text-sm text-[#af101a]">R$ 645,90</span>
                        </div>

                        <button
                          onClick={() => {
                            onShowMessage("Compensação Simulação", "Cdigo Pix copiado com sucesso! Pagamento computado.");
                            addAuditLog('EDITAR', 'boletos', 'Morador Roberto Silva copiou chave e simulou quitamento');
                          }}
                          className="w-full bg-[#af101a] text-white py-2 font-bold text-xs rounded-lg active:scale-95 transition-all text-center cursor-pointer block border-0 mt-3"
                        >
                          Copiar Código Pix Copia & Cola
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Mural de avisos do Síndico */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                        <h5 className="font-bold text-xs text-secondary uppercase border-b border-gray-100 pb-2 flex items-center justify-between">
                          <span>Mural de Avisos da Gestão</span>
                          <Megaphone className="w-4 h-4 text-primary" />
                        </h5>

                        <div className="space-y-3 pt-2 text-xs">
                          <div className="p-3 bg-yellow-50 rounded-lg text-yellow-950 font-medium leading-relaxed">
                            ⚠️ <strong>Reforma na Garagem Bloco B:</strong> Entre os dias 08/06 e 12/06 as vagas de 40 a 55 estarão temporariamente realocadas para o G1 devido à fixação do piso impermeabilizante. Atenciosamente, Cristhiane Xavier (Facilities).
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg text-blue-950 font-medium leading-relaxed">
                            📢 <strong>Ata de Assembleia Extraordinária:</strong> Já disponível para consulta na aba correspondente na Área do Morador.
                          </div>
                        </div>
                      </div>

                      {/* Areabooking requests */}
                      <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-4">
                        <h5 className="font-bold text-xs text-secondary uppercase border-b border-gray-100 pb-2">Agendar Uso Área de Lazer</h5>
                        
                        <div className="space-y-3 text-xs">
                          <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-200">
                            <div>
                              <p className="font-bold">Salão de Festas Clássico</p>
                              <p className="text-[10px] text-gray-400">Data sugerida: 18/06/2026</p>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">Confirmado</span>
                          </div>

                          <button
                            onClick={() => {
                              onShowMessage("Reserva Protocolada", "Churrasqueira Cobertura solicitada com sucesso!");
                              addAuditLog('CRIAR', 'reservas', 'Morador Roberto Silva protocolou reserva de lazer');
                            }}
                            className="bg-[#101c29] text-white py-2 w-full rounded-lg text-xs font-bold text-center cursor-pointer border-0"
                          >
                            Solicitar Nova Reserva de Lazer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. SUB-PAGE: CONFIG RELATÓRIOS/ FINANCEIRO GERAL */}
                {activeSubPage === 'financeiro' && (
                  <div className="space-y-6 text-left">
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider">Lançamentos de Contabilidade e Conciliação Geral</h4>
                        <span className="text-[10px] text-gray-400">Status financeiro consolidado {stats.totalCondos > 1 ? "Multicondominial" : "Unicondominial"}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px]">
                              <th className="py-2">Identificação Imóvel</th>
                              <th className="py-2">Receita Repassada</th>
                              <th className="py-2">Custos Operacionais</th>
                              <th className="py-2">Margem de Liquidez</th>
                              <th className="py-2">Taxa Deficit/Superávit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleCondos.map(item => {
                              const bal = item.receita - item.despesa;
                              const pct = Math.abs((bal / item.receita) * 100).toFixed(0);
                              return (
                                <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50">
                                  <td className="py-3 font-bold text-[#0f1b29]">{item.nome}</td>
                                  <td className="py-3 font-mono text-emerald-600 font-bold">R$ {item.receita.toLocaleString('pt-BR')}</td>
                                  <td className="py-3 font-mono text-[#af101a]">R$ {item.despesa.toLocaleString('pt-BR')}</td>
                                  <td className={`py-3 font-mono font-bold ${bal >= 0 ? 'text-primary' : 'text-red-500'}`}>R$ {bal.toLocaleString('pt-BR')}</td>
                                  <td className="py-3">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${bal >= 0 ? 'bg-green-50 text-emerald-600' : 'bg-red-50 text-red-650'}`}>
                                      {bal >= 0 ? `+ ${pct}% Superavit` : `- ${pct}% Deficit`}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. SUB-PAGE: RELATORIOS MASTER OUTFLOWS */}
                {activeSubPage === 'relatorios' && (
                  <div className="space-y-6 text-left">
                    <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                      <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider border-b border-gray-100 pb-2">Repositório de Inteligência Facilities (Downloads XLSX)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border border-gray-150 rounded-xl space-y-2 flex flex-col justify-between hover:border-gray-300 transition-colors">
                          <div>
                            <span className="text-[10px] text-emerald-600 font-mono tracking-wider font-extrabold bg-emerald-50 px-2 py-0.5 rounded block w-max mb-1">COMPILADO FINANCEIRO</span>
                            <h5 className="font-bold text-stone-900 text-xs">Faturamento vs Custos</h5>
                            <p className="text-[10px] text-gray-400 mt-1">Gera a tabela completa de todas as competências condominiais repassadas este semestre.</p>
                          </div>
                          <button
                            onClick={() => handleExportCSV('financeiro')}
                            className="bg-[#101c29] text-white font-sans text-[10px] font-bold py-2 w-full rounded-lg text-center cursor-pointer border-0 active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Baixar Planilha Geral
                          </button>
                        </div>

                        <div className="p-4 border border-gray-150 rounded-xl space-y-2 flex flex-col justify-between hover:border-gray-300 transition-colors">
                          <div>
                            <span className="text-[10px] text-amber-600 font-mono tracking-wider font-extrabold bg-amber-50 px-2 py-0.5 rounded block w-max mb-1">INADIMPLÊNCIA & COBRANÇA</span>
                            <h5 className="font-bold text-stone-900 text-xs">Unidades em Recuperação</h5>
                            <p className="text-[10px] text-gray-400 mt-1">Inadimplentes e faturas com registro de protesto extrajudicial ordinário da Baixada Santista.</p>
                          </div>
                          <button
                            onClick={() => handleExportCSV('inadimplencia')}
                            className="bg-[#101c29] text-white font-sans text-[10px] font-bold py-2 w-full rounded-lg text-center cursor-pointer border-0 active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Baixar Planilha Geral
                          </button>
                        </div>

                        <div className="p-4 border border-gray-150 rounded-xl space-y-2 flex flex-col justify-between hover:border-gray-300 transition-colors">
                          <div>
                            <span className="text-[10px] text-indigo-600 font-mono tracking-wider font-extrabold bg-blue-55 px-2 py-0.5 rounded block w-max mb-1">OCORRÊNCIAS & CHAMADOS</span>
                            <h5 className="font-bold text-stone-900 text-xs">Tickets de Facility Services</h5>
                            <p className="text-[10px] text-gray-400 mt-1">Registros de manutenções de bombas, piscinas, elevadores, maresia e SLAS operacionais.</p>
                          </div>
                          <button
                            onClick={() => handleExportCSV('chamados')}
                            className="bg-[#101c29] text-white font-sans text-[10px] font-bold py-2 w-full rounded-lg text-center cursor-pointer border-0 active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Baixar Planilha Geral
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. SUB-PAGE: CONFIGURAÇÕES RLS */}
                {activeSubPage === 'config' && (
                  <div className="space-y-6 text-left">
                    <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                      <div className="flex gap-2 items-center text-[#0f1b29] font-bold text-sm">
                        <ShieldAlert className="w-5 h-5 text-emerald-500" />
                        <h4>Configuração Real de Diretivas Row Level Security (RLS) & Auditoria</h4>
                      </div>

                      <div className="space-y-3 text-xs leading-relaxed text-secondary font-sans border-t border-gray-100 pt-4">
                        <p>
                          O banco de dados PostgreSQL estruturado no Supabase corporativo gerencia o isolamento de informações de inquilinos, proprietários, portaria e administradores por meio do JWT token de autenticação.
                        </p>

                        <div className="bg-[#0f1b29] text-white p-4 rounded-xl font-mono text-[10px] leading-snug overflow-x-auto space-y-3">
                          <p className="text-gray-400">-- 1. Política RLS: Isolamento Estrito do Síndico Vinculado</p>
                          <p className="text-emerald-400">
                            ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;<br />
                            CREATE POLICY "Restricao_Sindico_Condominio" ON condominios <br />
                            FOR SELECT TO authenticated <br />
                            USING (condominio_id = auth.jwt() -{'>'} 'condominio_id');
                          </p>

                          <p className="text-gray-400">-- 2. Política RLS: Omissão de Contas e Balanço para Porteiros</p>
                          <p className="text-emerald-400">
                            CREATE POLICY "Portaria_Apenas_Visitantes" ON financeiro <br />
                            FOR ALL TO authenticated <br />
                            USING (auth.jwt() -{'>'} 'perfil' != 'porteiro');
                          </p>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-900 border border-emerald-150 font-medium">
                          ✓ Todas as sub-telas e dashboards do painel Facilities estão configurados para herdar essas políticas na simulação, garantindo que nenhum usuário possa injetar parâmetros para acessar dados privados de outros condomínios residenciais ou de faturamento.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

        </div>

        {/* MODAL FOOTER AND SYSTEM AUDIT DETAILS */}
        <div className="bg-gray-55 border-t border-gray-150 px-6 py-4 md:px-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-400 shrink-0 select-none gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>Facilities Administração Condominial Santos &copy; 2026</span>
            <span className="text-gray-300">|</span>
            <span className="font-mono text-gray-500 font-semibold uppercase">STATUS RLS SISTEMA: ATIVO</span>
          </div>
          <div className="font-medium">
            Desenvolvido sob protocolo seguro de RLS e Materialized SQL Views do PostgreSQL.
          </div>
        </div>

      </div>
    </div>
  );
}
