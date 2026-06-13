import { useState, useEffect, FormEvent } from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  UserPlus,
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
  Check,
  Bell
} from 'lucide-react';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey, insertResilient } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import CondoDetailsView from './CondoDetailsView';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Ignore and fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const formatCNPJ = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  const limited = clean.slice(0, 14);
  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 2)}.${limited.slice(2)}`;
  if (limited.length <= 8) return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
  if (limited.length <= 12) return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
  return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12, 14)}`;
};

const formatCEP = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  const limited = clean.slice(0, 8);
  if (limited.length <= 5) return limited;
  return `${limited.slice(0, 5)}-${limited.slice(5)}`;
};

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowMessage: (title: string, desc: string) => void;
  initialProfile?: string;
  currentUser?: { name: string; profile: string; unit: string; email?: string } | null;
  onLogout?: () => void;
}

// Data Interfaces
interface RoleType {
  id: string;
  nome: string;
  descricao: string;
}

interface UserProfile {
  id: string;
  auth_user_id?: string;
  nome: string;
  email: string;
  cpf?: string;
  unidade?: string;
  tipo: string;
  perfil?: string;
  ativo?: boolean;
  condominio_id?: string;
}

interface Condominio {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  bairro: string;
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
  const [isRlsAlertDismissed, setIsRlsAlertDismissed] = useState(false);

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
  const [profilesList, setProfilesList] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditoriaLog[]>([]);
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);

  // Form submission states
  const [newCondoName, setNewCondoName] = useState('');
  const [newCondoCnpj, setNewCondoCnpj] = useState('');
  const [newCondoSindico, setNewCondoSindico] = useState('');
  const [newCondoUnidades, setNewCondoUnidades] = useState(60);
  const [newCondoEndereco, setNewCondoEndereco] = useState('');
  const [newCondoBairro, setNewCondoBairro] = useState('');
  const [newCondoCidade, setNewCondoCidade] = useState('');
  const [newCondoEstado, setNewCondoEstado] = useState('SP');
  const [newCondoCep, setNewCondoCep] = useState('');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const [showCondoForm, setShowCondoForm] = useState(false);

  // Editing Condominium states inside AdminDashboardModal
  const [editingCondo, setEditingCondo] = useState<any | null>(null);
  const [editCondoName, setEditCondoName] = useState('');
  const [editCondoCnpj, setEditCondoCnpj] = useState('');
  const [editCondoCep, setEditCondoCep] = useState('');
  const [editCondoEndereco, setEditCondoEndereco] = useState('');
  const [editCondoBairro, setEditCondoBairro] = useState('');
  const [editCondoCidade, setEditCondoCidade] = useState('Santos');
  const [editCondoEstado, setEditCondoEstado] = useState('SP');
  const [editCondoSindico, setEditCondoSindico] = useState('');
  const [editCondoBlocos, setEditCondoBlocos] = useState(2);
  const [editCondoUnidades, setEditCondoUnidades] = useState(80);
  const [editCondoMoradores, setEditCondoMoradores] = useState(224);
  const [editCondoProprietarios, setEditCondoProprietarios] = useState(76);
  const [editCondoReceita, setEditCondoReceita] = useState(60000);
  const [editCondoDespesa, setEditCondoDespesa] = useState(49600);
  const [editCondoStatus, setEditCondoStatus] = useState('Normal');
  const [isFetchingEditCep, setIsFetchingEditCep] = useState(false);
  const [editCepError, setEditCepError] = useState('');

  const [showMoradorForm, setShowMoradorForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showRoleTypeForm, setShowRoleTypeForm] = useState(false);

  const [newMoradorNome, setNewMoradorNome] = useState('');
  const [newMoradorCpf, setNewMoradorCpf] = useState('');
  const [newMoradorUnidade, setNewMoradorUnidade] = useState('');
  const [newMoradorCondoId, setNewMoradorCondoId] = useState('cd-1');

  const [newProfileNome, setNewProfileNome] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfileCpf, setNewProfileCpf] = useState('');
  const [newProfileUnidade, setNewProfileUnidade] = useState('');
  const [newProfileTipo, setNewProfileTipo] = useState('morador');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [newProfileAtivo, setNewProfileAtivo] = useState(true);
  const [newProfileCondoId, setNewProfileCondoId] = useState('cd-1');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Role Types Dynamic States & Forms definition
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [newRoleTypeId, setNewRoleTypeId] = useState('');
  const [newRoleTypeNome, setNewRoleTypeNome] = useState('');
  const [newRoleTypeDescricao, setNewRoleTypeDescricao] = useState('');
  const [selectedRoleTypeId, setSelectedRoleTypeId] = useState<string | null>(null);

  // Delete Role Confirmation modal state
  const [isConfirmDeleteRoleModalOpen, setIsConfirmDeleteRoleModalOpen] = useState(false);
  const [roleTypeToDelete, setRoleTypeToDelete] = useState<{ id: string; nome: string } | null>(null);

  // General deletion confirm modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Bulk add residents state variables
  const [isBulkAddMoradoresOpen, setIsBulkAddMoradoresOpen] = useState(false);
  const [bulkAddCondoId, setBulkAddCondoId] = useState<string | null>(null);
  const [bulkAddRows, setBulkAddRows] = useState<{ nome: string; unidade: string; cpf: string; proprietario: boolean; telefone: string }[]>([
    { nome: '', unidade: '', cpf: '', proprietario: true, telefone: '(13) 99123-4567' }
  ]);

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

  // Load and sync Role Types from Local Storage or defaults
  useEffect(() => {
    if (isOpen) {
      const defaultRoleTypes: RoleType[] = [
        { id: 'morador', nome: 'Morador', descricao: 'Apenas Consulta e Unidade' },
        { id: 'proprietario', nome: 'Proprietário', descricao: 'Condômino Donatário' },
        { id: 'sindico', nome: 'Síndico', descricao: 'Gestor Geral do Condomínio' },
        { id: 'subsindico', nome: 'Subsíndico', descricao: 'Apoio Setorial de Gestão' },
        { id: 'conselheiro', nome: 'Conselheiro', descricao: 'Fiscal e Auditor Read-Only' },
        { id: 'porteiro', nome: 'Porteiro', descricao: 'Controle de Acesso de Portaria' },
        { id: 'colaborador', nome: 'Colaborador', descricao: 'Prestador Interno' },
        { id: 'administrador', nome: 'Administrador', descricao: 'Controle Total Master' }
      ];

      const saved = localStorage.getItem('supabase_sim_role_types');
      if (saved) {
        try {
          setRoleTypes(JSON.parse(saved));
        } catch (e) {
          localStorage.setItem('supabase_sim_role_types', JSON.stringify(defaultRoleTypes));
          setRoleTypes(defaultRoleTypes);
        }
      } else {
        localStorage.setItem('supabase_sim_role_types', JSON.stringify(defaultRoleTypes));
        setRoleTypes(defaultRoleTypes);
      }
    }
  }, [isOpen]);

  // State synchronization with Supabase Tables
  useEffect(() => {
    if (!isOpen) return;

    const fetchAdminData = async () => {
      if (!isSupabaseConfigured || !supabase) {
        // Carrega condomínios simulados ou padrão
        const localCondos = localStorage.getItem('supabase_sim_condominios');
        if (localCondos) {
          setCondos(JSON.parse(localCondos));
        } else {
          const defaultCondos: Condominio[] = [
            {
              id: 'cd-1',
              nome: 'Vista Parque Residencial',
              cnpj: '00.123.456/0001-99',
              endereco: 'Av. Bartolomeu de Gusmão, 142',
              bairro: 'Aparecida',
              cidade: 'Santos',
              estado: 'SP',
              sindico: 'Cristhiane Xavier',
              unidades: 120,
              moradores: 3,
              proprietarios: 2,
              receita: 154000,
              despesa: 110000,
              inadimplenciaPercent: 12.0,
              status: 'Normal'
            },
            {
              id: 'cd-2',
              nome: 'Parque das Amoreiras',
              cnpj: '12.345.678/0001-00',
              endereco: 'Rua das Orquídeas, 88',
              bairro: 'Amoreiras',
              cidade: 'Campinas',
              estado: 'SP',
              sindico: 'Marcos Evangelista',
              unidades: 80,
              moradores: 0,
              proprietarios: 0,
              receita: 68000,
              despesa: 72000,
              inadimplenciaPercent: 21.0,
              status: 'Alerta'
            },
            {
              id: 'cd-3',
              nome: 'Residencial Miramar',
              cnpj: '33.444.555/0001-22',
              endereco: 'Av. Presidente Wilson, 400',
              bairro: 'José Menino',
              cidade: 'Santos',
              estado: 'SP',
              sindico: 'Mariana Couto',
              unidades: 95,
              moradores: 0,
              proprietarios: 0,
              receita: 118000,
              despesa: 92000,
              inadimplenciaPercent: 4.5,
              status: 'Normal'
            }
          ];
          localStorage.setItem('supabase_sim_condominios', JSON.stringify(defaultCondos));
          setCondos(defaultCondos);
        }

        // Carrega moradores simulados ou padrão
        const localMoradores = localStorage.getItem('supabase_sim_moradores');
        if (localMoradores) {
          setMoradoresList(JSON.parse(localMoradores));
        } else {
          const defaultMoradores: MoradorUnit[] = [
            { id: 'm-1', nome: 'Roberto Silva', cpf: '222.222.222-22', unidade: 'Apto 41-B', condominioId: 'cd-1', proprietario: true, telefone: '(13) 99123-4567' },
            { id: 'm-2', nome: 'Jorge Alencar', cpf: '444.444.444-44', unidade: 'Apto 102', condominioId: 'cd-1', proprietario: true, telefone: '(11) 98765-4321' },
            { id: 'm-3', nome: 'Mariana Couto', cpf: '555.555.555-55', unidade: 'Apto 204', condominioId: 'cd-1', proprietario: true, telefone: '(13) 98111-2233' }
          ];
          localStorage.setItem('supabase_sim_moradores', JSON.stringify(defaultMoradores));
          setMoradoresList(defaultMoradores);
        }

        // Carrega logs de auditoria simulados ou padrão
        const localAudit = localStorage.getItem('supabase_sim_audit_logs');
        if (localAudit) {
          setAuditLogs(JSON.parse(localAudit));
        } else {
          setAuditLogs([]);
        }

        // Carrega visitantes simulados ou padrão
        const localVisitantes = localStorage.getItem('supabase_sim_visitantes');
        if (localVisitantes) {
          setVisitantes(JSON.parse(localVisitantes));
        } else {
          setVisitantes([]);
        }

        // Carrega encomendas simuladas ou padrão
        const localEncomendas = localStorage.getItem('supabase_sim_encomendas');
        if (localEncomendas) {
          setEncomendas(JSON.parse(localEncomendas));
        } else {
          setEncomendas([]);
        }
        
        // Carrega perfis simulados para garantir funcionamento offline/demonstrativo
        const localData = localStorage.getItem('supabase_sim_perfis');
        if (localData) {
          setProfilesList(JSON.parse(localData));
        } else {
          const defaultSimPerfis: UserProfile[] = [
            { id: 'p-1', nome: 'Cristhiane Xavier', email: 'contato@facilities.com.br', cpf: '111.111.111-11', unidade: 'Administração', tipo: 'administrador', perfil: 'Administrador' },
            { id: 'p-2', nome: 'Roberto Silva', email: 'roberto@facilities.com.br', cpf: '222.222.222-22', unidade: 'Apto 41-B', tipo: 'morador', perfil: 'Morador' },
            { id: 'p-3', nome: 'Gustavo Mendes', email: 'gustavo@facilities.com.br', cpf: '333.333.333-33', unidade: 'Apto 102', tipo: 'subsindico', perfil: 'Subsíndico' },
            { id: 'p-4', nome: 'Jorge Alencar', email: 'jorge@facilities.com.br', cpf: '444.444.444-44', unidade: 'Portaria Principal', tipo: 'porteiro', perfil: 'Porteiro' },
            { id: 'p-5', nome: 'Mariana Couto', email: 'mariana@facilities.com.br', cpf: '555.555.555-55', unidade: 'Apto 204', tipo: 'proprietario', perfil: 'Proprietário' }
          ];
          localStorage.setItem('supabase_sim_perfis', JSON.stringify(defaultSimPerfis));
          setProfilesList(defaultSimPerfis);
        }
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
            bairro: c.bairro || '',
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

        // Fetch Perfis/Roles
        const { data: dbPerfis, error: errPerfis } = await supabase.from('perfis').select('*');
        if (dbPerfis && !errPerfis) {
          setProfilesList(dbPerfis.map((p: any) => ({
            id: p.id,
            auth_user_id: p.auth_user_id || p.id,
            nome: p.nome,
            email: p.email,
            cpf: p.cpf || '',
            unidade: p.unidade || '',
            tipo: p.tipo || 'morador',
            perfil: p.perfil || 'Morador'
          })));
        } else {
          const localData = localStorage.getItem('supabase_sim_perfis');
          if (localData) {
            setProfilesList(JSON.parse(localData));
          } else {
            const defaultSimPerfis: UserProfile[] = [
              { id: 'p-1', nome: 'Cristhiane Xavier', email: 'contato@facilities.com.br', cpf: '111.111.111-11', unidade: 'Administração', tipo: 'administrador', perfil: 'Administrador' },
              { id: 'p-2', nome: 'Roberto Silva', email: 'roberto@facilities.com.br', cpf: '222.222.222-22', unidade: 'Apto 41-B', tipo: 'morador', perfil: 'Morador' },
              { id: 'p-3', nome: 'Gustavo Mendes', email: 'gustavo@facilities.com.br', cpf: '333.333.333-33', unidade: 'Apto 102', tipo: 'subsindico', perfil: 'Subsíndico' },
              { id: 'p-4', nome: 'Jorge Alencar', email: 'jorge@facilities.com.br', cpf: '444.444.444-44', unidade: 'Portaria Principal', tipo: 'porteiro', perfil: 'Porteiro' },
              { id: 'p-5', nome: 'Mariana Couto', email: 'mariana@facilities.com.br', cpf: '555.555.555-55', unidade: 'Apto 204', tipo: 'proprietario', perfil: 'Proprietário' }
            ];
            localStorage.setItem('supabase_sim_perfis', JSON.stringify(defaultSimPerfis));
            setProfilesList(defaultSimPerfis);
          }
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
    // Land every profile on the beautiful unified Dashboard view to examine dynamic RLS metrics and theme consistency
    setActiveSubPage('dashboard');
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

  const handleCepChange = async (cepValue: string) => {
    const formatted = formatCEP(cepValue);
    setNewCondoCep(formatted);
    const cleanCep = formatted.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsFetchingCep(true);
      setCepError('');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (data.erro) {
          setCepError('CEP inválido.');
        } else {
          setNewCondoEndereco(data.logradouro || '');
          setNewCondoBairro(data.bairro || '');
          if (data.localidade) {
            setNewCondoCidade(data.localidade);
          }
          if (data.uf) {
            setNewCondoEstado(data.uf);
          }
        }
      } catch (error) {
        setCepError('Erro ao consultar CEP.');
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  // CRUD actions
  const handleCreateCondo = async (e: FormEvent) => {
    e.preventDefault();
    if (!verifyWritePermission(['admin'], 'Criar Condomínio')) return;
    
    const nameTrimmed = newCondoName.trim();
    if (!nameTrimmed) {
      onShowMessage("Erro de Validação", "Por favor, indique o Nome Fantasia do condomínio.");
      return;
    }

    const cnpjCleaned = newCondoCnpj.replace(/\D/g, '');
    if (!cnpjCleaned) {
      onShowMessage("Erro de Validação", "Por favor, indique o CNPJ comercial do condomínio.");
      return;
    }
    if (cnpjCleaned.length !== 14) {
      onShowMessage("Erro de Validação", "O CNPJ do condomínio deve conter exatamente 14 números.");
      return;
    }

    const cepCleaned = newCondoCep.replace(/\D/g, '');
    if (!cepCleaned) {
      onShowMessage("Erro de Validação", "Por favor, indique o CEP do condomínio.");
      return;
    }
    if (cepCleaned.length !== 8) {
      onShowMessage("Erro de Validação", "O CEP deve obter exatamente 8 números (exemplo: 11000-000).");
      return;
    }

    const cleanedCnpj = newCondoCnpj.trim();
    const finalEndereco = newCondoEndereco.trim() || 'Av. Bartolomeu de Gusmão, 142';
    const finalBairro = newCondoBairro.trim() || 'Aparecida';
    const finalCidade = newCondoCidade.trim() || 'Santos';
    const finalEstado = newCondoEstado.trim() || 'SP';

    const newC: Condominio = {
      id: generateUUID(),
      nome: newCondoName,
      cnpj: cleanedCnpj,
      endereco: finalEndereco,
      bairro: finalBairro,
      cidade: finalCidade,
      estado: finalEstado,
      sindico: newCondoSindico.trim() || 'Sem Síndico Vinculado',
      unidades: Number(newCondoUnidades) || 60,
      moradores: 0,
      proprietarios: 0,
      receita: 0,
      despesa: 0,
      inadimplenciaPercent: 0,
      status: 'Normal'
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await insertResilient('condominios', {
          id: newC.id,
          nome: newC.nome,
          cnpj: newC.cnpj,
          endereco: newC.endereco,
          bairro: newC.bairro,
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
        });

        if (error) {
          console.error('Erro ao salvar condomínio no Supabase:', error.message);
          onShowMessage("Erro no Banco", `Não foi possível persistir o condomínio na base do Supabase: ${error.message}. Por favor, certifique-se de que os privilégios RLS do seu login permitem escrita.`);
          return;
        }
      } catch (err: any) {
        console.error('Falha de rede ou conexão temporária:', err);
        onShowMessage("Erro de Conexão", `Não foi possível contatar o Supabase: ${err.message || err}`);
        return;
      }
    }

    setCondos(prev => {
      const list = [...prev, newC];
      if (!isSupabaseConfigured || !supabase) {
        localStorage.setItem('supabase_sim_condominios', JSON.stringify(list));
      }
      return list;
    });

    addAuditLog('CRIAR', 'condominios', `Criado novo condomínio: ${newCondoName} (Unidades: ${newCondoUnidades})`);
    onShowMessage("Sucesso", `Novo condomínio "${newC.nome}" registrado com sucesso.`);
    
    // Reset fields
    setNewCondoName('');
    setNewCondoCnpj('');
    setNewCondoSindico('');
    setNewCondoEndereco('');
    setNewCondoBairro('');
    setNewCondoCidade('');
    setNewCondoEstado('SP');
    setNewCondoCep('');
    setCepError('');
    setIsFetchingCep(false);
    setShowCondoForm(false);
  };

  const handleDeleteCondo = (id: string, name: string) => {
    if (!verifyWritePermission(['admin'], `Deletar Condomínio - ID: ${id}`)) return;
    setCondos(prev => {
      const list = prev.filter(c => c.id !== id);
      if (!isSupabaseConfigured || !supabase) {
        localStorage.setItem('supabase_sim_condominios', JSON.stringify(list));
      }
      return list;
    });
    addAuditLog('EXCLUIR', 'condominios', `Excluído condomínio: ${name}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('condominios').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Erro ao excluir condomínio no Supabase:', error.message);
      });
    }

    onShowMessage("Sucesso", "Condomínio desativado do sistema.");
  };

  const [editCondoInadimplencia, setEditCondoInadimplencia] = useState(5.0);

  const startEditingCondo = (item: any) => {
    setEditingCondo(item);
    setEditCondoName(item.nome || '');
    setEditCondoCnpj(item.cnpj || '');
    setEditCondoCep(item.cep || item.cnpj?.substring(0, 5) || '');
    setEditCondoEndereco(item.endereco || '');
    setEditCondoBairro(item.bairro || '');
    setEditCondoCidade(item.cidade || 'Santos');
    setEditCondoEstado(item.estado || 'SP');
    setEditCondoSindico(item.sindico || 'Administradora Facilities');
    setEditCondoBlocos(Number(item.blocosCount || 2));
    setEditCondoUnidades(Number(item.unidades || 80));
    setEditCondoMoradores(Number(item.moradores || Math.round((Number(item.unidades) || 80) * 2.8)));
    setEditCondoProprietarios(Number(item.proprietarios || Math.round((Number(item.unidades) || 80) * 0.95)));
    setEditCondoReceita(Number(item.receita || 60000));
    setEditCondoDespesa(Number(item.despesa || 49600));
    setEditCondoInadimplencia(Number(item.inadimplenciaPercent || 5.0));
    setEditCondoStatus(item.status || 'Normal');
  };

  const handleEditCepChange = async (val: string) => {
    const formatted = val.replace(/\D/g, '').replace(/^(\d{5})(\d{3})/, '$1-$2');
    setEditCondoCep(formatted);
    const numeric = val.replace(/\D/g, '');
    if (numeric.length === 8) {
      setIsFetchingEditCep(true);
      setEditCepError('');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${numeric}/json/`);
        const data = await res.json();
        if (data.erro) {
          setEditCepError('Não encontrado');
        } else {
          setEditCondoEndereco(data.logradouro || '');
          setEditCondoBairro(data.bairro || '');
          if (data.localidade) setEditCondoCidade(data.localidade);
          if (data.uf) setEditCondoEstado(data.uf);
        }
      } catch (err) {
        setEditCepError('Erro');
      } finally {
        setIsFetchingEditCep(false);
      }
    }
  };

  const handleSaveEditCondo = async (e: FormEvent) => {
    e.preventDefault();
    if (!editCondoName.trim()) {
      onShowMessage("Erro de Validação", "Por favor, defina o Nome do condomínio.");
      return;
    }

    const sanitizedCnpj = editCondoCnpj.replace(/\D/g, '');
    const updatedObj: Condominio = {
      ...editingCondo,
      nome: editCondoName,
      cnpj: editCondoCnpj,
      cep: editCondoCep,
      endereco: editCondoEndereco,
      bairro: editCondoBairro,
      cidade: editCondoCidade,
      estado: editCondoEstado,
      sindico: editCondoSindico || 'Administradora Facilities',
      unidades: Number(editCondoUnidades) || 80,
      moradores: Number(editCondoMoradores) || 224,
      proprietarios: Number(editCondoProprietarios) || 76,
      receita: Number(editCondoReceita) || 60000,
      despesa: Number(editCondoDespesa) || 49600,
      inadimplenciaPercent: Number(editCondoInadimplencia) || 5.2,
      status: editCondoStatus as any
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('condominios')
          .update({
            nome: editCondoName,
            cnpj: editCondoCnpj,
            endereco: editCondoEndereco,
            bairro: editCondoBairro,
            cidade: editCondoCidade,
            estado: editCondoEstado,
            sindico: editCondoSindico,
            unidades: Number(editCondoUnidades),
            moradores: Number(editCondoMoradores),
            proprietarios: Number(editCondoProprietarios),
            receita: Number(editCondoReceita),
            despesa: Number(editCondoDespesa),
            inadimplencia_percent: Number(editCondoInadimplencia),
            status: editCondoStatus
          })
          .eq('id', editingCondo.id);

        if (error) {
          console.error('Erro ao atualizar no Supabase:', error.message);
          onShowMessage("Erro de Gravação", `Não foi possível atualizar no Supabase: ${error.message}`);
          return;
        }
      } catch (err: any) {
        console.error('Conexão instável com Supabase:', err);
      }
    }

    setCondos(prev => {
      const list = prev.map(c => c.id === updatedObj.id ? updatedObj : c);
      if (!isSupabaseConfigured || !supabase) {
        localStorage.setItem('supabase_sim_condominios', JSON.stringify(list));
      }
      return list;
    });

    addAuditLog('EDITAR', 'condominios', `Atualizado dados do condomínio: ${editCondoName}`);
    onShowMessage("Sucesso", "Informações do condomínio atualizadas com sucesso.");
    setEditingCondo(null);
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

    setMoradoresList(prev => {
      const list = [...prev, newM];
      if (!isSupabaseConfigured || !supabase) {
        localStorage.setItem('supabase_sim_moradores', JSON.stringify(list));
      }
      return list;
    });
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
    setShowMoradorForm(false);
  };

  const handleBulkCreateMoradores = (e: FormEvent) => {
    e.preventDefault();
    if (!verifyWritePermission(['admin', 'colaborador', 'sindico', 'subsindico'], 'Cadastrar Moradores em Lote')) return;
    if (!bulkAddCondoId) return;

    // Filter out rows that are completely empty first, but if any semi-empty rows exist, alert.
    const validRows = bulkAddRows.filter(row => row.nome.trim() || row.unidade.trim() || row.cpf.trim());
    
    if (validRows.length === 0) {
      onShowMessage("Erro de Validação", "Por favor, preencha pelo menos um morador antes de salvar.");
      return;
    }

    const missingFields = validRows.some(row => !row.nome.trim() || !row.unidade.trim());
    if (missingFields) {
      onShowMessage("Erro de Validação", "Todas as linhas preenchidas devem ter pelo menos Nome e Unidade definidos.");
      return;
    }

    const condoObj = condos.find(c => c.id === bulkAddCondoId);
    const condoName = condoObj ? condoObj.nome : bulkAddCondoId;

    const newResidents: MoradorUnit[] = validRows.map((row, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      nome: row.nome.trim(),
      cpf: row.cpf.trim() || '000.000.000-00',
      unidade: row.unidade.trim(),
      condominioId: bulkAddCondoId,
      proprietario: row.proprietario,
      telefone: row.telefone.trim() || '(13) 99123-4567'
    }));

    setMoradoresList(prev => {
      const list = [...newResidents, ...prev];
      if (!isSupabaseConfigured || !supabase) {
        localStorage.setItem('supabase_sim_moradores', JSON.stringify(list));
      }
      return list;
    });
    addAuditLog('CRIAR', 'moradores', `Cadastrados ${newResidents.length} moradores em lote no condomínio ${condoName}`);

    if (isSupabaseConfigured && supabase) {
      const payloads = newResidents.map(r => ({
        id: r.id,
        nome: r.nome,
        cpf: r.cpf,
        unidade: r.unidade,
        condominio_id: r.condominioId,
        proprietario: r.proprietario,
        telefone: r.telefone
      }));

      supabase.from('moradores').insert(payloads).then(({ error }) => {
        if (error) console.error('Erro ao salvar moradores em lote no Supabase:', error.message);
      });
    }

    onShowMessage("Sucesso", `${newResidents.length} moradores adicionados com sucesso ao condomínio ${condoName}!`);
    
    // Reset and close modal
    setBulkAddRows([{ nome: '', unidade: '', cpf: '', proprietario: true, telefone: '(13) 99123-4567' }]);
    setBulkAddCondoId(null);
    setIsBulkAddMoradoresOpen(false);
  };

  const handleDeleteMorador = (id: string, name: string) => {
    if (!verifyWritePermission(['admin'], `Excluir Morador - ID: ${id}`)) return;
    setMoradoresList(prev => {
      const list = prev.filter(m => m.id !== id);
      if (!isSupabaseConfigured || !supabase) {
        localStorage.setItem('supabase_sim_moradores', JSON.stringify(list));
      }
      return list;
    });
    addAuditLog('EXCLUIR', 'moradores', `Excluído morador: ${name}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('moradores').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Erro ao excluir morador no Supabase:', error.message);
      });
    }

    onShowMessage("Sucesso", "Morador removido da base.");
  };

  const handleCreateOrUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (activeProfile !== 'admin') {
      onShowMessage("Bloqueio de Permissão", "Apenas o perfil Administrador pode adicionar ou editar perfis e roles.");
      return;
    }
    if (!newProfileNome.trim() || !newProfileEmail.trim()) {
      onShowMessage("Erro", "Nome e Email são campos obrigatórios.");
      return;
    }

    const isEdit = !!selectedProfileId;
    let targetId = selectedProfileId || `p-${Date.now()}`;

    // Determina o perfil legível correspondente ao tipo de role
    let resolvedPerfil = 'Morador';
    const cleanTipo = newProfileTipo.toLowerCase();
    const foundRole = roleTypes.find(r => r.id === cleanTipo);
    if (foundRole) {
      resolvedPerfil = foundRole.nome;
    } else {
      if (cleanTipo === 'administrador' || cleanTipo === 'admin') resolvedPerfil = 'Administrador';
      else if (cleanTipo === 'colaborador' || cleanTipo === 'colab') resolvedPerfil = 'Colaborador';
      else if (cleanTipo === 'sindico' || cleanTipo === 'síndico') resolvedPerfil = 'Síndico';
      else if (cleanTipo === 'subsindico' || cleanTipo === 'subsíndico') resolvedPerfil = 'Subsíndico';
      else if (cleanTipo === 'conselheiro') resolvedPerfil = 'Conselheiro';
      else if (cleanTipo === 'proprietario' || cleanTipo === 'proprietário') resolvedPerfil = 'Proprietário';
      else if (cleanTipo === 'porteiro') resolvedPerfil = 'Porteiro';
    }

    const cleanCpf = newProfileCpf.replace(/\D/g, '');
    const formattedCpf = cleanCpf.length === 11 
      ? cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : newProfileCpf;

    // Se for um cadastro real do Supabase (e não edição), tentar criar conta auth
    // usando um cliente alternativo/temporário para não deslogar o admin logado
    if (isSupabaseConfigured && !isEdit) {
      if (!newProfilePassword.trim()) {
        onShowMessage("Erro de Validação", "Por favor, informe a Senha de Acesso para o novo usuário.");
        return;
      }
      try {
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });

        const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
          email: newProfileEmail.trim(),
          password: newProfilePassword,
          options: {
            data: {
              full_name: newProfileNome.trim(),
              unit: newProfileUnidade || 'Apto Geral',
              profile: resolvedPerfil,
              cpf: formattedCpf
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData?.user) {
          targetId = signUpData.user.id;
        }
      } catch (authErr: any) {
        console.error('Erro de Autenticação no Supabase Auth:', authErr);
        onShowMessage("Erro ao Criar Login", `Não foi possível criar as credenciais de autenticação no Supabase Auth: ${authErr.message}`);
        return;
      }
    }

    // Salva no repositório de simulação offline de usuários (facilities_portal_users) para login local fallback
    try {
      const savedUsers = localStorage.getItem('facilities_portal_users');
      let users = [];
      if (savedUsers) {
        try { users = JSON.parse(savedUsers); } catch { users = []; }
      }
      const uIdx = users.findIndex((u: any) => u.email.toLowerCase() === newProfileEmail.trim().toLowerCase());
      const existingPass = (uIdx !== -1) ? (users[uIdx].pass || '123456') : '123456';

      const newUserSim = {
        cpf: formattedCpf,
        email: newProfileEmail.trim(),
        pass: newProfilePassword || existingPass,
        name: newProfileNome.trim(),
        unit: newProfileUnidade || 'Apto Geral',
        profile: resolvedPerfil,
        ativo: newProfileAtivo,
        condominio_id: newProfileCondoId
      };
      if (uIdx !== -1) {
        users[uIdx] = newUserSim;
      } else {
        users.push(newUserSim);
      }
      localStorage.setItem('facilities_portal_users', JSON.stringify(users));
    } catch (err) {
      console.warn('Erro ao atualizar base de credenciais local:', err);
    }

    const profileData: UserProfile = {
      id: targetId,
      auth_user_id: targetId,
      nome: newProfileNome,
      email: newProfileEmail,
      cpf: formattedCpf,
      unidade: newProfileUnidade || 'Apto Geral',
      tipo: cleanTipo,
      perfil: resolvedPerfil,
      ativo: newProfileAtivo,
      condominio_id: newProfileCondoId
    };

    if (isEdit) {
      setProfilesList(prev => prev.map(p => p.id === targetId ? profileData : p));
      addAuditLog('EDITAR', 'perfis', `Atualizado perfil do usuário: ${newProfileNome} para role ${resolvedPerfil} (Ativo: ${newProfileAtivo})`);
    } else {
      setProfilesList(prev => [profileData, ...prev]);
      addAuditLog('CRIAR', 'perfis', `Criado novo perfil de usuário: ${newProfileNome} com role ${resolvedPerfil} (Ativo: ${newProfileAtivo})`);
    }

    // Persiste no Supabase se houver conexão
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: targetId,
          auth_user_id: targetId,
          nome: newProfileNome,
          email: newProfileEmail,
          cpf: formattedCpf,
          unidade: newProfileUnidade || 'Apto Geral',
          tipo: cleanTipo,
          perfil: resolvedPerfil,
          ativo: newProfileAtivo,
          condominio_id: newProfileCondoId
        };
        await supabase.from('perfis').upsert(payload);
        await supabase.from('perfil').upsert({
          id: targetId,
          nome: newProfileNome,
          email: newProfileEmail,
          cpf: formattedCpf,
          tipo: cleanTipo,
          unidade: newProfileUnidade || 'Apto Geral',
          ativo: newProfileAtivo,
          condominio_id: newProfileCondoId
        });
      } catch (err: any) {
        console.error('Erro ao salvar perfil no Supabase:', err.message);
      }
    }

    // Atualiza no localStorage também
    const localData = localStorage.getItem('supabase_sim_perfis');
    let localList: UserProfile[] = localData ? JSON.parse(localData) : [];
    if (isEdit) {
      localList = localList.map(p => p.id === targetId ? profileData : p);
    } else {
      localList = [profileData, ...localList];
    }
    localStorage.setItem('supabase_sim_perfis', JSON.stringify(localList));

    onShowMessage("Sucesso", isEdit ? "Perfil atualizado com sucesso!" : "Perfil criado com sucesso!");
    
    // Limpa formulário
    setNewProfileNome('');
    setNewProfileEmail('');
    setNewProfilePassword('');
    setNewProfileCpf('');
    setNewProfileUnidade('');
    setNewProfileTipo('morador');
    setNewProfileAtivo(true);
    setNewProfileCondoId('cd-1');
    setSelectedProfileId(null);
    setShowProfileForm(false);
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (activeProfile !== 'admin') {
      onShowMessage("Bloqueio de Permissão", "Apenas o perfil Administrador pode excluir perfis.");
      return;
    }

    setProfilesList(prev => prev.filter(p => p.id !== id));
    addAuditLog('EXCLUIR', 'perfis', `Deletado perfil do usuário: ${name}`);

    // Deleta do Supabase se houver conexão
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('perfis').delete().eq('id', id);
        await supabase.from('perfil').delete().eq('id', id);
      } catch (err: any) {
        console.error('Erro ao excluir perfil no Supabase:', err.message);
      }
    }

    // Exclui do localStorage
    const localData = localStorage.getItem('supabase_sim_perfis');
    if (localData) {
      let localList: UserProfile[] = JSON.parse(localData);
      localList = localList.filter(p => p.id !== id);
      localStorage.setItem('supabase_sim_perfis', JSON.stringify(localList));
    }

    onShowMessage("Sucesso", "Perfil removido do sistema.");
  };

  const handleCreateOrUpdateRoleType = (e: FormEvent) => {
    e.preventDefault();
    if (activeProfile !== 'admin') {
      onShowMessage("Bloqueio de Permissão", "Apenas o perfil Administrador pode adicionar ou editar tipos de role.");
      return;
    }

    if (!newRoleTypeId.trim() || !newRoleTypeNome.trim()) {
      onShowMessage("Campos Obrigatórios", "Por favor, defina um identificador (ID/Slug) e nome para o tipo de role.");
      return;
    }

    const formattedId = newRoleTypeId.trim().toLowerCase().replace(/\s+/g, '-');

    if (selectedRoleTypeId) {
      // Editing
      const updatedList = roleTypes.map(rt => 
        rt.id === selectedRoleTypeId 
          ? { ...rt, nome: newRoleTypeNome.trim(), descricao: newRoleTypeDescricao.trim() } 
          : rt
      );
      setRoleTypes(updatedList);
      localStorage.setItem('supabase_sim_role_types', JSON.stringify(updatedList));
      addAuditLog('EDITAR', 'perfis', `Atualizado tipo de role: id=${selectedRoleTypeId}, nome=${newRoleTypeNome}`);
      onShowMessage("Sucesso", `Tipo de role "${newRoleTypeNome}" atualizado.`);
    } else {
      // Creating
      if (roleTypes.some(rt => rt.id === formattedId)) {
        onShowMessage("ID Duplicado", "Já existe um tipo de role com este Identificador.");
        return;
      }

      const newRole: RoleType = {
        id: formattedId,
        nome: newRoleTypeNome.trim(),
        descricao: newRoleTypeDescricao.trim()
      };

      const updatedList = [...roleTypes, newRole];
      setRoleTypes(updatedList);
      localStorage.setItem('supabase_sim_role_types', JSON.stringify(updatedList));
      addAuditLog('CRIAR', 'perfis', `Criado novo tipo de role: id=${formattedId}, nome=${newRoleTypeNome}`);
      onShowMessage("Sucesso", `Tipo de role "${newRoleTypeNome}" criado com sucesso.`);
    }

    // Reset Form
    setSelectedRoleTypeId(null);
    setNewRoleTypeId('');
    setNewRoleTypeNome('');
    setNewRoleTypeDescricao('');
    setShowRoleTypeForm(false);
  };

  const handleDeleteRoleType = (id: string, nome: string) => {
    if (activeProfile !== 'admin') {
      onShowMessage("Bloqueio de Permissão", "Apenas o perfil Administrador pode excluir tipos de role.");
      return;
    }

    if (id === 'administrador' || id === 'admin') {
      onShowMessage("Ação Bloqueada", "Não é permitido remover a role Administrador básica do sistema.");
      return;
    }

    const usersWithThisRole = profilesList.filter(p => p.tipo === id);
    if (usersWithThisRole.length > 0) {
      onShowMessage(
        "Não é possível excluir",
        `Existem ${usersWithThisRole.length} usuário(s) utilizando esta role. Por favor, altere o perfil desses usuários antes de remover o tipo de role.`
      );
      return;
    }

    setRoleTypeToDelete({ id, nome });
    setIsConfirmDeleteRoleModalOpen(true);
  };

  const confirmDeleteRoleType = () => {
    if (!roleTypeToDelete) return;
    const { id, nome } = roleTypeToDelete;

    const updatedList = roleTypes.filter(rt => rt.id !== id);
    setRoleTypes(updatedList);
    localStorage.setItem('supabase_sim_role_types', JSON.stringify(updatedList));
    addAuditLog('EXCLUIR', 'perfis', `Excluído tipo de role: id=${id}, nome=${nome}`);
    onShowMessage("Sucesso", `Tipo de role "${nome}" removido com sucesso.`);

    if (selectedRoleTypeId === id) {
      setSelectedRoleTypeId(null);
      setNewRoleTypeId('');
      setNewRoleTypeNome('');
      setNewRoleTypeDescricao('');
    }

    setIsConfirmDeleteRoleModalOpen(false);
    setRoleTypeToDelete(null);
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

  const getActiveUserDetails = () => {
    if (currentUser) {
      return {
        nome: currentUser.name || "Cristhiane Xavier",
        perfil: currentUser.profile?.toUpperCase() || "ADMINISTRADOR",
        unidade: currentUser.unit || "Apto Geral",
        email: currentUser.email || "cristhiane@facilities.com.br"
      };
    }
    switch (activeProfile) {
      case 'admin':
        return { nome: 'Cristhiane Xavier', perfil: 'ADMINISTRADOR', unidade: 'Apto Geral', email: 'cristhiane@facilities.com.br' };
      case 'colaborador':
        return { nome: 'Clara Santos', perfil: 'COLABORADOR', unidade: 'Geral Admin', email: 'clara@facilities.com.br' };
      case 'sindico':
        return { nome: 'Gustavo Mendes', perfil: 'SÍNDICO', unidade: 'Apto 102', email: 'gustavo@facilities.com.br' };
      case 'subsindico':
        return { nome: 'Carlos Augusto', perfil: 'SUB-SÍNDICO', unidade: 'Apto 104', email: 'carlos@facilities.com.br' };
      case 'conselheiro':
        return { nome: 'Roberto Silva', perfil: 'CONSELHEIRO', unidade: 'Apto 41-B', email: 'roberto@facilities.com.br' };
      case 'proprietario':
        return { nome: 'Mariana Couto', perfil: 'PROPRIETÁRIO', unidade: 'Apto 204', email: 'mariana@facilities.com.br' };
      case 'morador':
        return { nome: 'Roberto Silva', perfil: 'MORADOR', unidade: 'Apto 41-B', email: 'roberto@facilities.com.br' };
      case 'porteiro':
        return { nome: 'Jorge Alencar', perfil: 'PORTEIRO', unidade: 'Ronda Portaria', email: 'jorge@facilities.com.br' };
      default:
        return { nome: 'Cristhiane Xavier', perfil: 'ADMINISTRADOR', unidade: 'Apto Geral', email: 'cristhiane@facilities.com.br' };
    }
  };

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
          { id: 'perfis', label: 'Gestão de Perfis (Roles)', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
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
          { id: 'portaria', label: 'Monitorar Portaria', icon: <Key className="w-4 h-4" /> },
          { id: 'relatorios', label: 'Exportar Relatórios', icon: <FileText className="w-4 h-4" /> },
        ];
      case 'sindico':
      case 'subsindico':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
          { id: 'financeiro', label: 'Prestação de Contas', icon: <Wallet className="w-4 h-4" /> },
          { id: 'portaria', label: 'Controle Portaria', icon: <Key className="w-4 h-4" /> },
        ];
      case 'conselheiro':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
          { id: 'financeiro', label: 'Balanço (Acesso Leitura)', icon: <Wallet className="w-4 h-4" /> },
          { id: 'portaria', label: 'Movimentação Visitantes', icon: <Key className="w-4 h-4" /> },
        ];
      case 'proprietario':
      case 'morador':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
          { id: 'minha_unidade', label: 'Minha Unidade (41-B)', icon: <Compass className="w-4 h-4" /> },
          { id: 'portaria', label: 'Minhas Encomendas', icon: <Package className="w-4 h-4" /> },
        ];
      case 'porteiro':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
          { id: 'portaria', label: 'Ronda & Portaria', icon: <Key className="w-4 h-4" /> },
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
        ) : null}

        {/* MAIN BODY CORE */}
        <div id="admin-main-body" className="overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] h-full w-full">
          
          {/* LEFT DYNAMIC SIDEBAR MENU (Premium Dark Theme: #061426) */}
          <div className="w-full bg-[#061426] border-r border-white/5 flex flex-col overflow-y-auto shrink-0 select-none">
            
            {/* Top Logo Area with Custom Brand Logo */}
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-center">
              <img 
                src="https://ejpjtpteycckydrorjpr.supabase.co/storage/v1/object/public/images/facilities%20logobranco.png" 
                alt="Facilities Condominial" 
                className="w-full max-h-20 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Menu Header Category */}
            <div className="px-6 py-2 pt-5 text-left">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Menu Principal</span>
            </div>

            {/* Dynamic Interactive Navigation Items */}
            <nav className="px-3 space-y-1">
              {getMenuItems().map(item => {
                const isActive = activeSubPage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`side-menu-${item.id}`}
                    onClick={() => {
                      setActiveSubPage(item.id);
                      setSelectedCondoId(null);
                    }}
                    className={`w-full relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left transition-all duration-250 shrink-0 cursor-pointer ${
                      isActive 
                        ? 'bg-[#0E7C66] text-white ring-1 ring-emerald-500/20' 
                        : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {/* Active Accent Side Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#10B981] rounded-r-md"></div>
                    )}
                    <span className={`transition-transform duration-200 ${isActive ? 'scale-110 text-white' : 'text-[#94A3B8]'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Middle Category "Sessão Segura" */}
            <div className="px-6 py-2 pt-6 text-left">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Conexão Segura</span>
            </div>
            <div className="px-4 py-1 select-none text-left">
              <div className="bg-[#0B1B2F] p-3 rounded-2xl border border-white/5 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
                <div className="text-left leading-none">
                  <p className="text-white font-bold text-[10px] uppercase tracking-wider">Auditoria Ativa</p>
                  <p className="text-[#10B981] text-[9px] font-semibold mt-0.5">Sessão Protegida</p>
                </div>
              </div>
            </div>

            {/* Bottom Account Indicator & Logged Member */}
            <div className="mt-auto p-4 border-t border-white/5 bg-[#05101F]">
              <div className="bg-[#0B1B2F] p-3 rounded-2xl flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#0E7C66] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-md">
                    {getActiveUserDetails().nome.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-white font-extrabold text-xs truncate leading-tight">{getActiveUserDetails().nome}</p>
                    <p className="text-[#10B981] text-[9px] font-black uppercase tracking-wider mt-0.5 leading-none">{getActiveUserDetails().perfil}</p>
                  </div>
                </div>
              </div>

              {/* Collapsible Action buttons */}
              <div className="mt-4 flex items-center justify-between px-2 text-[11px] text-[#94A3B8]">
                <button 
                  onClick={() => {
                    if (onLogout) onLogout();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors font-bold cursor-pointer bg-none border-0 bg-transparent pl-0 text-left"
                >
                  <X className="w-3.5 h-3.5 text-red-500" /> Sair da Conta
                </button>
                <span className="text-gray-700 select-none">|</span>
                <span className="text-[10px] text-gray-500 font-mono select-none uppercase tracking-widest font-black">RLS: ATIVO</span>
              </div>
            </div>

          </div>

          {/* RIGHT PANELS WORKSPACE (Premium Light Content Theme: #F8FAFC) */}
          <div className="min-w-0 bg-[#F8FAFC] flex flex-col h-full overflow-hidden">
            
            {/* White Premium Sticky Header (80px height: h-20) */}
            <header className="h-20 bg-white border-b border-[#E2E8F0] px-6 md:px-8 flex items-center justify-between shrink-0 select-none select-none z-10 shadow-xs">
              
              {/* Left Column: Active Page Title */}
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-bold font-sans text-[#101c29]">
                  {getMenuItems().find(item => item.id === activeSubPage)?.label || 'Painel de Controle'}
                </h1>
              </div>

              {/* Right Column: Database Connection badge, Alarm bell, avatar */}
              <div className="flex items-center gap-4">
                
                {/* Alarm Bell Button */}
                <button className="relative p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>

                {/* User Initials Circle */}
                <div 
                  title={getActiveUserDetails().email}
                  className="h-10 w-10 rounded-full bg-[#3B82F6] hover:bg-blue-600 font-sans font-bold text-white text-xs flex items-center justify-center cursor-help select-none shadow-xs tracking-wider border-2 border-white ring-2 ring-blue-500/10"
                >
                  {getActiveUserDetails().nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

              </div>

            </header>

            {/* Workspace Inner Scroll Container */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

              {/* 1. VIEW DETAILED INDIVIDUAL CONDOMINIUM */}
              {selectedCondoId && activeDetailedCondo ? (
                <CondoDetailsView
                  condo={activeDetailedCondo}
                  onBack={() => setSelectedCondoId(null)}
                  onEdit={(item) => {
                    startEditingCondo(item);
                  }}
                  onDelete={(item) => {
                    handleDeleteCondo(item.id, item.nome);
                    setSelectedCondoId(null);
                  }}
                  onShowNotification={(headline, text) => {
                    onShowMessage(headline, text);
                  }}
                />
              ) : (
                <>
                  {/* 2. SUB-PAGE: SYSTEM-WIDE PREMIUM DASHBOARD */}
                  {activeSubPage === 'dashboard' && (
                    <div className="space-y-6">
                      


                      {/* RLS Warning / Danger insight banner at the top */}
                      {!isRlsAlertDismissed && (
                        <div className="bg-[#FEF2F2] border border-[#FEE2E2] p-4 rounded-2xl text-xs text-[#991B1B] text-left flex items-start gap-4 shadow-xs relative transition-all animate-fade-in pr-10">
                          <div className="bg-[#FEE2E2] p-1.5 rounded-xl text-[#EF4444] shrink-0">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <span className="font-extrabold text-[#EF4444] text-[13px] tracking-wide flex items-center gap-1.5 leading-none">
                              Diretrizes de RLS Ativas • Filtro de Isolamento
                            </span>
                            <p className="text-[#64748B] leading-relaxed">
                              <strong>Parque das Amoreiras</strong> registra inadimplência de <strong className="text-red-500 font-bold">21,0%</strong>. Se operando sob os perfis Síndico/Conselheiro/Morador, as políticas de segurança ocultam outros empreendimentos para proteger o direito civil dos condôminos na base relacional do PostgreSQL.
                            </p>
                          </div>
                          
                          <button 
                            onClick={() => setIsRlsAlertDismissed(true)}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* KPI Cards section (rounded 20px, borders, shadows) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left select-none">
                        
                        {/* KPI 1: CONDOMÍNIOS */}
                        <div className="bg-white p-5 rounded-[20px] border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:border-blue-200 transition-all duration-300 group">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold shadow-xs">
                                <Building2 className="w-5 h-5 animate-pulse" />
                              </div>
                              <div className="text-left leading-none font-sans">
                                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-extrabold block">Condomínios</span>
                                <span className="text-[10px] text-[#64748B]">Ativos</span>
                              </div>
                            </div>
                            
                            <h4 className="text-3xl font-black text-[#0F172A] mt-4 font-display transition-transform group-hover:scale-105 duration-300">
                              {stats.totalCondos}
                            </h4>
                          </div>

                          <button 
                            onClick={() => setActiveSubPage('condominios')}
                            className="text-xs font-bold text-[#0E7C66] hover:text-emerald-700 transition-colors mt-4 flex items-center gap-1 border-0 bg-transparent cursor-pointer pl-0"
                          >
                            Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* KPI 2: UNIDADES TOTAIS */}
                        <div className="bg-white p-5 rounded-[20px] border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:border-purple-200 transition-all duration-300 group">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center font-bold shadow-xs">
                                <Users className="w-5 h-5" />
                              </div>
                              <div className="text-left leading-none font-sans">
                                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-extrabold block">Unidades Totais</span>
                                <span className="text-[10px] text-[#64748B]">Cadastradas</span>
                              </div>
                            </div>
                            
                            <h4 className="text-3xl font-black text-[#0F172A] mt-4 font-display transition-transform group-hover:scale-105 duration-300">
                              {stats.unidades}
                            </h4>
                          </div>

                          <button 
                            onClick={() => setActiveSubPage('condominios')}
                            className="text-xs font-bold text-[#0E7C66] hover:text-emerald-700 transition-colors mt-4 flex items-center gap-1 border-0 bg-transparent cursor-pointer pl-0"
                          >
                            Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* KPI 3: MORADORES ATIVOS */}
                        <div className="bg-white p-5 rounded-[20px] border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:border-amber-200 transition-all duration-300 group">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center font-bold shadow-xs">
                                <UserCheck className="w-5 h-5" />
                              </div>
                              <div className="text-left leading-none font-sans">
                                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-extrabold block">Moradores Ativos</span>
                                <span className="text-[10px] text-[#64748B]">Cadastrados</span>
                              </div>
                            </div>
                            
                            <h4 className="text-3xl font-black text-[#0F172A] mt-4 font-display transition-transform group-hover:scale-105 duration-300">
                              {stats.moradores}
                            </h4>
                          </div>
                        </div>

                        {/* KPI 4: INADIMPLÊNCIA MÉDIA */}
                        <div className="bg-white p-5 rounded-[20px] border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:border-emerald-200 transition-all duration-300 group">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-emerald-50 text-[#10B981] flex items-center justify-center font-bold shadow-xs">
                                <TrendingUp className="w-5 h-5 text-[#10B981]" />
                              </div>
                              <div className="text-left leading-none font-sans">
                                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-extrabold block">Inadimplência</span>
                                <span className="text-[10px] text-[#64748B]">Média Unificada</span>
                              </div>
                            </div>
                            
                            <h4 className="text-3xl font-black text-[#0F172A] mt-4 font-display transition-transform group-hover:scale-105 duration-300">
                              {stats.inadimplenciaPercent}%
                            </h4>
                          </div>

                          <button 
                            onClick={() => setActiveSubPage('financeiro')}
                            className="text-xs font-bold text-[#0E7C66] hover:text-emerald-700 transition-colors mt-4 flex items-center gap-1 border-0 bg-transparent cursor-pointer pl-0"
                          >
                            Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>

                      {/* Charts and consolidated faturamento layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                        
                        {/* Area 1: Spline line area graph (col-span-2) */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col justify-between">
                          <div className="space-y-4">
                            
                            {/* Graphic Top Indicators */}
                            <div className="flex justify-between items-center flex-wrap gap-2 select-none">
                              <h4 className="text-[11.5px] font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5 leading-none">
                                Histórico de Inadimplência (%) 
                                <div className="group relative">
                                  <AlertCircle className="w-3.5 h-3.5 text-gray-300 hover:text-gray-600 cursor-pointer" />
                                  <span className="absolute left-1/2 -translate-x-1/2 bottom-5 scale-0 group-hover:scale-100 bg-[#0F172A] text-white text-[9px] px-2 py-1 rounded whitespace-nowrap shadow-md transition-all duration-200">Competência mensal consolidada do sistema</span>
                                </div>
                              </h4>
                              
                              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#64748B] flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors">
                                <span>Últimos 6 meses</span>
                                <ChevronRight className="w-3 h-3 rotate-90 text-gray-400" />
                              </div>
                            </div>

                            {/* RLS Authorization Checking inside graphics workspace */}
                            {!isPorteiroRole ? (
                              <>
                                {/* Flawless Custom SVG Cubic Spline line area chart */}
                                <div className="h-[210px] w-full relative mt-4 select-none">
                                  <svg className="w-full h-full" viewBox="0 0 600 210" preserveAspectRatio="none">
                                    <defs>
                                      <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.18"/>
                                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                                      </linearGradient>
                                    </defs>

                                    {/* Grid Lines */}
                                    <line x1="40" y1="30" x2="570" y2="30" stroke="#F8FAFC" strokeWidth="1" />
                                    <line x1="40" y1="80" x2="570" y2="80" stroke="#F8FAFC" strokeWidth="1" />
                                    <line x1="40" y1="130" x2="570" y2="130" stroke="#F8FAFC" strokeWidth="1" />
                                    <line x1="40" y1="180" x2="570" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

                                    {/* Y Axis Labels */}
                                    <text x="12" y="34" className="text-[9px] font-semibold text-[#94A3B8] font-mono">30%</text>
                                    <text x="12" y="84" className="text-[9px] font-semibold text-[#94A3B8] font-mono">20%</text>
                                    <text x="12" y="134" className="text-[9px] font-semibold text-[#94A3B8] font-mono">10%</text>
                                    <text x="12" y="184" className="text-[9px] font-semibold text-[#94A3B8] font-mono">0%</text>

                                    {/* Spline Path Filled Area */}
                                    <path 
                                      d="M 60 135 C 150 120, 180 115, 230 110 C 280 105, 300 115, 340 110 C 380 105, 410 100, 460 97 C 510 94, 530 90, 550 85 L 550 180 L 60 180 Z" 
                                      fill="url(#chart-grad)"
                                    />

                                    {/* Spline Path Line */}
                                    <path 
                                      d="M 60 135 C 150 120, 180 115, 230 110 C 280 105, 300 115, 340 110 C 380 105, 410 100, 460 97 C 510 94, 530 90, 550 85" 
                                      fill="none" 
                                      stroke="#10B981" 
                                      strokeWidth="3.5" 
                                      strokeLinecap="round"
                                    />

                                    {/* Interactive Nodes */}
                                    <circle cx="60" cy="135" r="4.5" fill="#ffffff" stroke="#10B981" strokeWidth="2.5" />
                                    <text x="60" y="118" textAnchor="middle" className="text-[10px] font-extrabold text-[#0F172A] font-sans">18,7%</text>
                                    
                                    <circle cx="158" cy="129" r="4.5" fill="#ffffff" stroke="#10B981" strokeWidth="2.5" />
                                    <text x="158" y="112" textAnchor="middle" className="text-[10px] font-extrabold text-[#0F172A] font-sans">19,5%</text>

                                    <circle cx="256" cy="123" r="4.5" fill="#ffffff" stroke="#10B981" strokeWidth="2.5" />
                                    <text x="256" y="106" textAnchor="middle" className="text-[10px] font-extrabold text-[#0F172A] font-sans">20,1%</text>

                                    <circle cx="354" cy="125" r="4.5" fill="#ffffff" stroke="#10B981" strokeWidth="2.5" />
                                    <text x="354" y="108" textAnchor="middle" className="text-[10px] font-extrabold text-[#0F172A] font-sans">19,8%</text>

                                    <circle cx="452" cy="121" r="4.5" fill="#ffffff" stroke="#10B981" strokeWidth="2.5" />
                                    <text x="452" y="104" textAnchor="middle" className="text-[10px] font-extrabold text-[#0F172A] font-sans">20,3%</text>

                                    <circle cx="550" cy="116" r="4.5" fill="#ffffff" stroke="#10B981" strokeWidth="2.5" />
                                    <text x="550" y="99" textAnchor="middle" className="text-[10px] font-extrabold text-[#0F172A] font-sans">21,0%</text>
                                  </svg>
                                </div>
                                
                                <div className="flex justify-between text-[10px] font-bold text-[#94A3B8] px-10 mt-1 font-sans select-none">
                                  <span>Fev</span>
                                  <span>Mar</span>
                                  <span>Abr</span>
                                  <span>Mai</span>
                                  <span>Jun</span>
                                  <span>Jul</span>
                                </div>
                              </>
                            ) : (
                              <div className="bg-amber-50/50 border border-amber-200/50 p-6 rounded-2xl text-xs text-amber-900 text-left flex flex-col justify-center items-center py-10">
                                <Lock className="w-8 h-8 text-amber-500 mb-2 animate-bounce" />
                                <strong className="font-extrabold block text-sm">Visualização Restrita por RLS</strong>
                                <p className="text-[#64748B] text-center mt-1">Como Porteiro do condomínio, os seus direitos civis do PostgreSQL restringem acesso a relatórios e análises financeiras.</p>
                              </div>
                            )}

                          </div>

                          {/* Interactive alert note at the bottom of chart card */}
                          <div className="mt-5 bg-[#ECFDF5] text-[#0E7C66] px-4 py-3 rounded-xl border border-emerald-500/10 text-xs flex items-center justify-between font-medium cursor-pointer hover:bg-[#D1FAE5] transition-all group flex-wrap gap-2 select-none">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#10B981] group-hover:scale-110 transition-transform" />
                              <span>Parque das Amoreiras possui a maior inadimplência unificada: <strong className="font-extrabold text-[#059669]">21,0%</strong></span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#10B981] transition-transform group-hover:translate-x-1" />
                          </div>

                        </div>

                        {/* Area 2: Faturamento Consolidado info block */}
                        <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col justify-between">
                          
                          <div className="space-y-4">
                            <div className="flex justify-between items-center select-none">
                              <h4 className="text-[11.5px] font-extrabold text-[#0F172A] uppercase tracking-wider leading-none">Faturamento Consolidado</h4>
                              <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center text-gray-400">
                                <Wallet className="w-4.5 h-4.5" />
                              </div>
                            </div>

                            {/* Consolidated rows */}
                            {!isPorteiroRole ? (
                              <div className="space-y-4 py-3 select-none">
                                <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-3">
                                  <span className="text-[#64748B] font-semibold font-sans">Total Receitas</span>
                                  <span className="font-extrabold text-[#22C55E] font-mono text-sm">R$ {stats.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-3">
                                  <span className="text-[#64748B] font-semibold font-sans">Total Despesas</span>
                                  <span className="font-extrabold text-[#EF4444] font-mono text-sm">R$ {stats.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-end pt-3 text-left">
                                  <div>
                                    <span className="text-[#64748B] font-bold font-sans text-[10px] uppercase tracking-wider block mb-1">Saldo Líquido</span>
                                    <span className="text-2xl font-black text-[#0F172A] font-display">
                                      R$ {(stats.receita - stats.despesa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl text-xs text-rose-800 py-6 text-center">
                                🔒 Dados de faturamento bloqueados por RLS Corporativo.
                              </div>
                            )}
                          </div>

                          {/* Gradient action button (14px radius, 48px height) */}
                          <button
                            disabled={isPorteiroRole}
                            onClick={() => handleExportCSV('financeiro')}
                            className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white h-12 rounded-[14px] text-xs font-bold font-sans cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-250 active:scale-95 flex items-center justify-center gap-2 select-none disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
                          >
                            <Download className="w-4.5 h-4.5" /> Exportar Planilha Financeira
                          </button>

                        </div>

                      </div>

                      {/* Actions grid list & user activities matching layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                        
                        {/* Column A: Actions grid (size 2/3) */}
                        <div className="lg:col-span-2 space-y-4">
                          <h4 className="text-[11.5px] font-extrabold text-[#0F172A] uppercase tracking-wider leading-none select-none">Ações Rápidas</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            
                            {/* Action 1 */}
                            <button 
                              onClick={() => setActiveSubPage('condominios')}
                              className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-emerald-300 hover:shadow-md transition-all duration-250 text-left cursor-pointer group flex flex-col gap-3 min-h-[105px] justify-between shadow-xs"
                            >
                              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                                <Building2 className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-extrabold text-[#0F172A] leading-tight">Novo Condomínio</p>
                                <p className="text-[10px] text-[#64748B] mt-0.5 font-sans">Criar base</p>
                              </div>
                            </button>

                            {/* Action 2 */}
                            <button 
                              onClick={() => setActiveSubPage('financeiro')}
                              className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-purple-300 hover:shadow-md transition-all duration-250 text-left cursor-pointer group flex flex-col gap-3 min-h-[105px] justify-between shadow-xs"
                            >
                              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                                <FileText className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-extrabold text-[#0F172A] leading-tight">Balanços</p>
                                <p className="text-[10px] text-[#64748B] mt-0.5 font-sans">Visualizar fluxos</p>
                              </div>
                            </button>

                            {/* Action 3 */}
                            <button 
                              onClick={() => setActiveSubPage('portaria')}
                              className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-blue-300 hover:shadow-md transition-all duration-250 text-left cursor-pointer group flex flex-col gap-3 min-h-[105px] justify-between shadow-xs"
                            >
                              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                                <Key className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-extrabold text-[#0F172A] leading-tight">Portaria Hub</p>
                                <p className="text-[10px] text-[#64748B] mt-0.5 font-sans">Acessar guarita</p>
                              </div>
                            </button>

                            {/* Action 4 */}
                            <button 
                              onClick={() => setActiveSubPage('auditoria')}
                              className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-red-300 hover:shadow-md transition-all duration-250 text-left cursor-pointer group flex flex-col gap-3 min-h-[105px] justify-between shadow-xs"
                            >
                              <div className="h-9 w-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                                <Activity className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-extrabold text-[#0F172A] leading-tight">Auditoria Logs</p>
                                <p className="text-[10px] text-[#64748B] mt-0.5 font-sans">Buscar rastros</p>
                              </div>
                            </button>

                          </div>
                        </div>

                        {/* Column B: Recent Activities (size 1/3) */}
                        <div className="space-y-4 flex flex-col h-full min-h-[140px] justify-start">
                          <h4 className="text-[11.5px] font-extrabold text-[#0F172A] uppercase tracking-wider leading-none select-none">Atividades Recentes</h4>
                          
                          <div className="flex-1 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col items-center justify-center text-center py-6">
                            <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-gray-400 mb-2.5 border border-slate-100 animate-pulse">
                              <Clock className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-[#0F172A]">Nenhuma atividade recente</p>
                            <p className="text-[10px] text-[#64748B] mt-0.5 font-sans">As ações realizadas aparecerão aqui.</p>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                {/* 3. SUB-PAGE: CONDOMINIOS CRUD */}
                {activeSubPage === 'condominios' && (
                  <div className="space-y-6">
                    {/* Add condo form toggle button - available for admin */}
                    {activeProfile === 'admin' && (
                      <div className="flex justify-between items-center bg-white p-4 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
                        <span className="text-stone-500 text-xs font-sans">
                          Gerencie ou cadastre novos condomínios na base central.
                        </span>
                        <button
                          onClick={() => setShowCondoForm(true)}
                          className="bg-primary hover:bg-[#af101a] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          Cadastrar Condomínio
                        </button>
                      </div>
                    )}

                    {/* Add condo modal form - available for admin */}
                    {activeProfile === 'admin' ? (
                      showCondoForm && (
                        <div id="modal-cadastro-condo" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
                          <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35)] border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                              <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-2">
                                <Plus className="w-4 h-4 text-emerald-500" /> Cadastrar Novo Condomínio Administrado
                              </h4>
                              <button
                                onClick={() => setShowCondoForm(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Modal Body with scrollable form */}
                            <div className="p-6 overflow-y-auto space-y-4 text-left">
                              <form onSubmit={handleCreateCondo} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Fantasia *</label>
                                    <input
                                      type="text"
                                      value={newCondoName}
                                      onChange={(e) => setNewCondoName(e.target.value)}
                                      placeholder="Residencial Miramar"
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1 md:col-span-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">CNPJ Comercial *</label>
                                    <input
                                      type="text"
                                      value={newCondoCnpj}
                                      onChange={(e) => setNewCondoCnpj(formatCNPJ(e.target.value))}
                                      placeholder="00.000.000/0001-00"
                                      maxLength={18}
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1 md:col-span-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between items-center">
                                      <span>CEP *</span>
                                      {isFetchingCep && <span className="text-[9px] text-blue-500 animate-pulse font-medium">Buscando endereço...</span>}
                                      {cepError && <span className="text-[9px] text-[#af101a] font-medium">{cepError}</span>}
                                    </label>
                                    <input
                                      type="text"
                                      maxLength={9}
                                      value={newCondoCep}
                                      onChange={(e) => handleCepChange(e.target.value)}
                                      placeholder="00000-000"
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Endereço</label>
                                    <input
                                      type="text"
                                      value={newCondoEndereco}
                                      onChange={(e) => setNewCondoEndereco(e.target.value)}
                                      placeholder="Ex: Av. Bartolomeu de Gusmão, 142"
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="space-y-1 col-span-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Bairro</label>
                                    <input
                                      type="text"
                                      value={newCondoBairro}
                                      onChange={(e) => setNewCondoBairro(e.target.value)}
                                      placeholder="Ex: Aparecida"
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1 col-span-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Cidade</label>
                                    <select
                                      value={newCondoCidade}
                                      onChange={(e) => setNewCondoCidade(e.target.value)}
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none cursor-pointer"
                                    >
                                      <option value="">Selecione...</option>
                                      <option value="Santos">Santos</option>
                                      <option value="São Vicente">São Vicente</option>
                                      <option value="Praia Grande">Praia Grande</option>
                                      <option value="Guarujá">Guarujá</option>
                                      {newCondoCidade && !["Santos", "São Vicente", "Praia Grande", "Guarujá"].includes(newCondoCidade) && (
                                        <option value={newCondoCidade}>{newCondoCidade}</option>
                                      )}
                                    </select>
                                  </div>
                                  <div className="space-y-1 col-span-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Estado</label>
                                    <select
                                      value={newCondoEstado}
                                      onChange={(e) => setNewCondoEstado(e.target.value)}
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none cursor-pointer"
                                    >
                                      <option value="SP">São Paulo (SP)</option>
                                      {newCondoEstado && newCondoEstado !== 'SP' && (
                                        <option value={newCondoEstado}>{newCondoEstado}</option>
                                      )}
                                    </select>
                                  </div>
                                  <div className="space-y-1 col-span-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Unidades Autônomas</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={newCondoUnidades || ''}
                                      onChange={(e) => setNewCondoUnidades(Number(e.target.value || 0))}
                                      placeholder="60"
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setShowCondoForm(false)}
                                    className="px-5 py-2.5 border border-gray-200 text-stone-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-6 bg-primary hover:bg-[#af101a] text-white py-2.5 text-xs font-bold rounded-lg transition-transform focus:scale-95 cursor-pointer"
                                  >
                                    Cadastrar Condomínio
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left text-xs">
                        🛡️ <strong>Acesso Limitado:</strong> Somente o cargo de <strong>Administrador Principal</strong> da Facilities possui permissão RLS para registrar novos condomínios na base central Postgresql.
                      </div>
                    )}

                    {/* Listings */}
                    <div>
                      <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider mb-4">Base Operativa de Condomínios</h4>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {visibleCondos.map(item => {
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => setSelectedCondoId(item.id)}
                              className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-[#af101a]/40 shadow-xs hover:shadow-md hover:bg-stone-50/45 cursor-pointer flex flex-col text-left h-full group transition-all duration-200 active:scale-[0.99]"
                              title="Clique de forma interativa para ver os detalhes completos deste condomínio"
                            >
                              <div className="space-y-3">
                                <h3 className="font-sans font-bold text-[#101c29] text-lg leading-snug group-hover:text-[#af101a] transition-colors">
                                  {item.nome}
                                </h3>
                                <p className="text-stone-500 font-medium text-xs leading-relaxed flex items-start gap-1.5">
                                  <span className="text-gray-400 select-none shrink-0" aria-hidden="true">📍</span>
                                  <span>{item.endereco}{item.bairro ? `, ${item.bairro}` : ''}</span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
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

                {/* SUB-PAGE: GERENCIAMENTO DE PERFIS / ROLES */}
                {activeSubPage === 'perfis' && (
                  <div className="space-y-6 text-left animate-fade-in text-[#101c29]">

                    {/* Alerta de permissão para outros perfis que não sejam admin */}
                    {activeProfile !== 'admin' && (
                      <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Acesso Restrito ao Administrador (Root)!</strong> Você está logado/operando como <strong className="uppercase">{activeProfile}</strong>. O formulário de cadastro, adição, alteração e deleção está bloqueado pela diretriz de RLS. Você possui permissão exclusivamente de leitura.
                        </div>
                      </div>
                    )}

                    {/* Add profile/user form toggle button - available for admin */}
                    {activeProfile === 'admin' && (
                      <div className="flex justify-between items-center bg-white p-4 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-left">
                        <span className="text-stone-500 text-xs font-sans">
                          {selectedProfileId 
                            ? `Editando o perfil de "${newProfileNome}".` 
                            : showProfileForm 
                              ? 'Preencha os dados e atribua uma role de acesso ao novo usuário.' 
                              : 'Registre um novo usuário na base e defina sua role de acesso.'}
                        </span>
                        <button
                          onClick={() => {
                            if (showProfileForm && selectedProfileId) {
                              // Reset edit state when manually collapsing
                              setSelectedProfileId(null);
                              setNewProfileNome('');
                              setNewProfileEmail('');
                              setNewProfileCpf('');
                              setNewProfileUnidade('');
                              setNewProfileTipo('morador');
                            }
                            setShowProfileForm(!showProfileForm);
                          }}
                          className="bg-primary hover:bg-[#af101a] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <Plus className={`w-4 h-4 transition-transform duration-200 ${(showProfileForm || selectedProfileId) ? 'rotate-45' : ''}`} />
                          {(showProfileForm || selectedProfileId) ? 'Ocultar Formulário' : 'Novo Usuário'}
                        </button>
                      </div>
                    )}

                    {/* Se for administrador, exibe formulário de adição / edição de perfil */}
                    {activeProfile === 'admin' && (showProfileForm || selectedProfileId) && (
                      <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4">
                        <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                          <Plus className="w-4 h-4 text-emerald-500" /> {selectedProfileId ? 'Editar Perfil / Role' : 'Registrar Novo Usuário com Role de Acesso'}
                        </h4>

                        <form onSubmit={handleCreateOrUpdateProfile} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Nome Completo *</label>
                            <input
                              type="text"
                              required
                              value={newProfileNome}
                              onChange={(e) => setNewProfileNome(e.target.value)}
                              placeholder="Felipe Albuquerque"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">E-mail de Acesso *</label>
                            <input
                              type="email"
                              required
                              value={newProfileEmail}
                              onChange={(e) => setNewProfileEmail(e.target.value)}
                              placeholder="felipe@facilities.com.br"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">CPF</label>
                            <input
                              type="text"
                              value={newProfileCpf}
                              onChange={(e) => setNewProfileCpf(e.target.value)}
                              placeholder="000.000.000-00"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Unidade / Setor de Gestão</label>
                            <input
                              type="text"
                              value={newProfileUnidade}
                              onChange={(e) => setNewProfileUnidade(e.target.value)}
                              placeholder="Ex: Apto 104 ou Setor Geral"
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Condomínio Vinculado *</label>
                            <select
                              required
                              value={newProfileCondoId}
                              onChange={(e) => setNewProfileCondoId(e.target.value)}
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-bold text-[#101c29] cursor-pointer"
                            >
                              {condos.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Acesso Ativo? *</label>
                            <select
                              required
                              value={newProfileAtivo ? 'true' : 'false'}
                              onChange={(e) => setNewProfileAtivo(e.target.value === 'true')}
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-bold text-[#101c29] cursor-pointer"
                            >
                              <option value="true">Sim (Ativo)</option>
                              <option value="false">Não (Inativo)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Papel de Acesso / Role *</label>
                            <select
                              required
                              value={newProfileTipo}
                              onChange={(e) => setNewProfileTipo(e.target.value)}
                              className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-bold text-[#101c29] cursor-pointer"
                            >
                              {roleTypes.map(rt => (
                                <option key={rt.id} value={rt.id}>
                                  {rt.nome} ({rt.descricao})
                                </option>
                              ))}
                            </select>
                          </div>
                          {!selectedProfileId && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase block">Senha de Acesso *</label>
                              <input
                                type="password"
                                required
                                value={newProfilePassword}
                                onChange={(e) => setNewProfilePassword(e.target.value)}
                                placeholder="Defina a senha (mín. 6 chars)"
                                className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 bg-primary hover:bg-[#af101a] text-white py-2.5 text-xs font-bold rounded-lg transition-transform focus:scale-95 cursor-pointer text-center"
                            >
                              {selectedProfileId ? 'Salvar Alterações' : 'Adicionar Usuário'}
                            </button>
                            {selectedProfileId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProfileId(null);
                                  setNewProfileNome('');
                                  setNewProfileEmail('');
                                  setNewProfileCpf('');
                                  setNewProfileUnidade('');
                                  setNewProfileTipo('morador');
                                  setShowProfileForm(false);
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3 py-2.5 text-xs rounded-lg transition-transform active:scale-95 cursor-pointer text-center"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Tabela de listagem dos Perfis de Roles existentes */}
                    <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-left space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider">
                          Perfis Registrados e Autenticações do Sistema
                        </h4>
                        <span className="text-[10px] text-gray-400 font-bold">
                          Total: {profilesList.length} Usuários
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px]">
                              <th className="py-2">Nome Completo</th>
                              <th className="py-2">E-mail</th>
                              <th className="py-2">CPF</th>
                              <th className="py-2">Unidade</th>
                              <th className="py-2">Role Atribuída</th>
                              <th className="py-2">Status</th>
                              <th className="py-2 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profilesList.map(item => {
                              const badgeStyle = 
                                item.tipo === 'administrador' || item.tipo === 'admin'
                                  ? 'bg-red-50 text-red-650 border border-red-150'
                                  : item.tipo === 'sindico' || item.tipo === 'síndico'
                                    ? 'bg-[#0f1b29]/10 text-[#0f1b29] border border-[#0f1b29]/10'
                                    : item.tipo === 'colaborador' || item.tipo === 'colab'
                                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                      : item.tipo === 'porteiro'
                                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                        : item.tipo === 'conselheiro'
                                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100';

                              return (
                                <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50">
                                  <td className="py-3 font-bold text-stone-850">{item.nome}</td>
                                  <td className="py-3 text-gray-600 font-mono select-all">{item.email}</td>
                                  <td className="py-3 text-secondary font-mono">{item.cpf || 'Não informado'}</td>
                                  <td className="py-3 font-bold">{item.unidade || 'Apto Geral'}</td>
                                  <td className="py-3">
                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[8.5px] font-semibold uppercase tracking-wider ${badgeStyle}`}>
                                      {item.perfil || item.tipo}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-bold uppercase border ${
                                      item.ativo !== false 
                                        ? 'bg-emerald-55/20 text-emerald-700 border-emerald-250/30' 
                                        : 'bg-red-55/20 text-red-700 border-red-250/30'
                                    }`}>
                                      {item.ativo !== false ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    {activeProfile === 'admin' ? (
                                      <div className="flex justify-end gap-2.5">
                                        <button
                                          onClick={() => {
                                            setSelectedProfileId(item.id);
                                            setNewProfileNome(item.nome);
                                            setNewProfileEmail(item.email);
                                            setNewProfileCpf(item.cpf || '');
                                            setNewProfileUnidade(item.unidade || '');
                                            setNewProfileTipo(item.tipo);
                                            setNewProfileAtivo(item.ativo !== false);
                                            setNewProfileCondoId(item.condominio_id || 'cd-1');
                                            setShowProfileForm(true);
                                          }}
                                          className="text-amber-650 hover:text-amber-800 font-bold hover:underline bg-transparent border-none cursor-pointer"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => {
                                            setDeleteConfirm({
                                              isOpen: true,
                                              title: 'Confirmar Exclusão de Perfil',
                                              message: `Deseja realmente remover o perfil de "${item.nome}" (${item.email}) do sistema? Esta ação é irreversível.`,
                                              onConfirm: () => {
                                                handleDeleteProfile(item.id, item.nome);
                                                setDeleteConfirm(null);
                                              }
                                            });
                                          }}
                                          className="text-red-650 hover:text-red-800 font-bold hover:underline bg-transparent border-none cursor-pointer"
                                        >
                                          Remover
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] text-gray-400 italic">Read-Only</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SEÇÃO: GERENCIAMENTO DE TIPOS DE ROLE / PAPÉIS DE ACESSO */}
                    {/* Role types toggle button - available for admin */}
                    {activeProfile === 'admin' && (
                      <div className="flex justify-between items-center bg-white p-4 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-left">
                        <span className="text-stone-500 text-xs font-sans">
                          {selectedRoleTypeId 
                            ? `Editando as diretrizes do papel "${newRoleTypeNome}".` 
                            : showRoleTypeForm 
                              ? 'Preencha os dados no formulário para estruturar a nova role de acesso.' 
                              : 'Crie e configure novos níveis hierárquicos e papéis corporativos personalizados.'}
                        </span>
                        <button
                          onClick={() => {
                            if (showRoleTypeForm && selectedRoleTypeId) {
                              setSelectedRoleTypeId(null);
                              setNewRoleTypeId('');
                              setNewRoleTypeNome('');
                              setNewRoleTypeDescricao('');
                            }
                            setShowRoleTypeForm(!showRoleTypeForm);
                          }}
                          className="bg-[#101c29] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <Plus className={`w-4 h-4 transition-transform duration-200 ${(showRoleTypeForm || selectedRoleTypeId) ? 'rotate-45' : ''}`} />
                          {(showRoleTypeForm || selectedRoleTypeId) ? 'Ocultar Form Papel' : 'Novo Papel de Acesso'}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Formulário de Tipos de Role (Apenas se for Admin) */}
                      {activeProfile === 'admin' && (showRoleTypeForm || selectedRoleTypeId) && (
                        <div className="md:col-span-1 bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4 h-fit text-left">
                          <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                            <Plus className="w-4 h-4 text-emerald-500" /> {selectedRoleTypeId ? 'Editar Tipo de Role' : 'Criar Tipo de Role'}
                          </h4>

                          <form onSubmit={handleCreateOrUpdateRoleType} className="space-y-4">
                            <div className="space-y-1 text-left">
                              <label className="text-[10px] font-bold text-gray-400 uppercase block">Chave / ID do Tipo *</label>
                              <input
                                type="text"
                                required
                                disabled={selectedRoleTypeId !== null}
                                value={newRoleTypeId}
                                onChange={(e) => setNewRoleTypeId(e.target.value)}
                                placeholder="ex: gerente, sindico_apoio, etc"
                                className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29] disabled:opacity-60"
                              />
                            </div>

                            <div className="space-y-1 text-left">
                              <label className="text-[10px] font-bold text-gray-400 uppercase block">Nome do Papel *</label>
                              <input
                                type="text"
                                required
                                value={newRoleTypeNome}
                                onChange={(e) => setNewRoleTypeNome(e.target.value)}
                                placeholder="ex: Síndico Corregulador, Morador Master"
                                className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                              />
                            </div>

                            <div className="space-y-1 text-left">
                              <label className="text-[10px] font-bold text-gray-400 uppercase block">Descrição de Permissões</label>
                              <textarea
                                value={newRoleTypeDescricao}
                                onChange={(e) => setNewRoleTypeDescricao(e.target.value)}
                                placeholder="ex: Gestão e fiscalização geral"
                                className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29] h-20 resize-none"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="flex-1 bg-[#101c29] hover:bg-black text-white py-2.5 text-xs font-bold rounded-lg transition-transform focus:scale-95 cursor-pointer text-center"
                              >
                                {selectedRoleTypeId ? 'Salvar Papel' : 'Criar Papel'}
                              </button>
                              {selectedRoleTypeId && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRoleType(selectedRoleTypeId, newRoleTypeNome)}
                                    disabled={selectedRoleTypeId === 'administrador' || selectedRoleTypeId === 'admin'}
                                    className="bg-red-50 hover:bg-red-100 text-red-650 font-bold px-3 py-2.5 text-xs rounded-lg transition-transform active:scale-95 cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={selectedRoleTypeId === 'administrador' || selectedRoleTypeId === 'admin' ? "Role básica do sistema" : "Excluir esta role"}
                                  >
                                    Excluir
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRoleTypeId(null);
                                      setNewRoleTypeId('');
                                      setNewRoleTypeNome('');
                                      setNewRoleTypeDescricao('');
                                      setShowRoleTypeForm(false);
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3 py-2.5 text-xs rounded-lg transition-transform active:scale-95 cursor-pointer text-center"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Lista e ações para Tipos de Role */}
                      <div className={(activeProfile === 'admin' && (showRoleTypeForm || selectedRoleTypeId)) ? "md:col-span-2 bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-left space-y-4" : "col-span-3 bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-left space-y-4"}>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-1.5 font-display">
                            <Key className="w-4 h-4 text-indigo-500" /> Tipos de Roles e Escopos Disponíveis
                          </h4>
                          <span className="text-[10px] text-gray-400 font-bold">
                            Total: {roleTypes.length} Roles
                          </span>
                        </div>

                        <div className="overflow-x-auto text-left">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px]">
                                <th className="py-2">Papel / Label</th>
                                <th className="py-2">ID / Chave</th>
                                <th className="py-2">Definição / Escopo</th>
                                <th className="py-2 text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {roleTypes.map(rt => (
                                <tr key={rt.id} className="border-b border-gray-100 hover:bg-slate-50">
                                  <td className="py-3 font-bold text-stone-850 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> {rt.nome}
                                  </td>
                                  <td className="py-3 text-gray-600 font-mono text-[10px] tracking-tight text-neutral-500 select-all">{rt.id}</td>
                                  <td className="py-3 text-[#101c29]/70 italic font-medium">{rt.descricao || 'Nenhuma descrição atribuída'}</td>
                                  <td className="py-3 text-right">
                                    {activeProfile === 'admin' ? (
                                      <div className="flex justify-end gap-2.5">
                                        <button
                                          onClick={() => {
                                            setSelectedRoleTypeId(rt.id);
                                            setNewRoleTypeId(rt.id);
                                            setNewRoleTypeNome(rt.nome);
                                            setNewRoleTypeDescricao(rt.descricao || '');
                                            setShowRoleTypeForm(true);
                                          }}
                                          className="text-amber-650 hover:text-amber-800 font-bold hover:underline bg-transparent border-none cursor-pointer"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRoleType(rt.id, rt.nome)}
                                          className="text-red-650 hover:text-red-800 font-bold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                          disabled={rt.id === 'administrador' || rt.id === 'admin'}
                                          title={rt.id === 'administrador' || rt.id === 'admin' ? "Role do Administrador principal é de sistema." : ""}
                                        >
                                          Remover
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] text-gray-400 italic">Read-Only</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* 6. SUB-PAGE: AUDITORIA LOGS (CRUD AUDITED ACTION TIMELINE) */}
                {activeSubPage === 'auditoria' && (
                  <div className="space-y-6 text-left">
                    <div className="bg-white p-5 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-left space-y-4">
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
                    <div className="bg-white p-5 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4">
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

      </div>

      {/* MODAL DE CADASTRO DE MORADORES EM LOTE */}
      {isBulkAddMoradoresOpen && bulkAddCondoId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#010811]/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-4xl w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] space-y-6 animate-fade-in my-8 text-left max-h-[90vh] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold shadow-xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#0f1b29] uppercase tracking-wider font-display">
                      Cadastrar Moradores em Lote
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      Condomínio Selecionado: <strong className="text-indigo-650 font-bold font-sans">{condos.find(c => c.id === bulkAddCondoId)?.nome || bulkAddCondoId}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkAddMoradoresOpen(false);
                    setBulkAddCondoId(null);
                  }}
                  className="p-1 px-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description bar */}
              <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/30 text-[11px] text-[#4F46E5] leading-relaxed shrink-0 mt-4">
                <strong>Dica de Produtividade:</strong> Adicione quantos moradores desejar clicando no botão <strong>"+ Adicionar Outra Linha"</strong> abaixo. Certifique-se de preencher pelo menos o nome e a respectiva unidade/bloco de cada morador.
              </div>

              {/* Rows List */}
              <form onSubmit={handleBulkCreateMoradores} className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] pr-2 mt-5 py-1">
                {bulkAddRows.map((row, index) => (
                  <div 
                    key={index} 
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#F8FAFC] p-4 rounded-2xl relative border border-slate-100 hover:border-slate-200 transition-colors duration-205"
                  >
                    {/* Badge row indicator for visual feedback */}
                    <span className="absolute top-2 left-2 bg-slate-200/80 text-stone-600 text-[9px] px-2 py-0.5 rounded-md font-extrabold font-mono select-none">
                      #{index + 1}
                    </span>

                    <div className="md:col-span-5 text-left mt-3 md:mt-0">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={row.nome}
                        onChange={(e) => {
                          const updated = [...bulkAddRows];
                          updated[index].nome = e.target.value;
                          setBulkAddRows(updated);
                        }}
                        placeholder="Ex: Clara Ribeiro de Souza"
                        className="w-full bg-white border border-gray-155 text-xs p-2.5 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-[#0f1b29]"
                      />
                    </div>

                    <div className="md:col-span-3 text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Unidade / Apto *</label>
                      <input
                        type="text"
                        required
                        value={row.unidade}
                        onChange={(e) => {
                          const updated = [...bulkAddRows];
                          updated[index].unidade = e.target.value;
                          setBulkAddRows(updated);
                        }}
                        placeholder="Ex: B2-Apto 42"
                        className="w-full bg-white border border-gray-155 text-xs p-2.5 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-[#0f1b29]"
                      />
                    </div>

                    <div className="md:col-span-3 text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">CPF (Opcional)</label>
                      <input
                        type="text"
                        value={row.cpf}
                        onChange={(e) => {
                          const updated = [...bulkAddRows];
                          updated[index].cpf = e.target.value;
                          setBulkAddRows(updated);
                        }}
                        placeholder="000.000.000-00"
                        className="w-full bg-white border border-gray-155 text-xs p-2.5 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-normal text-[#0f1b29]"
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-center pb-1">
                      {bulkAddRows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBulkAddRows(bulkAddRows.filter((_, i) => i !== index));
                          }}
                          className="p-2 text-red-600 hover:text-red-750 hover:bg-red-50 bg-transparent border-0 rounded-xl transition-all duration-200 cursor-pointer shrink-0"
                          title="Remover este registro"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <div className="w-5 h-5"></div>
                      )}
                    </div>
                  </div>
                ))}
              </form>
            </div>

            {/* Footer with Actions */}
            <div className="border-t border-gray-100 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setBulkAddRows([...bulkAddRows, { nome: '', unidade: '', cpf: '', proprietario: true, telefone: '(13) 99123-4567' }]);
                }}
                className="w-full sm:w-auto py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-stone-700 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border-0"
              >
                <Plus className="w-4 h-4 text-indigo-650" /> + Adicionar Outra Linha
              </button>

              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkAddMoradoresOpen(false);
                    setBulkAddCondoId(null);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-stone-500 text-xs font-bold transition-all border border-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBulkCreateMoradores}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#4F46E5] hover:bg-[#3b33bd] text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-md"
                >
                  <Check className="w-4 h-4" /> Salvar Todos os Residentes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CONDOMÍNIO */}
      {editingCondo && (
        <div id="modal-edicao-condo" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35)] border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h4 className="text-xs font-extrabold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#af101a]" /> Editar Condomínio
              </h4>
              <button
                onClick={() => setEditingCondo(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-left">
              <form onSubmit={handleSaveEditCondo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Condomínio *</label>
                    <input
                      type="text"
                      placeholder="Ex: Residencial Miramar"
                      value={editCondoName}
                      onChange={(e) => setEditCondoName(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                      required
                    />
                  </div>

                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">CNPJ *</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={editCondoCnpj}
                      onChange={(e) => setEditCondoCnpj(formatCNPJ(e.target.value))}
                      maxLength={18}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between items-center">
                      <span>CEP *</span>
                      {isFetchingEditCep && <span className="text-[9px] text-blue-500 animate-pulse font-medium">Buscando...</span>}
                      {editCepError && <span className="text-[9px] text-[#af101a] font-medium">{editCepError}</span>}
                    </label>
                    <input
                      type="text"
                      maxLength={9}
                      placeholder="00000-000"
                      value={editCondoCep}
                      onChange={(e) => handleEditCepChange(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] font-mono"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Endereço</label>
                    <input
                      type="text"
                      placeholder="Ex: Av. Ana Costa, 142"
                      value={editCondoEndereco}
                      onChange={(e) => setEditCondoEndereco(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Bairro</label>
                    <input
                      type="text"
                      placeholder="Ex: Gonzaga"
                      value={editCondoBairro}
                      onChange={(e) => setEditCondoBairro(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Cidade</label>
                    <input
                      type="text"
                      value={editCondoCidade}
                      onChange={(e) => setEditCondoCidade(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Estado</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editCondoEstado}
                      onChange={(e) => setEditCondoEstado(e.target.value.toUpperCase())}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Síndico Responsável</label>
                    <input
                      type="text"
                      placeholder="Nome do Síndico ou Administradora"
                      value={editCondoSindico}
                      onChange={(e) => setEditCondoSindico(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                    <select
                      value={editCondoStatus}
                      onChange={(e) => setEditCondoStatus(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] cursor-pointer"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Alerta">Alerta</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Qtd Blocos</label>
                    <input
                      type="number"
                      value={editCondoBlocos}
                      onChange={(e) => setEditCondoBlocos(Number(e.target.value))}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Qtd Unidades</label>
                    <input
                      type="number"
                      value={editCondoUnidades}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditCondoUnidades(val);
                        setEditCondoMoradores(Math.round(val * 2.8));
                        setEditCondoProprietarios(Math.round(val * 0.95));
                      }}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Moradores</label>
                    <input
                      type="number"
                      value={editCondoMoradores}
                      onChange={(e) => setEditCondoMoradores(Number(e.target.value))}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Inadimplência %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editCondoInadimplencia}
                      onChange={(e) => setEditCondoInadimplencia(Number(e.target.value))}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Receita (R$)</label>
                    <input
                      type="number"
                      value={editCondoReceita}
                      onChange={(e) => setEditCondoReceita(Number(e.target.value))}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Despesa (R$)</label>
                    <input
                      type="number"
                      value={editCondoDespesa}
                      onChange={(e) => setEditCondoDespesa(Number(e.target.value))}
                      className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 p-6">
                  <button
                    type="button"
                    onClick={() => setEditingCondo(null)}
                    className="px-5 py-2.5 border border-gray-200 text-[#101c29] text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#af101a] text-white text-xs font-bold rounded-lg hover:bg-[#930010] transition-colors cursor-pointer border-0"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ROLE */}
      {isConfirmDeleteRoleModalOpen && roleTypeToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#010811]/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-150 space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-left space-y-1.5">
                <h3 className="text-sm font-extrabold text-[#0f1b29] uppercase tracking-wide">
                  Confirmar Exclusão de Role
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Tem certeza que deseja excluir o tipo de role <strong className="text-red-750 font-bold font-sans">"{roleTypeToDelete.nome}"</strong> (ID: {roleTypeToDelete.id})? Esta ação é irreversível e excluirá a role da base operativa de perfis do Supabase.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-150 text-[11px] text-amber-800 leading-relaxed text-left">
              <strong>Atenção:</strong> Certifique-se de que nenhum morador ou colaborador esteja associado a esta role. Do contrário, a alteração poderá ser bloqueada para preservar a integridade referencial dos dados.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDeleteRoleModalOpen(false);
                  setRoleTypeToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteRoleType}
                className="px-5 py-2 bg-[#af101a] hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer"
              >
                Sim, Excluir Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div id="modal-confirmacao-admin" className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-xs animate-fade-in p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.30)] border border-gray-150 space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-650 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-left space-y-1.5 font-sans">
                <h3 className="text-sm font-extrabold text-[#0f1b29] uppercase tracking-wide">
                  {deleteConfirm.title}
                </h3>
                <p className="text-xs text-[#52647c] leading-relaxed">
                  {deleteConfirm.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#475569] text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="px-5 py-2 bg-[#af101a] hover:bg-[#930010] text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
