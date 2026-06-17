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
  Plus,
  Search,
  Filter,
  ArrowRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Boleto, Booking, Assembly, Ticket } from '../types';
import { supabase, isSupabaseConfigured, saveSimulatedData, getSimulatedData, insertResilient, updateResilient, supabaseUrl, supabaseAnonKey } from '../lib/supabaseClient';
import { usePortalRouter } from './PortalRouter';
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

const getCondoOverrides = (): Record<string, any> => {
  try {
    const saved = localStorage.getItem('condo_metadata_overrides');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

const saveCondoOverride = (id: string, data: any) => {
  try {
    const overrides = getCondoOverrides();
    overrides[id] = { ...overrides[id], ...data };
    localStorage.setItem('condo_metadata_overrides', JSON.stringify(overrides));
  } catch (e) {
    console.error('Error saving condo override:', e);
  }
};

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification: (headline: string, text: string) => void;
  onLoginSuccess?: (username: string, profile: string, unit: string) => void;
}

export default function PortalModal({ isOpen, onClose, onShowNotification, onLoginSuccess }: PortalModalProps) {
  const router = usePortalRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCondoForm, setShowCondoForm] = useState(false);
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
  const [formTab, setFormTab] = useState<'login' | 'register' | 'esqueci-senha' | 'alterar-senha' | 'definir-senha'>('login');
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

  // Password definition parameters (for new collaborators invitation)
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAdmin, setInviteAdmin] = useState('');
  const [inviteAction, setInviteAction] = useState('invite'); // 'invite' or 'reset'
  const [inviteTempPass, setInviteTempPass] = useState('');
  const [defPass, setDefPass] = useState('');
  const [defPassConfirm, setDefPassConfirm] = useState('');

  // Sync state tab mode based on active router location hash
  useEffect(() => {
    const cleanHash = router.currentRoute.replace('#', '');
    const hashPath = cleanHash.split('?')[0];
    
    if (hashPath === 'login') {
      setFormTab('login');
    } else if (hashPath === 'register') {
      setFormTab('register');
    } else if (hashPath === 'esqueci-senha') {
      setFormTab('esqueci-senha');
    } else if (hashPath === 'alterar-senha') {
      setFormTab('alterar-senha');
    } else if (hashPath === 'definir-senha') {
      setFormTab('definir-senha');
      // Parse query parameters
      const queryPart = cleanHash.split('?')[1] || '';
      const params = new URLSearchParams(queryPart);
      setInviteEmail(params.get('email') || '');
      setInviteAdmin(params.get('admin') || 'Cristhiane Xavier');
      setInviteAction(params.get('action') || 'invite');
      setInviteTempPass(params.get('tempPass') || '');
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

  const handleDefinirSenhaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!defPass || !defPassConfirm) {
      onShowNotification('Alerta', 'Por favor, preencha todos os campos da senha.');
      return;
    }
    if (defPass !== defPassConfirm) {
      onShowNotification('Erro de Validação', 'A confirmação de senha não confere com a nova senha digitada.');
      return;
    }
    if (defPass.length < 6) {
      onShowNotification('Erro de Validação', 'A senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update the password in Supabase Auth if integrated
      if (isSupabaseConfigured && supabase) {
        // Se temos uma senha temporária em mãos, fazemos login antes para estabelecer sessão e podermos atualizar a senha!
        if (inviteTempPass) {
          try {
            console.log('Tentando signIn programático com tempPass:', inviteEmail);
            await supabase.auth.signInWithPassword({
              email: inviteEmail.trim(),
              password: inviteTempPass
            });
          } catch (signInErr: any) {
            console.warn('Tentativa de login prévio com tempPass falhou:', signInErr.message);
          }
        }

        try {
          const { error } = await supabase.auth.updateUser({
            password: defPass
          });
          if (error) {
            console.warn('Erro ao atualizar senha no Supabase Auth diretamente:', error.message);
          }
        } catch (authErr: any) {
          console.warn('Supabase auth update falhou:', authErr.message);
        }

        // Marcar o colaborador como "aceito" na tabela perfil do Supabase
        try {
          const { error } = await supabase.from('perfil')
            .update({ status_convite: 'aceito', ativo: true })
            .eq('email', inviteEmail);
          if (error) {
            console.error('Erro ao atualizar perfil no Supabase:', error.message);
          }
        } catch (profileErr: any) {
          console.error(profileErr);
        }
      }

      // 2. Sempre atualizar no nosso storage local de simulação offline (facilities_portal_users e supabase_sim_perfis)
      // para garantir que mesmo offline ou sem chaves/sessão ativa, o usuário consiga fazer o login local instantâneo!
      const savedUsers = localStorage.getItem('facilities_portal_users');
      if (savedUsers) {
        try {
          let users = JSON.parse(savedUsers);
          const uIdx = users.findIndex((u: any) => u.email.toLowerCase() === inviteEmail.toLowerCase());
          if (uIdx !== -1) {
            users[uIdx].pass = defPass;
            users[uIdx].ativo = true;
            localStorage.setItem('facilities_portal_users', JSON.stringify(users));
          }
        } catch (err) {
          console.error(err);
        }
      }

      const simPerfis = localStorage.getItem('supabase_sim_perfis');
      if (simPerfis) {
        try {
          let list = JSON.parse(simPerfis);
          const pIdx = list.findIndex((p: any) => p.email.toLowerCase() === inviteEmail.toLowerCase());
          if (pIdx !== -1) {
            list[pIdx].status_convite = 'aceito';
            list[pIdx].ativo = true;
            localStorage.setItem('supabase_sim_perfis', JSON.stringify(list));
          }
        } catch (err) {
          console.error(err);
        }
      }

      console.log(`Definir Senha Concluída para: ${inviteEmail}. Status: Ativo.`);
      onShowNotification('Senha Cadastrada!', 'Sua senha foi ativada com sucesso! Você está pronto para realizar o seu primeiro login.');
      
      setDefPass('');
      setDefPassConfirm('');
      setFormTab('login');
      window.location.hash = '#login';
    } catch (err: any) {
      onShowNotification('Erro', err.message || 'Falha ao salvar a senha de acesso.');
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
  const [condos, setCondos] = useState<any[]>(() => {
    const saved = localStorage.getItem('facilities_portal_condos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          const overrides = getCondoOverrides();
          return parsed.map((c: any) => {
            const over = overrides[c.id] || {};
            return {
              ...c,
              sindico: over.sindico || c.sindico || 'Administradora Facilities',
              unidades: Number(over.unidades ?? c.unidades ?? 80),
              moradores: Number(over.moradores ?? c.moradores ?? 224),
              proprietarios: Number(over.proprietarios ?? c.proprietarios ?? 76),
              receita: Number(over.receita ?? c.receita ?? 60000),
              despesa: Number(over.despesa ?? c.despesa ?? 49600),
              inadimplenciaPercent: Number(over.inadimplenciaPercent ?? c.inadimplenciaPercent ?? c.inadimplencia_percent ?? 5.0),
              status: over.status || c.status || 'Normal',
              blocosCount: Number(over.blocosCount ?? c.blocosCount ?? 2)
            };
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Default mock condos in Gonzaga/Santos
    return [
      {
        id: 'cd-gonzaga',
        nome: 'Condomínio Residencial Gonzaga Premium',
        cnpj: '12.345.678/0001-90',
        endereco: 'Av. Ana Costa, 540',
        bairro: 'Gonzaga',
        cidade: 'Santos',
        estado: 'SP',
        sindico: 'Dra. Cristhiane Xavier',
        unidades: 120,
        moradores: 336,
        proprietarios: 114,
        receita: 90000,
        despesa: 72000,
        inadimplenciaPercent: 4.5,
        status: 'Normal',
        blocosCount: 3
      },
      {
        id: 'cd-pontadapraia',
        nome: 'Residencial Costa Atlântica',
        cnpj: '98.765.432/0001-21',
        endereco: 'Av. Bartolomeu de Gusmão, 112',
        bairro: 'Ponta da Praia',
        cidade: 'Santos',
        estado: 'SP',
        sindico: 'Roberto Silva',
        unidades: 80,
        moradores: 224,
        proprietarios: 76,
        receita: 64000,
        despesa: 54000,
        inadimplenciaPercent: 12.0,
        status: 'Alerta',
        blocosCount: 2
      },
      {
        id: 'cd-guaruja',
        nome: 'Empresarial Enseada Corporate',
        cnpj: '45.678.901/0001-33',
        endereco: 'Av. Miguel Estéfno, 2400',
        bairro: 'Enseada',
        cidade: 'Guarujá',
        estado: 'SP',
        sindico: 'Administradora Facilities',
        unidades: 150,
        moradores: 420,
        proprietarios: 140,
        receita: 135000,
        despesa: 112000,
        inadimplenciaPercent: 2.1,
        status: 'Normal',
        blocosCount: 1
      },
      {
        id: 'cd-miramar',
        nome: 'Concept Miramar Living',
        cnpj: '23.456.789/0001-44',
        endereco: 'Rua Euclides da Cunha, 88',
        bairro: 'Pompéia',
        cidade: 'Santos',
        estado: 'SP',
        sindico: 'Lucas Ferreira',
        unidades: 60,
        moradores: 168,
        proprietarios: 57,
        receita: 48000,
        despesa: 41000,
        inadimplenciaPercent: 18.5,
        status: 'Crítico',
        blocosCount: 2
      }
    ];
  });
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Admin form state variables
  const [selectedCondoId, setSelectedCondoId] = useState<string | null>(null);
  const [newCondoName, setNewCondoName] = useState('');
  const [newCondoCnpj, setNewCondoCnpj] = useState('');
  const [newCondoSindico, setNewCondoSindico] = useState('');
  const [newCondoUnidades, setNewCondoUnidades] = useState(60);
  const [newCondoCidade, setNewCondoCidade] = useState('Santos');
  const [newCondoEstado, setNewCondoEstado] = useState('SP');
  const [newCondoEndereco, setNewCondoEndereco] = useState('');
  const [newCondoBairro, setNewCondoBairro] = useState('');
  const [newCondoCep, setNewCondoCep] = useState('');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  // Condo complete module features: filtration, view and edit states
  const [condoSearchQuery, setCondoSearchQuery] = useState('');
  const [condoStatusFilter, setCondoStatusFilter] = useState('Todos');
  const [detailedCondo, setDetailedCondo] = useState<any | null>(null);
  const [editingCondo, setEditingCondo] = useState<any | null>(null);

  // Estados adicionais para gerenciamento de Blocos e Unidades do Condomínio
  const [detailedCondoForBlocksAndUnits, setDetailedCondoForBlocksAndUnits] = useState<any | null>(null);
  const [blocosListSec, setBlocosListSec] = useState<{ id: string; condominio_id: string; nome: string }[]>([]);
  const [unidadesListSec, setUnidadesListSec] = useState<{ id: string; bloco_id: string; numero: string; andar?: number; fracao_ideal?: number }[]>([]);
  const [loadingBlocosUnidades, setLoadingBlocosUnidades] = useState(false);
  const [selectedBlockIdForUnit, setSelectedBlockIdForUnit] = useState<string>('');
  const [newBlockName, setNewBlockName] = useState('');
  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newUnitFloor, setNewUnitFloor] = useState<string>('');
  const [newUnitFracao, setNewUnitFracao] = useState<string>('0.0125');
  const [generateUnitBlockId, setGenerateUnitBlockId] = useState('');
  const [generateFloorsCount, setGenerateFloorsCount] = useState<number>(5);
  const [generateUnitsPerFloor, setGenerateUnitsPerFloor] = useState<number>(4);
  const [generateFormat, setGenerateFormat] = useState<'standard' | 'floorPrefix'>('floorPrefix');

  const fetchBlocosAndUnidades = async (condoId: string) => {
    setLoadingBlocosUnidades(true);
    let loadedBlocos: any[] = [];
    let loadedUnidades: any[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbBlocos, error: errBlocos } = await supabase
          .from('blocos')
          .select('*')
          .eq('condominio_id', condoId)
          .order('nome', { ascending: true });

        if (!errBlocos && dbBlocos) {
          loadedBlocos = dbBlocos;
          if (dbBlocos.length > 0) {
            const blockIds = dbBlocos.map((b: any) => b.id);
            const { data: dbUnidades, error: errUnidades } = await supabase
              .from('unidades')
              .select('*')
              .in('bloco_id', blockIds)
              .order('numero', { ascending: true });
            
            if (!errUnidades && dbUnidades) {
              loadedUnidades = dbUnidades;
            }
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar do Supabase:', err);
      }
    }

    const localBlocos = localStorage.getItem(`facilities_condo_blocos_${condoId}`);
    const localUnidades = localStorage.getItem(`facilities_condo_unidades_${condoId}`);

    if (loadedBlocos.length === 0 && localBlocos) {
      try {
        loadedBlocos = JSON.parse(localBlocos);
      } catch {}
    }
    if (loadedUnidades.length === 0 && localUnidades) {
      try {
        loadedUnidades = JSON.parse(localUnidades);
      } catch {}
    }

    // Inicialização padrão caso vazio
    if (loadedBlocos.length === 0) {
      loadedBlocos = [
        { id: `b-a-${condoId}`, condominio_id: condoId, nome: 'Bloco A' },
        { id: `b-b-${condoId}`, condominio_id: condoId, nome: 'Bloco B' }
      ];
      localStorage.setItem(`facilities_condo_blocos_${condoId}`, JSON.stringify(loadedBlocos));
    }
    if (loadedUnidades.length === 0 && loadedBlocos.length > 0) {
      loadedUnidades = [
        { id: `u-11-${condoId}`, bloco_id: loadedBlocos[0].id, numero: '101', andar: 1, fracao_ideal: 0.0125 },
        { id: `u-12-${condoId}`, bloco_id: loadedBlocos[0].id, numero: '102', andar: 1, fracao_ideal: 0.0125 },
        { id: `u-21-${condoId}`, bloco_id: loadedBlocos[0].id, numero: '201', andar: 2, fracao_ideal: 0.0125 },
        { id: `u-22-${condoId}`, bloco_id: loadedBlocos[0].id, numero: '202', andar: 2, fracao_ideal: 0.0125 },
        { id: `u-101-${condoId}`, bloco_id: loadedBlocos[1].id, numero: '101', andar: 1, fracao_ideal: 0.025 },
        { id: `u-102-${condoId}`, bloco_id: loadedBlocos[1].id, numero: '102', andar: 1, fracao_ideal: 0.025 }
      ];
      localStorage.setItem(`facilities_condo_unidades_${condoId}`, JSON.stringify(loadedUnidades));
    }

    setBlocosListSec(loadedBlocos);
    setUnidadesListSec(loadedUnidades);
    if (loadedBlocos.length > 0) {
      setSelectedBlockIdForUnit(loadedBlocos[0].id);
      setGenerateUnitBlockId(loadedBlocos[0].id);
    }
    setLoadingBlocosUnidades(false);
  };

  useEffect(() => {
    if (detailedCondoForBlocksAndUnits) {
      fetchBlocosAndUnidades(detailedCondoForBlocksAndUnits.id);
    }
  }, [detailedCondoForBlocksAndUnits]);

  const handleAddBlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim() || !detailedCondoForBlocksAndUnits) return;

    const condoId = detailedCondoForBlocksAndUnits.id;
    const newBlockId = `b-${Date.now()}`;
    const newBlock = {
      id: newBlockId,
      condominio_id: condoId,
      nome: newBlockName.trim()
    };

    const updatedBlocos = [...blocosListSec, newBlock];
    setBlocosListSec(updatedBlocos);
    localStorage.setItem(`facilities_condo_blocos_${condoId}`, JSON.stringify(updatedBlocos));
    setNewBlockName('');
    if (!selectedBlockIdForUnit) setSelectedBlockIdForUnit(newBlockId);
    if (!generateUnitBlockId) setGenerateUnitBlockId(newBlockId);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('blocos').insert([{
          id: newBlockId,
          condominio_id: condoId,
          nome: newBlock.nome
        }]);
      } catch (err: any) {
        console.error('Erro ao salvar bloco no Supabase:', err);
      }
    }

    addAuditLog('CRIAR', 'blocos', `Cadastrado bloco "${newBlock.nome}" para condomínio ID: ${condoId}`);
    onShowNotification('Sucesso', 'Bloco cadastrado com sucesso!');
  };

  const handleDeleteBlock = async (blockId: string, blockName: string) => {
    if (!detailedCondoForBlocksAndUnits) return;
    if (!confirm(`Deseja realmente excluir o "${blockName}"? Todas as unidades desse bloco também serão excluídas!`)) return;

    const condoId = detailedCondoForBlocksAndUnits.id;
    const updatedBlocos = blocosListSec.filter(b => b.id !== blockId);
    const updatedUnidades = unidadesListSec.filter(u => u.bloco_id !== blockId);

    setBlocosListSec(updatedBlocos);
    setUnidadesListSec(updatedUnidades);

    localStorage.setItem(`facilities_condo_blocos_${condoId}`, JSON.stringify(updatedBlocos));
    localStorage.setItem(`facilities_condo_unidades_${condoId}`, JSON.stringify(updatedUnidades));

    if (selectedBlockIdForUnit === blockId && updatedBlocos.length > 0) {
      setSelectedBlockIdForUnit(updatedBlocos[0].id);
    }
    if (generateUnitBlockId === blockId && updatedBlocos.length > 0) {
      setGenerateUnitBlockId(updatedBlocos[0].id);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('blocos').delete().eq('id', blockId);
      } catch (err: any) {
        console.error('Erro ao deletar bloco no Supabase:', err);
      }
    }

    addAuditLog('EXCLUIR', 'blocos', `Excluído bloco "${blockName}" do condomínio ID: ${condoId}`);
    onShowNotification('Sucesso', 'Bloco e suas unidades correspondentes excluídos!');
  };

  const handleAddUnit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUnitNumber.trim() || !selectedBlockIdForUnit || !detailedCondoForBlocksAndUnits) return;

    const condoId = detailedCondoForBlocksAndUnits.id;
    const newUnitId = `u-${Date.now()}`;
    const newUnitObj = {
      id: newUnitId,
      bloco_id: selectedBlockIdForUnit,
      numero: newUnitNumber.trim(),
      andar: newUnitFloor ? Number(newUnitFloor) : undefined,
      fracao_ideal: newUnitFracao ? Number(newUnitFracao) : undefined
    };

    const exists = unidadesListSec.some(u => u.bloco_id === selectedBlockIdForUnit && u.numero === newUnitNumber.trim());
    if (exists) {
      onShowNotification('Erro', `A unidade ${newUnitNumber} já está cadastrada para o bloco selecionado.`);
      return;
    }

    const updatedUnidades = [...unidadesListSec, newUnitObj];
    setUnidadesListSec(updatedUnidades);
    localStorage.setItem(`facilities_condo_unidades_${condoId}`, JSON.stringify(updatedUnidades));

    setNewUnitNumber('');
    setNewUnitFloor('');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('unidades').insert([{
          id: newUnitId,
          bloco_id: selectedBlockIdForUnit,
          numero: newUnitObj.numero,
          andar: newUnitObj.andar,
          fracao_ideal: newUnitObj.fracao_ideal
        }]);
      } catch (err: any) {
        console.error('Erro ao salvar unidade no Supabase:', err);
      }
    }

    addAuditLog('CRIAR', 'unidades', `Unidade ${newUnitObj.numero} criada para bloco ID: ${selectedBlockIdForUnit}`);
    onShowNotification('Sucesso', `Unidade ${newUnitObj.numero} criada com sucesso!`);
  };

  const handleDeleteUnit = async (unitId: string, unitNumber: string) => {
    if (!detailedCondoForBlocksAndUnits) return;
    
    const condoId = detailedCondoForBlocksAndUnits.id;
    const updatedUnidades = unidadesListSec.filter(u => u.id !== unitId);
    setUnidadesListSec(updatedUnidades);
    localStorage.setItem(`facilities_condo_unidades_${condoId}`, JSON.stringify(updatedUnidades));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('unidades').delete().eq('id', unitId);
      } catch (err: any) {
        console.error('Erro ao deletar unidade no Supabase:', err);
      }
    }

    onShowNotification('Sucesso', `Unidade "${unitNumber}" removida com sucesso!`);
  };

  const handleAutoGenerateUnits = async () => {
    if (!generateUnitBlockId || !detailedCondoForBlocksAndUnits) return;
    
    const condoId = detailedCondoForBlocksAndUnits.id;
    const newlyGenerated: any[] = [];
    
    for (let f = 1; f <= generateFloorsCount; f++) {
      for (let u = 1; u <= generateUnitsPerFloor; u++) {
        let unitNum = '';
        if (generateFormat === 'floorPrefix') {
          unitNum = `${f}${u.toString().padStart(2, '0')}`;
        } else {
          unitNum = `${f}${u}`;
        }

        const isDuplicate = unidadesListSec.some(existUnit => existUnit.bloco_id === generateUnitBlockId && existUnit.numero === unitNum);
        if (!isDuplicate) {
          newlyGenerated.push({
            id: `u-gen-${generateUnitBlockId}-${f}-${u}-${Date.now()}`,
            bloco_id: generateUnitBlockId,
            numero: unitNum,
            andar: f,
            fracao_ideal: parseFloat((1 / (generateFloorsCount * generateUnitsPerFloor)).toFixed(6))
          });
        }
      }
    }

    if (newlyGenerated.length === 0) {
      onShowNotification('Alerta', 'Todas as possíveis unidades para esta estrutura já existem.');
      return;
    }

    const updatedUnidades = [...unidadesListSec, ...newlyGenerated];
    setUnidadesListSec(updatedUnidades);
    localStorage.setItem(`facilities_condo_unidades_${condoId}`, JSON.stringify(updatedUnidades));

    if (isSupabaseConfigured && supabase) {
      try {
        const insertData = newlyGenerated.map(item => ({
          id: item.id,
          bloco_id: item.bloco_id,
          numero: item.numero,
          andar: item.andar,
          fracao_ideal: item.fracao_ideal
        }));
        await supabase.from('unidades').insert(insertData);
      } catch (err: any) {
        console.error('Erro ao salvar lote de unidades no Supabase:', err);
      }
    }

    addAuditLog('CRIAR', 'unidades', `Gerado lote de ${newlyGenerated.length} unidades para bloco ID: ${generateUnitBlockId}`);
    onShowNotification('Sucesso', `Gerado com sucesso um lote de ${newlyGenerated.length} unidades!`);
  };

  // Edit form model states
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
  const [editCondoInadimplencia, setEditCondoInadimplencia] = useState(5.0);
  const [editCondoStatus, setEditCondoStatus] = useState('Normal');
  const [isFetchingEditCep, setIsFetchingEditCep] = useState(false);
  const [editCepError, setEditCepError] = useState('');

  const handleEditCepChange = async (cepValue: string) => {
    const formatted = formatCEP(cepValue);
    setEditCondoCep(formatted);
    const cleanCep = formatted.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsFetchingEditCep(true);
      setEditCepError('');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (data.erro) {
          setEditCepError('CEP inválido.');
        } else {
          setEditCondoEndereco(data.logradouro || '');
          setEditCondoBairro(data.bairro || '');
          if (data.localidade) setEditCondoCidade(data.localidade);
          if (data.uf) setEditCondoEstado(data.uf);
        }
      } catch (error) {
        setEditCepError('Erro ao consultar CEP.');
      } finally {
        setIsFetchingEditCep(false);
      }
    }
  };

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
    setEditCepError('');
  };

  const [newMoradorNome, setNewMoradorNome] = useState('');

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

  // Collaborator management states inside PortalModal
  const [showColPortalForm, setShowColPortalForm] = useState(false);
  const [selectedColPortalId, setSelectedColPortalId] = useState<string | null>(null);
  const [colPortalNome, setColPortalNome] = useState('');
  const [colPortalEmail, setColPortalEmail] = useState('');
  const [colPortalApelido, setColPortalApelido] = useState('');
  const [colPortalCpf, setColPortalCpf] = useState('');
  const [colPortalUnidade, setColPortalUnidade] = useState('');
  const [colPortalPassword, setColPortalPassword] = useState('');
  const [colPortalAtivo, setColPortalAtivo] = useState(true);
  const [colPortalCondoId, setColPortalCondoId] = useState('cd-gonzaga');
  const [colPortalSearch, setColPortalSearch] = useState('');
  const [colPortalFiltroOrigem, setColPortalFiltroOrigem] = useState<'todos' | 'admin'>('todos');

  const handleCreateOrUpdateColaboradorPortal = async (e: FormEvent) => {
    e.preventDefault();
    const prof = (profileType || 'Morador').toLowerCase();
    if (!prof.includes('admin') && prof !== 'administrador') {
      onShowNotification("Bloqueio de Permissão", "Apenas o perfil Administrador pode gerenciar colaboradores.");
      return;
    }
    if (!colPortalNome.trim() || !colPortalEmail.trim()) {
      onShowNotification("Erro", "Nome e Email são campos obrigatórios.");
      return;
    }

    const isEdit = !!selectedColPortalId;
    let targetId = selectedColPortalId || `p-${Date.now()}`;

    const cleanCpf = colPortalCpf.replace(/\D/g, '');
    const formattedCpf = cleanCpf.length === 11 
      ? cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : colPortalCpf;

    const resolvedPerfil = 'Colaborador';
    const cleanTipo = 'colaborador';

    if (isSupabaseConfigured && !isEdit) {
      if (!colPortalPassword.trim()) {
        onShowNotification("Erro de Validação", "Por favor, informe a Senha para o novo colaborador.");
        return;
      }
      try {
        const createClientInstance = (await import('@supabase/supabase-js')).createClient;
        const tempClient = createClientInstance(isSupabaseConfigured ? supabaseUrl : '', isSupabaseConfigured ? supabaseAnonKey : '', {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });

        const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
          email: colPortalEmail.trim(),
          password: colPortalPassword,
          options: {
            data: {
              full_name: colPortalNome.trim(),
              unit: colPortalUnidade || 'Suporte Facilities',
              profile: resolvedPerfil,
              cpf: formattedCpf
            }
          }
        });

        if (signUpError) throw signUpError;
        if (signUpData?.user) targetId = signUpData.user.id;
      } catch (authErr: any) {
        console.error('Erro de Autenticação no Supabase Auth:', authErr);
        onShowNotification("Erro ao Criar Login", `Não foi possível criar as credenciais no Supabase Auth: ${authErr.message}`);
        return;
      }
    }

    // Atualiza facilities_portal_users para login local fallback
    try {
      const savedUsers = localStorage.getItem('facilities_portal_users');
      let users = [];
      if (savedUsers) {
        try { users = JSON.parse(savedUsers); } catch { users = []; }
      }
      const uIdx = users.findIndex((u: any) => u.email.toLowerCase() === colPortalEmail.trim().toLowerCase());
      const existingPass = (uIdx !== -1) ? (users[uIdx].pass || '123456') : colPortalPassword || '123456';

      const newUserSim = {
        cpf: formattedCpf,
        email: colPortalEmail.trim(),
        pass: existingPass,
        name: colPortalNome.trim(),
        unit: colPortalUnidade || 'Suporte Facilities',
        profile: resolvedPerfil,
        ativo: colPortalAtivo,
        condominio_id: colPortalCondoId,
        apelido: colPortalApelido.trim()
      };
      if (uIdx !== -1) {
        users[uIdx] = newUserSim;
      } else {
        users.push(newUserSim);
      }
      setUsersDb(users);
      localStorage.setItem('facilities_portal_users', JSON.stringify(users));
    } catch (err) {
      console.warn('Erro ao atualizar base de credenciais local:', err);
    }

    // Salva no supabase_sim_perfis para sincronização com o outro painel
    const profileData = {
      id: targetId,
      auth_user_id: targetId,
      nome: colPortalNome.trim(),
      email: colPortalEmail.trim(),
      cpf: formattedCpf,
      unidade: colPortalUnidade || 'Suporte Facilities',
      tipo: cleanTipo,
      perfil: resolvedPerfil,
      ativo: colPortalAtivo,
      condominio_id: colPortalCondoId,
      apelido: colPortalApelido.trim(),
      cadastrado_por: 'Administrador'
    };

    // Update Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('perfil').upsert({
          id: targetId,
          nome: colPortalNome.trim(),
          email: colPortalEmail.trim(),
          cpf: formattedCpf,
          tipo: cleanTipo,
          unidade: colPortalUnidade || 'Suporte Facilities',
          ativo: colPortalAtivo,
          condominio_id: colPortalCondoId,
          apelido: colPortalApelido.trim(),
          cadastrado_por: 'Administrador'
        });
      } catch (err: any) {
        console.error('Erro ao salvar no Supabase:', err.message);
      }
    }

    const localData = localStorage.getItem('supabase_sim_perfis');
    let localList = localData ? JSON.parse(localData) : [];
    if (isEdit) {
      localList = localList.map((p: any) => p.id === targetId ? profileData : p);
    } else {
      localList = [profileData, ...localList];
    }
    localStorage.setItem('supabase_sim_perfis', JSON.stringify(localList));

    addAuditLog(isEdit ? 'EDITAR' : 'CRIAR', 'perfis', `Gerenciado colaborador: ${colPortalNome}`);
    onShowNotification("Sucesso", isEdit ? "Colaborador atualizado com sucesso!" : "Colaborador criado com sucesso!");
    
    // Reset Form
    setColPortalNome('');
    setColPortalEmail('');
    setColPortalApelido('');
    setColPortalCpf('');
    setColPortalUnidade('');
    setColPortalPassword('');
    setColPortalAtivo(true);
    setColPortalCondoId('cd-gonzaga');
    setSelectedColPortalId(null);
    setShowColPortalForm(false);
  };

  const handleDeleteColaboradorPortal = async (id: string, email: string, name: string) => {
    const prof = (profileType || 'Morador').toLowerCase();
    if (!prof.includes('admin') && prof !== 'administrador') {
      onShowNotification("Bloqueio de Permissão", "Apenas o perfil Administrador pode remover colaboradores.");
      return;
    }

    if (!confirm(`Confirmar exclusão de cadastro do colaborador "${name}"?`)) {
      return;
    }

    // Remover de facilities_portal_users
    try {
      const savedUsers = localStorage.getItem('facilities_portal_users');
      if (savedUsers) {
        let users = JSON.parse(savedUsers);
        users = users.filter((u: any) => u.email.toLowerCase() !== email.toLowerCase());
        setUsersDb(users);
        localStorage.setItem('facilities_portal_users', JSON.stringify(users));
      }
    } catch {}

    // Remover de supabase_sim_perfis
    try {
      const localData = localStorage.getItem('supabase_sim_perfis');
      if (localData) {
        let localList = JSON.parse(localData);
        localList = localList.filter((p: any) => p.id !== id && p.email?.toLowerCase() !== email.toLowerCase());
        localStorage.setItem('supabase_sim_perfis', JSON.stringify(localList));
      }
    } catch {}

    // Excluir do Supabase se persistente
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('perfil').delete().eq('id', id);
      } catch (err: any) {
        console.error('Erro ao excluir do Supabase:', err.message);
      }
    }

    addAuditLog('EXCLUIR', 'perfis', `Removido colaborador: ${name}`);
    onShowNotification("Sucesso", "Colaborador removido com sucesso!");
  };

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
        console.log('[Supabase FETCH] 🔍 Solicitando dados de condomínios da tabela "condominios"...');
        const { data: dbCondos, error: errCondos } = await supabase.from('condominios').select('*');
        if (errCondos) {
          console.error('[Supabase FETCH] ❌ Erro ao consultar condomínios:', errCondos.message, errCondos);
        }
        if (dbCondos && !errCondos) {
          console.log(`[Supabase FETCH] ✅ SUCESSO! Encontrado(s) ${dbCondos.length} registro(s) no Supabase.`);
          const overrides = getCondoOverrides();
          const mappedCondos = dbCondos.map((c: any) => {
            const over = overrides[c.id] || {};
            return {
              id: c.id,
              nome: c.nome,
              cnpj: c.cnpj || '',
              endereco: c.endereco || '',
              bairro: c.bairro || '',
              cidade: c.cidade || '',
              estado: c.estado || '',
              sindico: over.sindico || c.sindico || 'Administradora Facilities',
              unidades: Number(over.unidades ?? c.unidades ?? 80),
              moradores: Number(over.moradores ?? c.moradores ?? 224),
              proprietarios: Number(over.proprietarios ?? c.proprietarios ?? 76),
              receita: Number(over.receita ?? c.receita ?? 60000),
              despesa: Number(over.despesa ?? c.despesa ?? 49600),
              inadimplenciaPercent: Number(over.inadimplenciaPercent ?? c.inadimplencia_percent ?? 5.0),
              status: over.status || c.status || 'Normal',
              blocosCount: Number(over.blocosCount ?? c.blocosCount ?? 2)
            };
          });
          setCondos(mappedCondos);
        } else {
          console.warn('[Supabase FETCH] ⚠️ Usando base de dados local salva (offline-first).');
          const savedLocal = localStorage.getItem('facilities_portal_condos');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (parsed && parsed.length > 0) {
                setCondos(parsed);
              }
            } catch (err) {}
          }
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
      ];
    } else if (prof.includes('admin') || prof === 'administrador') {
      return [
        { id: 'admin_dashboard', label: 'Monitor Geral', icon: <Compass className="w-4 h-4" /> },
        { id: 'admin_condominios', label: 'Condomínios', icon: <Building2 className="w-4 h-4" /> },
        { id: 'admin_colaboradores', label: 'Colaboradores', icon: <Users className="w-4 h-4 text-amber-500" /> },
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
        { id: 'admin_portaria', label: 'Ronda & Portaria', icon: <Key className="w-4 h-4" /> },
        { id: 'admin_relatorios', label: 'Exportar Relatórios', icon: <FileText className="w-4 h-4" /> },
      ];
    } else if (prof.includes('sindico') || prof.includes('síndico')) {
      return [
        { id: 'admin_dashboard', label: 'Faturamento & Visão', icon: <Compass className="w-4 h-4" /> },
        { id: 'admin_condominios', label: 'Meu Condomínio', icon: <Building2 className="w-4 h-4" /> },
        { id: 'admin_financeiro', label: 'Prestação de Contas', icon: <Wallet className="w-4 h-4" /> },
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

              {formTab === 'definir-senha' && (
                <form onSubmit={handleDefinirSenhaSubmit} className="space-y-4">
                  <div className="text-center space-y-1">
                    <h5 className="font-bold text-xs font-display uppercase tracking-wider text-[#101c29]">Ativar Meu Acesso</h5>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Convite emitido pela administradora <strong className="text-[#af101a]">{inviteAdmin || 'Cristhiane Xavier'}</strong>
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[11px] text-stone-650 space-y-1 text-left">
                    <p><strong>Usuário:</strong> {inviteEmail}</p>
                    <p><strong>Perfil de Acesso:</strong> Colaborador (Restrito)</p>
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label htmlFor="def-new-password" className="text-[10px] font-bold text-[#101c29] uppercase block">Nova Senha</label>
                    <input
                      id="def-new-password"
                      type="password"
                      required
                      value={defPass}
                      onChange={(e) => setDefPass(e.target.value)}
                      placeholder="Senha (mínimo 6 caracteres)"
                      className="w-full bg-[#f8f9ff] border border-gray-250 outline-none focus:border-primary p-3 rounded-lg text-sm text-[#101c29]"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label htmlFor="def-confirm-password" className="text-[10px] font-bold text-[#101c29] uppercase block">Confirmar Senha</label>
                    <input
                      id="def-confirm-password"
                      type="password"
                      required
                      value={defPassConfirm}
                      onChange={(e) => setDefPassConfirm(e.target.value)}
                      placeholder="Repita a nova senha para confirmação"
                      className="w-full bg-[#f8f9ff] border border-gray-250 outline-none focus:border-primary p-3 rounded-lg text-sm text-[#101c29]"
                    />
                  </div>

                  <button
                    id="def-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#af101a] hover:bg-primary-hover text-white py-3 rounded-lg font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
                        Gravando Credenciais...
                      </>
                    ) : (
                      'Criar Senha e Ativar Usuário'
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
              
              {/* Premium Brand Logo Area */}
              <div className="hidden md:block p-4 mb-4 bg-[#101c29] rounded-2xl flex items-center justify-center shadow-md">
                <img 
                  src="https://ejpjtpteycckydrorjpr.supabase.co/storage/v1/object/public/images/facilities%20logobranco.png" 
                  alt="Facilities Administração" 
                  className="w-full max-h-16 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

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
                          <div 
                            key={c.id} 
                            onClick={() => {
                              setDetailedCondo(c);
                              setActiveTab('admin_condominios');
                            }}
                            className="space-y-1 cursor-pointer hover:bg-stone-50/70 p-2 rounded-xl transition-all"
                            title="Clique de forma interativa para ver os detalhes completos deste condomínio"
                          >
                            <div className="flex justify-between text-xs font-bold text-secondary">
                              <span className="hover:text-primary transition-colors">{c.nome}</span>
                              <span className={c.inadimplenciaPercent > 15 ? 'text-[#af101a]' : 'text-[#101c29]'}>{c.inadimplenciaPercent}% inadimplência</span>
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
                        <p className="text-[10px] text-secondary mt-1.5">Soma estimada de despesas mensais</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: GESTÃO DE CONDOMÍNIOS */}
              {activeTab === 'admin_condominios' && (() => {
                // Relationship check and deletion handler
                const handleDeleteCondo = (item: any) => {
                  const activeBookings = bookings.filter((b: any) => b.status === 'Confirmado' || b.status === 'Pendente').length;
                  const openTickets = ocorrencias.filter((t: any) => t.status === 'Aberto' || t.status === 'Em Andamento').length;
                  
                  let relationshipWarning = '';
                  if (activeBookings > 0 || openTickets > 0) {
                    relationshipWarning = `\n\nATENÇÃO DE RELACIONAMENTO: Existem ${activeBookings} reservas ativas e ${openTickets} chamados de manutenção em aberto associados na base. A exclusão afetará as dependências lógicas.`;
                  }

                  const confirmMsg = `Confirmar exclusão dº condomínio "${item.nome}"?\nCNPJ: ${item.cnpj}\n\nTodas as unidades vinculadas (${item.unidades} aptos) serão excluídas.${relationshipWarning}\n\nDeseja remover este registro do Supabase de forma permanente?`;

                  if (confirm(confirmMsg)) {
                    console.log(`[Supabase DELETE] 🚀 Deletando condomínio no Supabase ID: ${item.id} - ${item.nome}...`);
                    setCondos(prev => prev.filter(c => c.id !== item.id));

                    if (isSupabaseConfigured && supabase) {
                      supabase.from('condominios').delete().eq('id', item.id).then(({ error }) => {
                        if (error) {
                          console.error('[Supabase DELETE] 🛑 Falha na exclusão do condomínio do Supabase:', error.message, error);
                          onShowNotification('Erro de Banco', `Não foi possível deletar no servidor: ${error.message}`);
                        } else {
                          console.log('[Supabase DELETE] ✅ Excluído de forma integrada no Supabase.');
                        }
                      });
                    }

                    addAuditLog('EXCLUIR', 'condominios', `Excluído condomínio ${item.nome} da base geral.`);
                    onShowNotification('Sucesso!', `Condomínio ${item.nome} removido.`);
                    if (detailedCondo && detailedCondo.id === item.id) {
                      setDetailedCondo(null);
                    }
                  }
                };

                // Save edited condo logic
                const handleSaveEditCondo = async (e: FormEvent) => {
                  e.preventDefault();
                  if (!editCondoName.trim()) {
                    onShowNotification('Nome Obrigatório', 'Por favor, defina um nome para o condomínio.');
                    return;
                  }
                  const sanitizedCnpj = editCondoCnpj.replace(/\D/g, '');
                  if (!sanitizedCnpj) {
                    onShowNotification('CNPJ inválido', 'Por favor, informe o CNPJ do condomínio.');
                    return;
                  }

                  const updatedObj = {
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
                    blocosCount: Number(editCondoBlocos) || 2,
                    moradores: Number(editCondoMoradores) || 224,
                    proprietarios: Number(editCondoProprietarios) || 76,
                    receita: Number(editCondoReceita) || 60000,
                    despesa: Number(editCondoDespesa) || 49600,
                    inadimplenciaPercent: Number(editCondoInadimplencia) || 5.2,
                    status: editCondoStatus
                  };

                  console.log(`[Supabase UPDATE] 🚀 Salvando alterações para o ID: ${updatedObj.id}`);

                  // Cache metadata overrides locally (guarantees properties matching regardless of structural columns)
                  saveCondoOverride(updatedObj.id, {
                    sindico: updatedObj.sindico,
                    unidades: updatedObj.unidades,
                    blocosCount: updatedObj.blocosCount,
                    moradores: updatedObj.moradores,
                    proprietarios: updatedObj.proprietarios,
                    receita: updatedObj.receita,
                    despesa: updatedObj.despesa,
                    inadimplenciaPercent: updatedObj.inadimplenciaPercent,
                    status: updatedObj.status
                  });

                  if (isSupabaseConfigured && supabase) {
                    const { error } = await updateResilient('condominios', updatedObj.id, {
                      nome: updatedObj.nome,
                      cnpj: updatedObj.cnpj,
                      endereco: updatedObj.endereco,
                      bairro: updatedObj.bairro,
                      cidade: updatedObj.cidade,
                      estado: updatedObj.estado,
                      cep: updatedObj.cep,
                      // if columns exist, they'll match, otherwise autocorrect handles it cleanly:
                      sindico: updatedObj.sindico,
                      unidades: updatedObj.unidades,
                      moradores: updatedObj.moradores,
                      receita: updatedObj.receita,
                      despesa: updatedObj.despesa,
                      inadimplencia_percent: updatedObj.inadimplenciaPercent,
                      status: updatedObj.status
                    });

                    if (error) {
                      console.error('[Supabase UPDATE] 🛑 Erro ao atualizar condomínio no banco de dados:', error.message);
                      onShowNotification('Erro Supabase', `Não foi possível persistir no cloud: ${error.message || 'Sem conexão'}`);
                    } else {
                      console.log('[Supabase UPDATE] ✅ Atualização executada com sucesso no Supabase.');
                    }
                  }

                  setCondos(prev => prev.map(c => c.id === updatedObj.id ? updatedObj : c));
                  addAuditLog('EDITAR', 'condominios', `Atualizou dados dº condomínio ${updatedObj.nome}.`);
                  onShowNotification('Sucesso!', `Condomínio ${updatedObj.nome} atualizado.`);
                  
                  setEditingCondo(null);
                  if (detailedCondo && detailedCondo.id === updatedObj.id) {
                    setDetailedCondo(updatedObj);
                  }
                };

                // Filter condominiums list in real-world input stream
                const currentFilteredCondos = getFilteredCondos().filter((c: any) => {
                  const query = condoSearchQuery.toLowerCase().trim();
                  const matchesSearch = !query || 
                    c.nome.toLowerCase().includes(query) || 
                    (c.cnpj && c.cnpj.includes(query)) ||
                    (c.endereco && c.endereco.toLowerCase().includes(query)) ||
                    (c.cidade && c.cidade.toLowerCase().includes(query));
                  const matchesStatus = condoStatusFilter === 'Todos' || c.status === condoStatusFilter;
                  return matchesSearch && matchesStatus;
                });

                if (detailedCondo) {
                  return (
                    <CondoDetailsView
                      condo={detailedCondo}
                      onBack={() => setDetailedCondo(null)}
                      onEdit={(item) => {
                        startEditingCondo(item);
                      }}
                      onDelete={(item) => {
                        handleDeleteCondo(item);
                      }}
                      onShowNotification={onShowNotification}
                    />
                  );
                }

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-left gap-4">
                      <div>
                        <h4 className="text-base font-bold text-[#101c29] font-display">Residenciais e Condomínios Integrados</h4>
                        <p className="text-xs text-secondary mt-0.5">Gerenciador de complexos habitacionais e empresariais parceiros Facilities.</p>
                      </div>
                      <button
                        onClick={() => setShowCondoForm(true)}
                        className="bg-primary hover:bg-[#af101a] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Cadastrar Condomínio
                      </button>
                    </div>

                    {/* Integrated Search & Filter Row */}
                    <div className="flex flex-col sm:flex-row gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-150 text-left">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Pesquisar por nome, CNPJ, endereço ou cidade..."
                          value={condoSearchQuery}
                          onChange={(e) => setCondoSearchQuery(e.target.value)}
                          className="w-full pl-9.5 pr-3 py-2.5 bg-white border border-gray-250 rounded-xl text-xs outline-none focus:border-primary text-[#101c29]"
                        />
                        {condoSearchQuery && (
                          <button 
                            onClick={() => setCondoSearchQuery('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer text-xs"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-secondary hidden md:inline">Status:</span>
                        <select
                          value={condoStatusFilter}
                          onChange={(e) => setCondoStatusFilter(e.target.value)}
                          className="bg-white border border-gray-250 px-3 py-2.5 rounded-xl text-xs outline-none text-[#101c29] cursor-pointer"
                        >
                          <option value="Todos">Todos os Status</option>
                          <option value="Normal">Normal</option>
                          <option value="Alerta">Alerta</option>
                          <option value="Crítico">Crítico</option>
                        </select>
                      </div>
                    </div>

                    {/* Condo creation modal */}
                    {showCondoForm && (
                      <div id="modal-cadastro-condo-portal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
                        <div className="bg-white w-full max-w-xl rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35)] border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                          {/* Modal Header */}
                          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h4 className="text-xs font-extrabold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                              <Plus className="w-4 h-4 text-[#af101a]" /> Novo Condomínio
                            </h4>
                            <button
                              onClick={() => setShowCondoForm(false)}
                              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Modal Body */}
                          <div className="p-6 overflow-y-auto space-y-4 text-left">
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              
                              const nameTrimmed = newCondoName.trim();
                              if (!nameTrimmed) {
                                onShowNotification('Erro de Validação', 'Por favor, informe o Nome do Condomínio.');
                                return;
                              }
                              
                              const cnpjCleaned = newCondoCnpj.replace(/\D/g, '');
                              if (!cnpjCleaned) {
                                onShowNotification('Erro de Validação', 'Por favor, informe o CNPJ do Condomínio.');
                                return;
                              }
                              if (cnpjCleaned.length !== 14) {
                                onShowNotification('CNPJ Inválido', 'O CNPJ deve conter exatamente 14 números.');
                                return;
                              }

                              const cepCleaned = newCondoCep.replace(/\D/g, '');
                              if (!cepCleaned) {
                                onShowNotification('Erro de Validação', 'Por favor, informe o CEP do Condomínio.');
                                return;
                              }
                              if (cepCleaned.length !== 8) {
                                onShowNotification('CEP Inválido', 'O CEP deve conter exatamente 8 números.');
                                return;
                              }

                              const newId = generateUUID();
                              const newObj = {
                                id: newId,
                                nome: newCondoName,
                                cnpj: newCondoCnpj,
                                cep: newCondoCep,
                                endereco: newCondoEndereco || 'Av. Ana Costa, 142',
                                bairro: newCondoBairro || 'Gonzaga',
                                cidade: newCondoCidade || 'Santos',
                                estado: newCondoEstado || 'SP',
                                sindico: newCondoSindico || 'Administradora Facilities',
                                unidades: Number(newCondoUnidades) || 80,
                                moradores: Math.round(Number(newCondoUnidades || 80) * 2.8),
                                proprietarios: Math.round(Number(newCondoUnidades || 80) * 0.95),
                                receita: Number(newCondoUnidades || 80) * 750,
                                despesa: Number(newCondoUnidades || 80) * 620,
                                inadimplenciaPercent: 5.0,
                                status: 'Normal',
                                blocosCount: 2
                              };

                              const saveAndClose = async () => {
                                if (isSupabaseConfigured && supabase) {
                                  const { error } = await insertResilient('condominios', {
                                    id: newObj.id,
                                    nome: newObj.nome,
                                    cnpj: newObj.cnpj,
                                    cep: newObj.cep,
                                    endereco: newObj.endereco,
                                    bairro: newObj.bairro,
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
                                  });

                                  if (error) {
                                    console.error('[Supabase INSERT] 🛑 Erro ao salvar condomínio:', error.message);
                                    onShowNotification('Erro de Conexão', `Não foi possível registrar no banco: ${error.message}`);
                                    return;
                                  }
                                } else {
                                  saveSimulatedData('condominios', newObj);
                                }

                                saveCondoOverride(newObj.id, {
                                  sindico: newObj.sindico,
                                  unidades: newObj.unidades,
                                  blocosCount: 2,
                                  moradores: newObj.moradores,
                                  proprietarios: newObj.proprietarios,
                                  receita: newObj.receita,
                                  despesa: newObj.despesa,
                                  inadimplenciaPercent: newObj.inadimplenciaPercent,
                                  status: newObj.status
                                });

                                setCondos(prev => [...prev, newObj]);
                                addAuditLog('CRIAR', 'condominios', `Registrado condomínio ${newCondoName} com ${newCondoUnidades} unidades.`);
                                onShowNotification('Sucesso!', `Condomínio ${newCondoName} cadastrado com sucesso.`);
                                setNewCondoName('');
                                setNewCondoCnpj('');
                                setNewCondoSindico('');
                                setNewCondoCidade('Santos');
                                setNewCondoEstado('SP');
                                setNewCondoEndereco('');
                                setNewCondoBairro('');
                                setNewCondoCep('');
                                setCepError('');
                                setIsFetchingCep(false);
                                setShowCondoForm(false);
                              };

                              saveAndClose();
                            }} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Condomínio *</label>
                                  <input
                                    type="text"
                                    placeholder="Residencial Miramar"
                                    value={newCondoName}
                                    onChange={(e) => setNewCondoName(e.target.value)}
                                    className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                                  />
                                </div>

                                <div className="space-y-1 md:col-span-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">CNPJ *</label>
                                  <input
                                    type="text"
                                    placeholder="00.000.000/0001-00"
                                    value={newCondoCnpj}
                                    onChange={(e) => setNewCondoCnpj(formatCNPJ(e.target.value))}
                                    maxLength={18}
                                    className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] font-mono"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 md:col-span-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between items-center">
                                    <span>CEP *</span>
                                    {isFetchingCep && <span className="text-[9px] text-blue-500 animate-pulse font-medium">Buscando...</span>}
                                    {cepError && <span className="text-[9px] text-[#af101a] font-medium">{cepError}</span>}
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={9}
                                    placeholder="00000-000"
                                    value={newCondoCep}
                                    onChange={(e) => handleCepChange(e.target.value)}
                                    className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] font-mono"
                                  />
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Endereço</label>
                                  <input
                                    type="text"
                                    placeholder="Ex: Av. Ana Costa, 142"
                                    value={newCondoEndereco}
                                    onChange={(e) => setNewCondoEndereco(e.target.value)}
                                    className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1 col-span-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Bairro</label>
                                  <input
                                    type="text"
                                    placeholder="Ex: Gonzaga"
                                    value={newCondoBairro}
                                    onChange={(e) => setNewCondoBairro(e.target.value)}
                                    className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
                                  />
                                </div>

                                <div className="space-y-1 col-span-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Cidade</label>
                                  <select
                                    value={newCondoCidade}
                                    onChange={(e) => setNewCondoCidade(e.target.value)}
                                    className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] cursor-pointer"
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
                                    className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29] cursor-pointer"
                                  >
                                    <option value="SP">São Paulo (SP)</option>
                                    {newCondoEstado && newCondoEstado !== 'SP' && (
                                      <option value={newCondoEstado}>{newCondoEstado}</option>
                                    )}
                                  </select>
                                </div>

                                <div className="space-y-1 col-span-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Unidades</label>
                                  <input
                                    type="number"
                                    placeholder="80"
                                    value={newCondoUnidades || ''}
                                    onChange={(e) => setNewCondoUnidades(Number(e.target.value))}
                                    className="w-full bg-[#f8f9ff] border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-primary text-[#101c29]"
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
                                  className="px-6 bg-[#af101a] hover:bg-[#900e15] text-white py-2.5 text-xs font-bold rounded-lg transition-transform focus:scale-95 cursor-pointer"
                                >
                                  Cadastrar
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Condominios List Representation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {currentFilteredCondos.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl border border-gray-150 text-center text-sm text-secondary col-span-2 w-full">
                          <Building2 className="w-10 h-10 text-gray-350 mx-auto mb-2 animate-bounce" />
                          <p className="font-semibold text-gray-700">Nenhum condomínio corresponde aos filtros de busca.</p>
                          <p className="text-xs mt-1 text-gray-450">Tente digitar outros termos ou mude o filtro de status.</p>
                        </div>
                      ) : (
                        currentFilteredCondos.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => setDetailedCondo(item)}
                            className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-[#af101a]/40 shadow-xs hover:shadow-md hover:bg-stone-50/45 cursor-pointer flex flex-col text-left h-full group transition-all duration-200 active:scale-[0.99]"
                            title="Clique de forma interativa para ver os detalhes completos deste condomínio"
                          >
                            <div className="space-y-3">
                              <h5 className="font-sans font-bold text-[#101c29] text-lg leading-snug group-hover:text-primary transition-colors">
                                {item.nome}
                              </h5>
                              <p className="text-stone-500 font-medium text-xs leading-relaxed flex items-start gap-1.5">
                                <span className="text-gray-400 select-none shrink-0" aria-hidden="true">📍</span>
                                <span>{item.endereco}, {item.bairro}</span>
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* DETAILED CONDO SHIM MODAL (Requirement 2) - Bypassed in favor of CondoDetailsView */}
                    {false && detailedCondo && (
                      <div id="modal-visualizar-condo" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
                        <div className="bg-white w-full max-w-xl rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35)] border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                          {/* Modal Header */}
                          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#101c29] text-white">
                            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-amber-500" /> Ficha do Condomínio
                            </h4>
                            <button
                              onClick={() => setDetailedCondo(null)}
                              className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer border-0 bg-transparent animate-pulse"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Modal Body */}
                          <div className="p-6 overflow-y-auto space-y-6 text-left">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h2 className="text-xl font-bold text-[#101c29] font-display leading-snug">{detailedCondo.nome}</h2>
                                  <p className="text-xs text-secondary font-mono mt-0.5">Identificador Único: {detailedCondo.id}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                  detailedCondo.status === 'Crítico' ? 'bg-red-100 text-[#af101a]' : detailedCondo.status === 'Alerta' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {detailedCondo.status}
                                </span>
                              </div>
                            </div>

                            {/* Informações Gerais */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4.5 rounded-2xl border border-gray-150">
                              <div>
                                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">CNPJ / Inscrição</span>
                                <p className="text-xs font-bold text-[#101c29] mt-0.5">{detailedCondo.cnpj || 'Isento/Não informado'}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Síndico Responsável</span>
                                <p className="text-xs font-bold text-[#101c29] mt-0.5">{detailedCondo.sindico || 'Administradora Facilities'}</p>
                              </div>
                              <div className="md:col-span-2 pt-2 border-t border-gray-150/60">
                                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Endereço Completo</span>
                                <p className="text-xs font-bold text-[#101c29] mt-1 line-clamp-2">
                                  🏢 {detailedCondo.endereco || 'Avenida Ana Costa, 142'}, {detailedCondo.bairro || 'Gonzaga'}<br />
                                  CEP: {detailedCondo.cep || '11060-001'} | {detailedCondo.cidade || 'Santos'} - {detailedCondo.estado || 'SP'}
                                </p>
                              </div>
                            </div>

                            {/* Quantidades e Estrutura */}
                            <div className="space-y-2.5">
                              <h5 className="text-xs font-extrabold text-[#101c29] uppercase tracking-wider">Estrutura Física & Ocupação</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="border border-gray-150 p-3 rounded-2xl text-center bg-white">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Quant. Blocos</span>
                                  <p className="text-lg font-extrabold text-[#101c29] mt-0.5">{detailedCondo.blocosCount || 2} blocos</p>
                                </div>
                                <div className="border border-gray-150 p-3 rounded-2xl text-center bg-white">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Unidades</span>
                                  <p className="text-lg font-extrabold text-[#101c29] mt-0.5">{detailedCondo.unidades || 80} aptos</p>
                                </div>
                                <div className="border border-gray-150 p-3 rounded-2xl text-center bg-white">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Moradores</span>
                                  <p className="text-lg font-extrabold text-[#101c29] mt-0.5">{detailedCondo.moradores || 224} est.</p>
                                </div>
                                <div className="border border-gray-150 p-3 rounded-2xl text-center bg-white">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Proprietários</span>
                                  <p className="text-lg font-extrabold text-[#101c29] mt-0.5">{detailedCondo.proprietarios || 76} priv.</p>
                                </div>
                              </div>
                            </div>

                            {/* Financeiro Básico */}
                            <div className="space-y-2.5">
                              <h5 className="text-xs font-extrabold text-[#101c29] uppercase tracking-wider">Indicadores Financeiros Ordinários</h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                                  <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Arrecadação Prevista</span>
                                  <p className="text-sm font-black text-emerald-800 mt-1">R$ {detailedCondo.receita?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl">
                                  <span className="text-[9px] text-red-600 font-bold uppercase tracking-wider">Despesas Contratuais</span>
                                  <p className="text-sm font-black text-red-800 mt-1">R$ {detailedCondo.despesa?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl">
                                  <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">Saldo de Caixa</span>
                                  <p className="text-sm font-black text-blue-800 mt-1">R$ {(detailedCondo.receita - detailedCondo.despesa)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center bg-amber-50/40 p-3 rounded-xl border border-amber-100 text-xs mt-2 text-stone-700">
                                <span className="font-semibold">Índice Geral de Inadimplência:</span>
                                <span className={`font-extrabold ${detailedCondo.inadimplenciaPercent > 12 ? 'text-[#af101a]' : 'text-[#101c29]'}`}>{detailedCondo.inadimplenciaPercent}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  setDetailedCondo(null);
                                  startEditingCondo(detailedCondo);
                                }}
                                className="px-4 py-2 bg-white border border-gray-250 hover:bg-gray-100 text-[#101c29] text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#af101a]" /> Editar Informações
                              </button>

                              <button
                                onClick={() => {
                                  setDetailedCondoForBlocksAndUnits(detailedCondo);
                                }}
                                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-700" /> Configurar Blocos & Unidades
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteCondo(detailedCondo)}
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#af101a] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir Registro
                              </button>
                              <button
                                onClick={() => setDetailedCondo(null)}
                                className="px-5 py-2 bg-[#101c29] text-white text-xs font-bold rounded-lg hover:bg-stone-850 transition-colors cursor-pointer"
                              >
                                Fechar Ficha
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EDIT CONDO MODAL (Requirement 3) */}
                    {editingCondo && (
                      <div id="modal-edicao-condo" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
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

                              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => setEditingCondo(null)}
                                  className="px-5 py-2.5 border border-gray-200 text-[#101c29] text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  className="px-6 bg-[#af101a] hover:bg-[#900e15] text-white py-2.5 text-xs font-bold rounded-lg transition-transform focus:scale-95 cursor-pointer"
                                >
                                  Salvar Alterações
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailedCondoForBlocksAndUnits && (
                      <div id="modal-blocos-unidades-condo" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in text-sans">
                        <div className="bg-white w-full max-w-6xl rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35)] border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
                          {/* Modal Header */}
                          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                              <h4 className="text-xs font-extrabold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#af101a]" /> Estrutura de Blocos & Unidades
                              </h4>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Condomínio Selecionado: <span className="text-[#af101a]">{detailedCondoForBlocksAndUnits.nome}</span></p>
                            </div>
                            <button
                              onClick={() => setDetailedCondoForBlocksAndUnits(null)}
                              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Modal Body */}
                          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0 text-left">
                            {/* Coluna Esquerda: Cadastro de Blocos / Lotes / Unidades */}
                            <div className="w-full lg:w-[45%] border-r border-gray-100 p-6 overflow-y-auto space-y-6">
                              
                              {/* 1. Cadastrar Bloco */}
                              <div className="bg-slate-50/60 p-4 rounded-2xl border border-gray-100 space-y-3">
                                <h5 className="text-[10px] font-extrabold text-[#101c29] uppercase tracking-wide flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#af101a]"></span> 1. Registrar Bloco do Condomínio
                                </h5>
                                <form onSubmit={handleAddBlock} className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Nome do Bloco (ex: Torre 1, Bloco B)"
                                    value={newBlockName}
                                    onChange={(e) => setNewBlockName(e.target.value)}
                                    className="flex-1 bg-white border border-gray-250 px-3 py-2 rounded-lg text-xs outline-none focus:border-emerald-500 text-[#101c29] font-bold"
                                  />
                                  <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#101c29] hover:bg-stone-850 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 border-0"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Adicionar
                                  </button>
                                </form>

                                {/* List of blocks already created */}
                                {blocosListSec.length > 0 && (
                                  <div className="pt-2">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Blocos Ativos:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {blocosListSec.map(block => {
                                        const count = unidadesListSec.filter(u => u.bloco_id === block.id).length;
                                        return (
                                          <div key={block.id} className="flex items-center gap-1 bg-white border border-gray-200 pl-2.5 pr-1.5 py-1 rounded-lg shadow-2xs">
                                            <span className="text-[10.5px] font-extrabold text-[#101c29]">{block.nome}</span>
                                            <span className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded font-black">{count} un</span>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteBlock(block.id, block.nome)}
                                              className="text-gray-400 hover:text-[#af101a] p-0.5 rounded cursor-pointer border-0 bg-transparent"
                                              title="Excluir Bloco"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 2. Cadastrar Unidade Individual */}
                              <div className="bg-slate-50/60 p-4 rounded-2xl border border-gray-100 space-y-3">
                                <h5 className="text-[10px] font-extrabold text-[#101c29] uppercase tracking-wide flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 2. Cadastrar Unidade Individual
                                </h5>
                                {blocosListSec.length === 0 ? (
                                  <p className="text-[10px] text-gray-400 font-bold italic">Cadastre ao menos um bloco primeiro.</p>
                                ) : (
                                  <form onSubmit={handleAddUnit} className="space-y-2.5 text-left">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-extrabold text-gray-400 uppercase">Bloco Destino</label>
                                        <select
                                          value={selectedBlockIdForUnit}
                                          onChange={(e) => setSelectedBlockIdForUnit(e.target.value)}
                                          className="w-full bg-white border border-gray-250 p-2 rounded-lg text-xs font-bold text-[#101c29] outline-none"
                                        >
                                          {blocosListSec.map(b => (
                                            <option key={b.id} value={b.id}>{b.nome}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-extrabold text-gray-400 uppercase">Nº da Unidade *</label>
                                        <input
                                          type="text"
                                          placeholder="Ex: 101, 12, Apto 5"
                                          value={newUnitNumber}
                                          onChange={(e) => setNewUnitNumber(e.target.value)}
                                          className="w-full bg-white border border-[#af101a]/15 p-2 rounded-lg text-xs font-bold text-[#101c29] outline-none"
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-left">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-extrabold text-gray-400 uppercase">Andar (Opcional)</label>
                                        <input
                                          type="number"
                                          placeholder="Ex: 1, 10"
                                          value={newUnitFloor}
                                          onChange={(e) => setNewUnitFloor(e.target.value)}
                                          className="w-full bg-white border border-gray-250 p-2 rounded-lg text-xs font-bold text-[#101c29] outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-extrabold text-gray-400 uppercase">Fração Ideal</label>
                                        <input
                                          type="text"
                                          value={newUnitFracao}
                                          onChange={(e) => setNewUnitFracao(e.target.value)}
                                          placeholder="0.0125"
                                          className="w-full bg-white border border-gray-250 p-2 rounded-lg text-xs font-bold text-[#101c29] outline-none font-mono"
                                        />
                                      </div>
                                    </div>

                                    <button
                                      type="submit"
                                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors border-0"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" /> Adicionar Unidade
                                    </button>
                                  </form>
                                )}
                              </div>

                              {/* 3. Gerador Automático de Estrutura */}
                              <div className="bg-amber-50/35 p-4 rounded-2xl border border-amber-200/55 space-y-3">
                                <div className="flex justify-between items-start">
                                  <h5 className="text-[10px] font-extrabold text-[#9c510e] uppercase tracking-wide flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 3. Autogerador de Estrutura Rápida
                                  </h5>
                                  <span className="bg-amber-100 text-[#9c510e] font-sans text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                    Recomendado 🚀
                                  </span>
                                </div>
                                {blocosListSec.length === 0 ? (
                                  <p className="text-[10px] text-gray-400 font-bold italic">Cadastre ao menos um bloco primeiro.</p>
                                ) : (
                                  <div className="space-y-3 text-xs leading-normal">
                                    <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">
                                      Crie dezenas de unidades organizadas por andar em apenas um clique! Ideal para empreendimentos com andares padronizados.
                                    </p>

                                    <div className="space-y-2 text-left">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-extrabold text-amber-800 uppercase">Bloco para Aplicar Gerador</label>
                                        <select
                                          value={generateUnitBlockId}
                                          onChange={(e) => setGenerateUnitBlockId(e.target.value)}
                                          className="w-full bg-white border border-amber-200/70 p-2 rounded-lg text-xs font-bold text-[#101c29] outline-none"
                                        >
                                          {blocosListSec.map(b => (
                                            <option key={b.id} value={b.id}>{b.nome}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-left">
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-extrabold text-amber-800 uppercase">Qtd de Andares</label>
                                          <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={generateFloorsCount}
                                            onChange={(e) => setGenerateFloorsCount(Math.max(1, Number(e.target.value)))}
                                            className="w-full bg-white border border-amber-200/70 p-2 rounded-lg text-xs font-bold text-[#101c29] outline-none"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-extrabold text-amber-800 uppercase">Unidades por Andar</label>
                                          <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={generateUnitsPerFloor}
                                            onChange={(e) => setGenerateUnitsPerFloor(Math.max(1, Number(e.target.value)))}
                                            className="w-full bg-white border border-amber-200/70 p-2 rounded-lg text-xs font-bold text-[#101c29] outline-none"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-extrabold text-amber-800 uppercase">Padrão de Numeração</label>
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                          <label className="flex items-center gap-2 p-2 bg-white border border-amber-200/50 rounded-lg cursor-pointer hover:bg-amber-50/20">
                                            <input
                                              type="radio"
                                              name="generateFormat"
                                              checked={generateFormat === 'floorPrefix'}
                                              onChange={() => setGenerateFormat('floorPrefix')}
                                              className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                                            />
                                            <span className="text-[10px] font-bold text-gray-700">101, 102, 201...</span>
                                          </label>
                                          <label className="flex items-center gap-2 p-2 bg-white border border-amber-200/50 rounded-lg cursor-pointer hover:bg-amber-50/20">
                                            <input
                                              type="radio"
                                              name="generateFormat"
                                              checked={generateFormat === 'standard'}
                                              onChange={() => setGenerateFormat('standard')}
                                              className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                                            />
                                            <span className="text-[10px] font-bold text-gray-700">11, 12, 21, 22...</span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={handleAutoGenerateUnits}
                                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors border-0"
                                    >
                                      ⚡ Auto-Gerar Todas Unidades
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Coluna Direita: Visualizador Gráfico e Lista Completa */}
                            <div className="w-full lg:w-[55%] p-6 bg-slate-50/50 flex flex-col overflow-y-auto space-y-5 min-h-0">
                              <div className="flex justify-between items-center flex-wrap gap-2">
                                <div>
                                  <h5 className="text-[11px] font-black text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                                    <Compass className="w-4 h-4 text-[#af101a]" /> Vista Arquitetônica (Mapa do Edifício)
                                  </h5>
                                  <p className="text-[9px] text-gray-400 font-bold mt-0.5 font-sans">Selecione o bloco desejado para visualizar e gerenciar as respectivas unidades autônomas por andar.</p>
                                </div>
                              </div>

                              {/* Tabs de Seleção de Bloco para Focar Visualizador */}
                              {blocosListSec.length === 0 ? (
                                <div className="bg-white p-6 rounded-2xl border border-gray-150 text-center text-gray-400 text-xs font-bold">
                                  Cadastre ao menos um bloco para habilitar o painel visual de pavimentos.
                                </div>
                              ) : (
                                <>
                                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                                    {blocosListSec.map(b => (
                                      <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedBlockIdForUnit(b.id);
                                          setGenerateUnitBlockId(b.id);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border-0 ${
                                          selectedBlockIdForUnit === b.id
                                            ? 'bg-[#101c29] text-white shadow-md shadow-slate-900/15'
                                            : 'bg-white border border-gray-250 text-gray-600 hover:text-gray-900'
                                        }`}
                                      >
                                        <Building2 className="w-3.5 h-3.5" />
                                        {b.nome}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Render Visual Matrix (Descending building Floors) */}
                                  <div className="bg-white border border-gray-150 p-5 rounded-2xl space-y-4 shadow-2xs max-h-[460px] overflow-y-auto">
                                    <div className="flex items-center justify-between border-b pb-2">
                                      <span className="text-[10px] font-extrabold text-[#101c29] uppercase">Pavimentos & Unidades</span>
                                      <span className="text-[9px] text-gray-400 font-bold">Unidades no Bloco: <span className="font-extrabold text-[#af101a]">{unidadesListSec.filter(u => u.bloco_id === selectedBlockIdForUnit).length}</span></span>
                                    </div>

                                    {(() => {
                                      const groupedUnitsByFloor = unidadesListSec
                                        .filter(u => u.bloco_id === selectedBlockIdForUnit)
                                        .reduce((acc: { [key: number]: typeof unidadesListSec }, unit) => {
                                          const floor = unit.andar || 0;
                                          if (!acc[floor]) acc[floor] = [];
                                          acc[floor].push(unit);
                                          return acc;
                                        }, {});

                                      const sortedFloors = Object.keys(groupedUnitsByFloor)
                                        .map(Number)
                                        .sort((a, b) => b - a);

                                      return (
                                        <div className="space-y-3">
                                          {sortedFloors.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                                              <Building2 className="w-10 h-10 stroke-1 mb-2 text-gray-300" />
                                              <p className="text-xs font-bold">Nenhuma unidade cadastrada neste bloco.</p>
                                              <p className="text-[10px] font-sans">Crie unidades no formulário ao lado ou utilize o gerador automático por andares acima.</p>
                                            </div>
                                          ) : (
                                            <div className="space-y-2.5">
                                              {sortedFloors.map((floor) => {
                                                const floorUnits = groupedUnitsByFloor[floor].sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
                                                return (
                                                  <div key={floor} className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-gray-150/50 hover:bg-slate-50 transition-all text-left">
                                                    <div className="w-16 shrink-0 text-right pr-2 border-r border-stone-200 font-mono text-[9px] uppercase font-extrabold text-gray-500">
                                                      {floor === 0 ? 'Térreo' : `${floor}º Andar`}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 flex-1">
                                                      {floorUnits.map((unit) => (
                                                        <div 
                                                          key={unit.id} 
                                                          className="group relative bg-white border border-gray-150 hover:border-[#af101a]/40 pl-3 pr-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs text-xs"
                                                        >
                                                          <span className="font-extrabold text-[#101c29]">{unit.numero}</span>
                                                          {unit.fracao_ideal && (
                                                            <span className="text-[8px] md:text-[9px] text-[#52647c] font-black tracking-tighter" title="Fração Ideal">({unit.fracao_ideal})</span>
                                                          )}
                                                          <button
                                                            type="button"
                                                            onClick={() => handleDeleteUnit(unit.id, unit.numero)}
                                                            className="text-gray-400 hover:text-[#af101a] p-0.5 rounded transition-all cursor-pointer border-0 bg-transparent"
                                                            title="Remover Unidade"
                                                          >
                                                            <X className="w-3 h-3" />
                                                          </button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                              onClick={() => {
                                setDetailedCondoForBlocksAndUnits(null);
                                if (detailedCondo) {
                                  const localUnitsCount = unidadesListSec.length;
                                  const localBlocosCount = blocosListSec.length;
                                  setDetailedCondo(prev => ({
                                    ...prev,
                                    unidades: localUnitsCount > 0 ? localUnitsCount : prev.unidades,
                                    blocosCount: localBlocosCount > 0 ? localBlocosCount : prev.blocosCount
                                  }));
                                }
                              }}
                              className="px-6 py-2.5 bg-[#101c29] text-white text-xs font-bold rounded-lg hover:bg-stone-850 transition-colors cursor-pointer border-0"
                            >
                              Concluir e Salvar Estrutura
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ADMIN TAB: GERENCIAMENTO DE COLABORADORES */}
              {activeTab === 'admin_colaboradores' && (
                <div className="space-y-6 text-left animate-fade-in text-[#101c29]">
                  {/* Alerta de permissão para outros perfis e informando regras */}
                  {!(profileType || 'Morador').toLowerCase().includes('admin') && (profileType || 'Morador').toLowerCase() !== 'administrador' ? (
                    <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Acesso Restrito ao Administrador!</strong> Você não possui privilégios para visualizar ou gerenciar colaboradores do sistema. Contate a Superintendência.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Header da subpágina */}
                      <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-wrap justify-between items-center gap-4 text-left border border-slate-100">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            <Users className="w-5 h-5 text-amber-500" /> Gestão de Colaboradores (Facilities)
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-1 pb-1">
                            Relação de prestadores, supervisores e técnicos de campo cadastrados no sistema com acesso restrito de colaborador.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (showColPortalForm && selectedColPortalId) {
                              // Reset form
                              setSelectedColPortalId(null);
                              setColPortalNome('');
                              setColPortalEmail('');
                              setColPortalCpf('');
                              setColPortalUnidade('');
                              setColPortalPassword('');
                              setColPortalAtivo(true);
                              setColPortalCondoId('cd-gonzaga');
                            }
                            setShowColPortalForm(!showColPortalForm);
                          }}
                          className="bg-primary hover:bg-[#af101a] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <Plus className={`w-4 h-4 transition-transform duration-200 ${(showColPortalForm || selectedColPortalId) ? 'rotate-45' : ''}`} />
                          {(showColPortalForm || selectedColPortalId) ? 'Ocultar Formulário' : 'Novo Colaborador'}
                        </button>
                      </div>

                      {/* Formulário de Adicionar / Editar Colaborador (In-Modal overlay) */}
                      {(showColPortalForm || selectedColPortalId) && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                          <div className="bg-white p-6 rounded-[24px] shadow-[0_20px_50px_rgba(15,23,42,0.15)] space-y-4 border border-slate-150 text-left max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-up">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                              <h5 className="text-sm font-extrabold text-[#0f1b29] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                <Users className="w-5 h-5 text-amber-500" /> {selectedColPortalId ? 'Editar Perfil de Colaborador' : 'Registrar Novo Colaborador'}
                              </h5>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedColPortalId(null);
                                  setColPortalNome('');
                                  setColPortalEmail('');
                                  setColPortalApelido('');
                                  setColPortalCpf('');
                                  setColPortalUnidade('');
                                  setColPortalPassword('');
                                  setColPortalAtivo(true);
                                  setColPortalCondoId('cd-gonzaga');
                                  setShowColPortalForm(false);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <Plus className="w-5 h-5 rotate-45" />
                              </button>
                            </div>

                            <form onSubmit={handleCreateOrUpdateColaboradorPortal} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 text-left">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Nome Completo *</label>
                                  <input
                                    type="text"
                                    required
                                    value={colPortalNome}
                                    onChange={(e) => setColPortalNome(e.target.value)}
                                    placeholder="Ex: Lucas Ferreira de Souza"
                                    className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                                  />
                                </div>

                                <div className="space-y-1 text-left">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Apelido *</label>
                                  <input
                                    type="text"
                                    required
                                    value={colPortalApelido}
                                    onChange={(e) => setColPortalApelido(e.target.value)}
                                    placeholder="Ex: Lu / Lucas"
                                    className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                                  />
                                </div>

                                <div className="space-y-1 text-left">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase block">E-mail de Acesso *</label>
                                  <input
                                    type="email"
                                    required
                                    disabled={!!selectedColPortalId}
                                    value={colPortalEmail}
                                    onChange={(e) => setColPortalEmail(e.target.value)}
                                    placeholder="colaborador@facilities.com.br"
                                    className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29] disabled:opacity-60"
                                  />
                                </div>

                                <div className="space-y-1 font-sans text-left">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase block">CPF / Documento</label>
                                  <input
                                    type="text"
                                    value={colPortalCpf}
                                    onChange={(e) => setColPortalCpf(e.target.value)}
                                    placeholder="000.000.000-00"
                                    className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                                  />
                                </div>

                                <div className="space-y-1 text-left">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Cargo / Setor / Atribuição *</label>
                                  <input
                                    type="text"
                                    required
                                    value={colPortalUnidade}
                                    onChange={(e) => setColPortalUnidade(e.target.value)}
                                    placeholder="Ex: Supervisor Campo ou Técnico de Manutenção"
                                    className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                                  />
                                </div>

                                <div className="space-y-1 text-left">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Acesso Ativo? *</label>
                                  <select
                                    required
                                    value={colPortalAtivo ? 'true' : 'false'}
                                    onChange={(e) => setColPortalAtivo(e.target.value === 'true')}
                                    className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-bold text-[#101c29] cursor-pointer"
                                  >
                                    <option value="true">Ativo (Permitir Entrada)</option>
                                    <option value="false">Bloqueado / Inativo</option>
                                  </select>
                                </div>

                                {!selectedColPortalId && (
                                  <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Senha de Acesso do Colaborador *</label>
                                    <input
                                      type="password"
                                      required
                                      value={colPortalPassword}
                                      onChange={(e) => setColPortalPassword(e.target.value)}
                                      placeholder="Senha de acesso (mín 6 digitos)"
                                      className="w-full bg-[#f1f4f8] text-xs p-2.5 rounded-lg outline-none font-semibold text-[#101c29]"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* FIXED TYPE DE PERFIL WITH EXPLICIT DESCRIPTION AND NO OPTIONS */}
                              <div className="space-y-1 text-left">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block">Tipo de Perfil Atribuído (FIXO/RESTRETO) *</label>
                                <div className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg font-bold text-slate-705 flex items-center justify-between select-none">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    <span>COLABORADOR</span>
                                  </div>
                                  <span className="text-[9px] text-[#af101a] font-extrabold uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded border border-red-200">FIXO - SEM OUTRO TIPO</span>
                                </div>
                                <span className="text-[9px] text-gray-400 block mt-0.5 font-bold font-sans">Por determinação de segurança, este formulário cadastra perfis estritamente como colaboradores.</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                  type="submit"
                                  className="bg-primary hover:bg-[#af101a] text-white py-2.5 text-xs font-bold rounded-lg transition-transform focus:scale-95 cursor-pointer text-center"
                                >
                                  {selectedColPortalId ? 'Salvar Alterações' : 'Salvar Colaborador'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedColPortalId(null);
                                    setColPortalNome('');
                                    setColPortalEmail('');
                                    setColPortalCpf('');
                                    setColPortalUnidade('');
                                    setColPortalPassword('');
                                    setColPortalAtivo(true);
                                    setColPortalCondoId('cd-gonzaga');
                                    setShowColPortalForm(false);
                                  }}
                                  className="bg-gray-100 hover:bg-[#af101a]/10 hover:text-[#af101a] text-gray-650 font-bold px-3 py-2.5 text-xs rounded-lg transition-transform active:scale-95 cursor-pointer text-center border border-slate-100"
                                >
                                  {selectedColPortalId ? 'Cancelar' : 'Limpar'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Listagem de Colaboradores Cadastrados */}
                      <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-left space-y-4 border border-slate-100">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 flex-wrap gap-2">
                          <div>
                            <h4 className="text-xs font-extrabold text-[#0f1b29] uppercase tracking-wider">
                              Colaboradores Cadastrados no Sistema
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold">Gerencie ou adicione perfis de colaboradores. Por segurança, o perfil de acesso é rigidamente definido como "Colaborador".</p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Filtro por Origem de Cadastro */}
                            <div className="flex bg-[#f1f4f8] p-1 rounded-lg border border-gray-100">
                              <button
                                type="button"
                                onClick={() => setColPortalFiltroOrigem('todos')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                  colPortalFiltroOrigem === 'todos'
                                    ? 'bg-white text-[#af101a] shadow-sm'
                                    : 'text-[#5f5e5e] hover:text-gray-900 font-bold'
                                }`}
                              >
                                Todos
                              </button>
                              <button
                                type="button"
                                onClick={() => setColPortalFiltroOrigem('admin')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                  colPortalFiltroOrigem === 'admin'
                                    ? 'bg-white text-[#af101a] shadow-sm'
                                    : 'text-[#5f5e5e] hover:text-gray-900 font-bold'
                                }`}
                              >
                                Cadastrados por Admin
                              </button>
                            </div>

                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-3.5 h-3.5 text-gray-400" />
                              </span>
                              <input
                                type="text"
                                value={colPortalSearch}
                                onChange={(e) => setColPortalSearch(e.target.value)}
                                placeholder="Filtrar colaboradores..."
                                className="pl-9 pr-4 py-1.5 bg-[#f1f4f8] text-xs outline-none rounded-lg font-bold text-[#101c29] border border-transparent focus:border-stone-200"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left text-stone-800">
                            <thead>
                              <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px]">
                                <th className="py-2.5">Nome Completo</th>
                                <th className="py-2.5">Apelido</th>
                                <th className="py-2.5">E-mail de Acesso</th>
                                <th className="py-2.5">CPF</th>
                                <th className="py-2.5">Cargo / Atribuição</th>
                                <th className="py-2.5">Condomínio Vinculado</th>
                                <th className="py-2.5 text-center">Status</th>
                                <th className="py-2.5 text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                // Obter todos os usuários com papel colaborador
                                const localData = localStorage.getItem('supabase_sim_perfis');
                                let mergedList = [];
                                if (localData) {
                                  try { mergedList = JSON.parse(localData); } catch {}
                                }
                                
                                // Filtrar perfis colaboradores de ambas as bases de dados (perfis e usersDb)
                                const uniqueEmails = new Set();
                                const colabs: any[] = [];

                                mergedList.forEach((p: any) => {
                                  const roleStr = (p.tipo || p.perfil || '').toLowerCase();
                                  if (roleStr === 'colaborador' || roleStr === 'colab') {
                                    if (p.email && !uniqueEmails.has(p.email.toLowerCase())) {
                                      uniqueEmails.add(p.email.toLowerCase());
                                      colabs.push({
                                        id: p.id,
                                        nome: p.nome || p.name,
                                        email: p.email,
                                        cpf: p.cpf,
                                        unidade: p.unidade || p.unit,
                                        ativo: p.ativo !== false,
                                        condominio_id: p.condominio_id,
                                        apelido: p.apelido || '',
                                        cadastrado_por: p.cadastrado_por || 'Administrador'
                                      });
                                    }
                                  }
                                });

                                usersDb.forEach((u: any) => {
                                  const roleStr = (u.profile || '').toLowerCase();
                                  if (roleStr === 'colaborador' || roleStr === 'colab') {
                                    if (u.email && !uniqueEmails.has(u.email.toLowerCase())) {
                                      uniqueEmails.add(u.email.toLowerCase());
                                      colabs.push({
                                        id: u.cpf || u.email,
                                        nome: u.name,
                                        email: u.email,
                                        cpf: u.cpf,
                                        unidade: u.unit,
                                        ativo: u.ativo !== false,
                                        condominio_id: u.condominio_id,
                                        apelido: u.apelido || '',
                                        cadastrado_por: u.cadastrado_por || 'Administrador'
                                      });
                                    }
                                  }
                                });

                                const filtered = colabs.filter(p => {
                                  if (colPortalFiltroOrigem === 'admin') {
                                    return p.cadastrado_por === 'Administrador' || p.cadastrado_por === 'admin' || !p.cadastrado_por;
                                  }
                                  return true;
                                }).filter(p => {
                                  if (!colPortalSearch.trim()) return true;
                                  const searchLower = colPortalSearch.toLowerCase();
                                  return (
                                    (p.nome || '').toLowerCase().includes(searchLower) ||
                                    (p.email || '').toLowerCase().includes(searchLower) ||
                                    (p.unidade || '').toLowerCase().includes(searchLower) ||
                                    (p.apelido || '').toLowerCase().includes(searchLower)
                                  );
                                });

                                if (filtered.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={8} className="py-6 text-center text-gray-400 font-bold italic">
                                        Nenhum colaborador foi encontrado com os critérios de filtragem.
                                      </td>
                                    </tr>
                                  );
                                }

                                return filtered.map(item => {
                                  // Obter nome legível do condomínio
                                  const condoName = condos.find(c => c.id === item.condominio_id)?.nome || 'Sede Geral Santos';
                                  return (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                                      <td className="py-3 font-bold text-stone-850 flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-[10px]">
                                          {item.nome.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5">
                                          <span className="text-stone-850 font-bold">{item.nome}</span>
                                          {(item.cadastrado_por === 'Administrador' || item.cadastrado_por === 'admin' || !item.cadastrado_por) && (
                                            <span className="bg-red-50 text-[#af101a] border border-red-150 text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide" style={{ fontSize: '8px', lineHeight: '10px' }} title="Este colaborador foi registrado pela administração">
                                              Cadastrado pelo Admin
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 text-stone-700 font-semibold italic text-xs">{item.apelido || '-'}</td>
                                      <td className="py-3 text-gray-600 font-mono select-all text-xs">{item.email}</td>
                                      <td className="py-3 text-gray-500 font-mono text-xs">{item.cpf || 'Não especificado'}</td>
                                      <td className="py-3 font-semibold text-[#0f1b29] text-xs">{item.unidade || 'Sem Cargo'}</td>
                                      <td className="py-3 text-gray-500 text-xs truncate max-w-[160px]" title={condoName}>{condoName}</td>
                                      <td className="py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                                          item.ativo !== false
                                            ? 'bg-green-50 text-green-700 border-green-150'
                                            : 'bg-red-50 text-red-750 border-red-150'
                                        }`}>
                                          {item.ativo !== false ? 'ATIVO' : 'BLOQUEADO'}
                                        </span>
                                      </td>
                                      <td className="py-3 text-right">
                                        <div className="flex gap-2 justify-end">
                                          <button
                                            onClick={() => {
                                              setSelectedColPortalId(item.id);
                                              setColPortalNome(item.nome);
                                              setColPortalEmail(item.email);
                                              setColPortalApelido(item.apelido || '');
                                              setColPortalCpf(item.cpf || '');
                                              setColPortalUnidade(item.unidade || '');
                                              setColPortalAtivo(item.ativo !== false);
                                              setColPortalCondoId(item.condominio_id || 'cd-gonzaga');
                                              setShowColPortalForm(true);
                                            }}
                                            className="p-1.5 hover:bg-stone-100 rounded text-stone-600 transition-colors active:scale-95 cursor-pointer"
                                            title="Editar cadastro"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteColaboradorPortal(item.id, item.email, item.nome)}
                                            className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-650 rounded transition-colors active:scale-95 cursor-pointer"
                                            title="Remover colaborador"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
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
                                <tr 
                                  key={idx} 
                                  onClick={() => {
                                    setDetailedCondo(item);
                                    setActiveTab('admin_condominios');
                                  }}
                                  className="hover:bg-gray-50 cursor-pointer"
                                  title="Clique para ver os detalhes completos deste condomínio"
                                >
                                  <td className="p-4 font-bold text-[#101c29] hover:text-primary transition-colors">{item.nome}</td>
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
