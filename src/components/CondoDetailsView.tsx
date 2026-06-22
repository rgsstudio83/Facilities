import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Building2,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  DollarSign,
  FileText,
  Download,
  Upload,
  TrendingUp,
  Bell,
  Phone,
  Mail,
  Check,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Home,
  Briefcase
} from 'lucide-react';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import AddSindicoModal from './AddSindicoModal';
import { Sindico } from '../types';

interface CondoDetailsViewProps {
  condo: any;
  onBack: () => void;
  onEdit: (condo: any) => void;
  onDelete: (condo: any) => void;
  onShowNotification: (headline: string, text: string) => void;
}

export default function CondoDetailsView({
  condo,
  onBack,
  onEdit,
  onDelete,
  onShowNotification
}: CondoDetailsViewProps) {
  // Tabs: geral, blocos, unidades, moradores, financeiro, comunicados, ocorrencias, documentos
  const [activeTab, setActiveTab] = useState<string>('geral');

  // --- PERSISTENT SUB-STATES KEYED BY CONDO ID ---
  const [blocks, setBlocks] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [financeLogs, setFinanceLogs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Search & Filter state
  const [unitSearch, setUnitSearch] = useState('');
  const [residentSearch, setResidentSearch] = useState('');
  const [residentFilter, setResidentFilter] = useState('Todos');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('Todos');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('Todos');
  const [ticketSearch, setTicketSearch] = useState('');

  // Form states
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any | null>(null);
  const [blockName, setBlockName] = useState('');
  const [blockUnitsCount, setBlockUnitsCount] = useState(12);

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [unitNumber, setUnitNumber] = useState('');
  const [unitBlock, setUnitBlock] = useState('');
  const [unitOwner, setUnitOwner] = useState('');
  const [unitResident, setUnitResident] = useState('');
  const [unitStatus, setUnitStatus] = useState('Ocupado');

  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [editingResident, setEditingResident] = useState<any | null>(null);
  const [resName, setResName] = useState('');
  const [resUnit, setResUnit] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resStatus, setResStatus] = useState('Ativo');
  const [resPassword, setResPassword] = useState('');
  const [resEnableAuth, setResEnableAuth] = useState(false);

  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [txDesc, setTxDesc] = useState('');
  const [txCat, setTxCat] = useState('Taxa Condominial');
  const [txType, setTxType] = useState<'Receita' | 'Despesa'>('Receita');
  const [txVal, setTxVal] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  const [showAddAnnModal, setShowAddAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<any | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAuthor, setAnnAuthor] = useState('Síndico');
  const [annStatus, setAnnStatus] = useState('Ativo');

  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [tktTitle, setTktTitle] = useState('');
  const [tktDesc, setTktDesc] = useState('');
  const [tktCategory, setTktCategory] = useState('Manutenção');
  const [tktResident, setTktResident] = useState('');
  const [tktPriority, setTktPriority] = useState('Média');

  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [docTitleState, setDocTitleState] = useState('');
  const [docCategoryState, setDocCategoryState] = useState('Outros');
  const [docExtensionState, setDocExtensionState] = useState('PDF');
  const [docSizeState, setDocSizeState] = useState('120 KB');

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion confirm modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // General observations
  const [observations, setObservations] = useState(() => {
    return localStorage.getItem(`facilities_obs_${condo.id}`) || 
      'Condomínio de excelente padrão. Portaria com monitoramento por câmeras IP de última geração, controle de acesso facial instalado em todas as portarias sociais e acesso veicular com tags automáticas RFID. Área verde monitorada diariamente.';
  });

  // --- SÍNDICO GESTÃO DE PERFIL ---
  const [sindicoProfile, setSindicoProfile] = useState<any | null>(null);
  const [showSyndicModal, setShowSyndicModal] = useState(false);
  const [syndicName, setSyndicName] = useState('');
  const [syndicLastName, setSyndicLastName] = useState('');
  const [syndicNickname, setSyndicNickname] = useState('');
  const [syndicCpf, setSyndicCpf] = useState('');
  const [syndicPhoto, setSyndicPhoto] = useState('');
  const [syndicPhone, setSyndicPhone] = useState('');
  const [syndicWhatsapp, setSyndicWhatsapp] = useState('');
  const [syndicEmail, setSyndicEmail] = useState('');
  const [isSavingSyndic, setIsSavingSyndic] = useState(false);

  // New state variables for AddSindicoModal integration
  const [showAddSindicoModal, setShowAddSindicoModal] = useState(false);
  const [sindicoToEdit, setSindicoToEdit] = useState<Sindico | null>(null);

  useEffect(() => {
    const loadSindicoProfile = async () => {
      console.log(`[CondoDetailsView] Buscando síndico para o condomínio ID: ${condo.id} da tabela 'sindico'`);
      if (isSupabaseConfigured && supabase) {
        try {
          // Attempt to load from the 'sindico' table first using the condominio_id index match
          const { data: sindicoData } = await supabase
            .from('sindico')
            .select('*')
            .eq('condominio_id', condo.id)
            .limit(1);

          if (sindicoData && sindicoData.length > 0) {
            const s = sindicoData[0];
            const fullNameCombined = `${s.nome} ${s.sobrenome || ''}`.trim();
            condo.sindico = fullNameCombined;
            console.log(`[CondoDetailsView] Síndico encontrado na tabela 'sindico':`, s);
            setSindicoProfile({
              id: s.id,
              nome: s.nome,
              sobrenome: s.sobrenome || '',
              apelido: s.apelido || '',
              cpf: s.cpf || '',
              foto_perfil: s.foto_url || '',
              telefone: s.telefone || '',
              whatsapp: s.whatsapp || '',
              email: s.email || `sindico.${condo.nome.toLowerCase().replace(/\s+/g, '')}@facilities.com`,
              tipo: 'sindico',
              perfil: 'Síndico',
              unidade: `Condomínio: ${condo.nome}`,
              condominio_id: condo.id
            });
            return;
          }

          // Fallback to older profiles schema
          const { data } = await supabase
            .from('perfil')
            .select('*')
            .eq('tipo', 'sindico')
            .or(`unidade.eq.Condomínio: ${condo.nome},unidade.eq.Condomínio: ${condo.id}`)
            .limit(1);

          if (data && data.length > 0) {
            console.log(`[CondoDetailsView] Síndico carregado via fallback de perfil:`, data[0]);
            setSindicoProfile(data[0]);
            return;
          }
        } catch (e) {
          console.warn("[CondoDetailsView] Supabase load fallback error:", e);
        }
      }

      // Local storage fallback for simulation mode
      const localSimPlural = localStorage.getItem('supabase_sim_perfis');
      const localSimSingular = localStorage.getItem('supabase_sim_perfil');
      const localSimSindico = localStorage.getItem('supabase_sim_sindico');
      
      if (localSimSindico) {
        try {
          const list = JSON.parse(localSimSindico);
          const found = list.find((s: any) => s.condominio_id === condo.id);
          if (found) {
            const fullNameCombined = `${found.nome} ${found.sobrenome || ''}`.trim();
            condo.sindico = fullNameCombined;
            console.log(`[CondoDetailsView] Síndico simulado encontrado na tabela 'sindico' local:`, found);
            setSindicoProfile({
              id: found.id,
              nome: found.nome,
              sobrenome: found.sobrenome || '',
              apelido: found.apelido || '',
              cpf: found.cpf || '',
              foto_perfil: found.foto_url || '',
              telefone: found.telefone || '',
              whatsapp: found.whatsapp || '',
              email: found.email || `sindico.${condo.nome.toLowerCase().replace(/\s+/g, '')}@facilities.com`,
              tipo: 'sindico',
              perfil: 'Síndico',
              unidade: `Condomínio: ${condo.nome}`,
              condominio_id: condo.id
            });
            return;
          }
        } catch (_) {}
      }

      const plazas = localSimPlural || localSimSingular;
      if (plazas) {
        const perfisList = JSON.parse(plazas);
        const found = perfisList.find((p: any) => 
          (p.tipo === 'sindico' || p.perfil?.toLowerCase() === 'síndico' || p.perfil?.toLowerCase() === 'sindico') && 
          (p.unidade === `Condomínio: ${condo.nome}` || p.condominio_id === condo.id)
        );
        if (found) {
          console.log(`[CondoDetailsView] Síndico simulado carregado via perfil:`, found);
          setSindicoProfile(found);
        }
      }
    };
    loadSindicoProfile();
  }, [condo.id, condo.nome, isSupabaseConfigured]);

  const handleDeleteSyndic = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Delete from 'sindico' table
        await supabase
          .from('sindico')
          .delete()
          .eq('condominio_id', condo.id);

        // Delete from 'perfil'
        await supabase
          .from('perfil')
          .delete()
          .eq('tipo', 'sindico')
          .or(`unidade.eq.Condomínio: ${condo.nome},unidade.eq.Condomínio: ${condo.id}`);

        // Update 'condominios' to remove visual reference
        await supabase
          .from('condominios')
          .update({ sindico: null })
          .eq('id', condo.id);
      } catch (err) {
        console.error("Error deleting syndic in Supabase:", err);
      }
    }

    // Clean up local storage lists
    const cleanLocalList = (key: string) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const filtered = list.filter((p: any) => 
            !(
              (p.tipo === 'sindico' || p.perfil?.toLowerCase() === 'síndico' || p.perfil?.toLowerCase() === 'sindico' || p.condominio_id === condo.id) && 
              (p.unidade === `Condomínio: ${condo.nome}` || p.condominio_id === condo.id)
            )
          );
          localStorage.setItem(key, JSON.stringify(filtered));
        } catch (_) {}
      }
    };

    cleanLocalList('supabase_sim_perfis');
    cleanLocalList('supabase_sim_perfil');
    
    // Specifically clean up table 'sindico' replica
    const storedSindico = localStorage.getItem('supabase_sim_sindico');
    if (storedSindico) {
      try {
        const list = JSON.parse(storedSindico);
        const filtered = list.filter((s: any) => s.condominio_id !== condo.id);
        localStorage.setItem('supabase_sim_sindico', JSON.stringify(filtered));
      } catch (_) {}
    }

    // Update local condo state
    condo.sindico = '';
    const simCondos = localStorage.getItem('supabase_sim_condominios') || localStorage.getItem('facilities_portal_condos');
    if (simCondos) {
      try {
        const parsedCondos = JSON.parse(simCondos);
        const updated = parsedCondos.map((c: any) => {
          if (c.id === condo.id || c.nome === condo.nome) {
            return { ...c, sindico: '' };
          }
          return c;
        });
        localStorage.setItem('supabase_sim_condominios', JSON.stringify(updated));
        localStorage.setItem('facilities_portal_condos', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
    }

    setSindicoProfile(null);
    onShowNotification("Sucesso", "Cadastro de Síndico excluído com sucesso.");
  };

  const handleSaveSyndic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syndicName.trim()) {
      onShowNotification("Erro", "O Nome é obrigatório.");
      return;
    }
    if (!syndicEmail.trim()) {
      onShowNotification("Erro", "O E-mail é obrigatório.");
      return;
    }

    setIsSavingSyndic(true);

    const cleanCpf = syndicCpf.replace(/\D/g, '');
    const formattedCpf = cleanCpf.length === 11 
      ? cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : syndicCpf;

    const targetId = sindicoProfile?.id || crypto.randomUUID();

    const newSyndicProfile = {
      id: targetId,
      auth_user_id: targetId,
      nome: syndicName,
      sobrenome: syndicLastName,
      apelido: syndicNickname,
      cpf: formattedCpf,
      foto_perfil: syndicPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      telefone: syndicPhone,
      whatsapp: syndicWhatsapp,
      email: syndicEmail,
      tipo: 'sindico',
      perfil: 'Síndico',
      unidade: `Condomínio: ${condo.nome}`,
      condominio_id: condo.id
    };

    if (isSupabaseConfigured && supabase) {
      try {
        // Safe robust write to new table 'sindico' with reliable foreign key 'condominio_id'
        await supabase.from('sindico').upsert({
          id: targetId,
          nome: syndicName,
          sobrenome: syndicLastName,
          apelido: syndicNickname,
          cpf: formattedCpf,
          foto_url: syndicPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          telefone: syndicPhone,
          whatsapp: syndicWhatsapp,
          condominio_id: condo.id
        });

        await supabase.from('perfil').upsert({
          id: targetId,
          nome: syndicName,
          sobrenome: syndicLastName,
          apelido: syndicNickname,
          cpf: formattedCpf,
          foto_perfil: syndicPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          telefone: syndicPhone,
          whatsapp: syndicWhatsapp,
          email: syndicEmail,
          tipo: 'sindico',
          unidade: `Condomínio: ${condo.nome}`,
          condominio_id: condo.id
        });

        const fullNameCombined = `${syndicName} ${syndicLastName}`.trim();
        await supabase.from('condominios').update({ sindico: fullNameCombined }).eq('id', condo.id);
      } catch (err: any) {
        console.error("Supabase Save Error:", err);
      }
    }

    const plazas = localStorage.getItem('supabase_sim_perfis') || '[]';
    let plist: any[] = [];
    try { plist = JSON.parse(plazas); } catch(err) { plist = []; }
    plist = plist.filter((p: any) => !(p.tipo === 'sindico' && (p.unidade === `Condomínio: ${condo.nome}` || p.condominio_id === condo.id)));
    plist.unshift(newSyndicProfile);
    localStorage.setItem('supabase_sim_perfis', JSON.stringify(plist));
    localStorage.setItem('supabase_sim_perfil', JSON.stringify(plist));

    // Also persist inside local table 'sindico'
    const currentSindicosLocal = localStorage.getItem('supabase_sim_sindico') || '[]';
    let slist: any[] = [];
    try { slist = JSON.parse(currentSindicosLocal); } catch(_) {}
    slist = slist.filter((s: any) => s.condominio_id !== condo.id);
    slist.unshift({
      id: targetId,
      nome: syndicName,
      sobrenome: syndicLastName,
      apelido: syndicNickname,
      cpf: formattedCpf,
      foto_url: syndicPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      telefone: syndicPhone,
      whatsapp: syndicWhatsapp,
      condominio_id: condo.id,
      email: syndicEmail
    });
    localStorage.setItem('supabase_sim_sindico', JSON.stringify(slist));

    const fullNameCombined = `${syndicName} ${syndicLastName}`.trim();
    condo.sindico = fullNameCombined;

    const simCondos = localStorage.getItem('supabase_sim_condominios') || localStorage.getItem('facilities_portal_condos');
    if (simCondos) {
      try {
        const parsedCondos = JSON.parse(simCondos);
        const updated = parsedCondos.map((c: any) => {
          if (c.id === condo.id || c.nome === condo.nome) {
            return { ...c, sindico: fullNameCombined };
          }
          return c;
        });
        localStorage.setItem('supabase_sim_condominios', JSON.stringify(updated));
        localStorage.setItem('facilities_portal_condos', JSON.stringify(updated));
      } catch (err) {
        console.error("Error parsing condos:", err);
      }
    }

    setSindicoProfile(newSyndicProfile);
    setIsSavingSyndic(false);
    setShowSyndicModal(false);
    onShowNotification("Sucesso", `Síndico "${fullNameCombined}" salvo com sucesso no perfil.`);
  };

  // --- INITIALIZE & SYNC DATA ON LOAD ---
  useEffect(() => {
    // 1. BLOCKS
    const savedBlocks = localStorage.getItem(`facilities_condo_${condo.id}_blocks`);
    if (savedBlocks) {
      setBlocks(JSON.parse(savedBlocks));
    } else {
      const initialBlocks = [
        { id: 'b1', name: 'Bloco A', unitsCount: Math.ceil(condo.unidades / 2) },
        { id: 'b2', name: 'Bloco B', unitsCount: condo.unidades - Math.ceil(condo.unidades / 2) }
      ];
      setBlocks(initialBlocks);
      localStorage.setItem(`facilities_condo_${condo.id}_blocks`, JSON.stringify(initialBlocks));
    }

    // 2. UNITS
    const savedUnits = localStorage.getItem(`facilities_condo_${condo.id}_units`);
    if (savedUnits) {
      setUnits(JSON.parse(savedUnits));
    } else {
      const generatedUnits: any[] = [];
      const blocksList = ['Bloco A', 'Bloco B'];
      const owners = ['Antônio Carlos', 'Mariana Alencar', 'Rodolfo Vieira', 'Renata Santos', 'Felipe Castro', 'Camila Pires', 'Juliana Lima', 'Patrícia Mendes'];
      const residentsList = ['Carlos Eduardo', 'Aline Prado', 'Sandra Ramos', 'Renata Santos', 'Eduardo Santos', 'Guilherme Souza', 'Juliana Lima', 'Marcos Toledo'];
      
      let unitCounter = 0;
      blocksList.forEach((blName, blIndex) => {
        const uCount = blIndex === 0 ? Math.ceil(condo.unidades / 2) : condo.unidades - Math.ceil(condo.unidades / 2);
        for (let num = 1; num <= uCount; num++) {
          if (unitCounter >= condo.unidades) break;
          const floor = Math.ceil(num / 4);
          const apto = `${floor}${num % 4 === 0 ? 4 : num % 4}`;
          const isOwnerResident = Math.random() > 0.3;
          const owner = owners[num % owners.length];
          const resident = isOwnerResident ? owner : residentsList[num % residentsList.length];
          const status = Math.random() > 0.15 ? 'Ocupado' : Math.random() > 0.5 ? 'Reforma' : 'Vago';
          
          generatedUnits.push({
            id: `u-${blIndex}-${num}`,
            number: `${apto}`,
            block: blName,
            owner,
            resident,
            status
          });
          unitCounter++;
        }
      });
      setUnits(generatedUnits);
      localStorage.setItem(`facilities_condo_${condo.id}_units`, JSON.stringify(generatedUnits));
    }

    // 3. RESIDENTS
    const savedRes = localStorage.getItem(`facilities_condo_${condo.id}_residents`);
    if (savedRes) {
      setResidents(JSON.parse(savedRes));
    } else {
      const initialResidents = [
        { id: 'r1', name: 'Carlos Eduardo Santos', unit: 'Apto 11 (A)', phone: '(13) 99124-5501', email: 'carlosedu@reallife.com', status: 'Ativo' },
        { id: 'r2', name: 'Mariana Alencar Castro', unit: 'Apto 12 (A)', phone: '(13) 98844-3322', email: 'mcastro@hotmail.com', status: 'Ativo' },
        { id: 'r3', name: 'Sandra Ramos Toledo', unit: 'Apto 21 (A)', phone: '(13) 99182-4545', email: 'sandra.ramos@uol.com.br', status: 'Ativo' },
        { id: 'r4', name: 'Guilherme Souza Silva', unit: 'Apto 11 (B)', phone: '(13) 98111-2090', email: 'gui_souza@gmail.com', status: 'Ativo' },
        { id: 'r5', name: 'Rodolfo Vieira Filho', unit: 'Apto 22 (A)', phone: '(13) 99140-5882', email: 'rodolfo_filho@empresa.com.br', status: 'Inativo' },
        { id: 'r6', name: 'Bruno Dias Albuquerque', unit: 'Apto 33 (B)', phone: '(13) 97711-2055', email: 'bruno_dias_apto@outlook.com', status: 'Temporário' }
      ];
      setResidents(initialResidents);
      localStorage.setItem(`facilities_condo_${condo.id}_residents`, JSON.stringify(initialResidents));
    }

    // 4. FINANCIAL LOGS
    const savedFinStr = localStorage.getItem(`facilities_condo_${condo.id}_fin`);
    if (savedFinStr) {
      setFinanceLogs(JSON.parse(savedFinStr));
    } else {
      const initialLogs = [
        { id: 'f1', description: 'Arrecadação de Taxa Condominial Ordinária', category: 'Taxa Condominial', type: 'Receita', value: condo.receita * 0.9, date: '2026-06-01', status: 'Confirmado' },
        { id: 'f2', description: 'Folha de Pagamento de Colaboradores e Encargos', category: 'Recursos Humanos', type: 'Despesa', value: condo.despesa * 0.45, date: '2026-06-05', status: 'Confirmado' },
        { id: 'f3', description: 'Manutenção do Sistema de Incêndio e Para-raios', category: 'Manutenção', type: 'Despesa', value: 3820, date: '2026-06-06', status: 'Confirmado' },
        { id: 'f4', description: 'Fundo de Reserva Habitual do Mês', category: 'Fundo Reserva', type: 'Receita', value: condo.receita * 0.1, date: '2026-06-01', status: 'Confirmado' },
        { id: 'f5', description: 'Despesa de Consumo Elétrico Direto Áreas Comuns CPFL', category: 'Utilities', type: 'Despesa', value: 4120, date: '2026-06-02', status: 'Confirmado' },
        { id: 'f6', description: 'Soma de Acordos de Inadimplência Recebidos', category: 'Acordos', type: 'Receita', value: 5200, date: '2026-06-08', status: 'Confirmado' }
      ];
      setFinanceLogs(initialLogs);
      localStorage.setItem(`facilities_condo_${condo.id}_fin`, JSON.stringify(initialLogs));
    }

    // 5. ANNOUNCEMENTS
    const savedAnn = localStorage.getItem(`facilities_condo_${condo.id}_announcements`);
    if (savedAnn) {
      setAnnouncements(JSON.parse(savedAnn));
    } else {
      const initialAnn = [
        { id: 'a1', title: 'Manutenção Preventiva Semestral nos Elevadores', content: 'Prezados moradores, informamos que no dia 15/06 os elevadores do Bloco A passarão por auditoria e substituição de cabos de tração preventivos. O serviço ocorrerá das 09:00 às 16:30.', date: '2026-06-08', author: 'Síndico Responsável', status: 'Ativo' },
        { id: 'a2', title: 'Assembleia Geral Ordinária Virtual - Prestação de Contas', content: 'Convocamos todos para a AGO que será realizada via aplicativo de videoconferência no dia 22/06 às 20h para votação do orçamento e auditoria do exercício anterior.', date: '2026-06-05', author: 'Administradora Facilities', status: 'Ativo' },
        { id: 'a3', title: 'Novas Regras de Descarte de Lixo Reciclável', content: 'Lembramos a obrigatoriedade de ensacar adequadamente os materiais recicláveis secos nas lixeiras identificadas. Multas começarão a ser aplicadas a partir de Julho conforme regimento.', date: '2026-05-28', author: 'Conselho Consultivo', status: 'Arquivado' }
      ];
      setAnnouncements(initialAnn);
      localStorage.setItem(`facilities_condo_${condo.id}_announcements`, JSON.stringify(initialAnn));
    }

    // 6. TICKETS
    const savedTkts = localStorage.getItem(`facilities_condo_${condo.id}_tickets`);
    if (savedTkts) {
      setTickets(JSON.parse(savedTkts));
    } else {
      const initialTkts = [
        { id: 't1', title: 'Vazamento crônico de água no teto da garagem do subsolo', category: 'Manutenção', description: 'Goteira contínua com coloração esbranquiçada danificando a pintura de veículos na vaga 42.', date: '2026-06-02', resident: 'Aline Prado (Apto 12-A)', status: 'Em Andamento', priority: 'Alta' },
        { id: 't2', title: 'Iluminação queimada no hall do 6º andar do Bloco B', category: 'Limpeza/Manutenção', description: 'Lâmpada tubular fluorescente queimada causando total escuridão na frentre do elevador social.', date: '2026-06-07', resident: 'Mariana Alencar (Apto 12-A)', status: 'Aberto', priority: 'Média' },
        { id: 't3', title: 'Barulho excessivo e música alta fora do horário regulamentar', category: 'Barulho', description: 'Perturbação recorrente vinda da unidade 32 do Bloco A durante a madrugada do último sábado.', date: '2026-06-01', resident: 'Guilherme Souza (Apto 11-B)', status: 'Resolvido', priority: 'Baixa' }
      ];
      setTickets(initialTkts);
      localStorage.setItem(`facilities_condo_${condo.id}_tickets`, JSON.stringify(initialTkts));
    }

    // 7. DOCUMENTS
    const savedDocs = localStorage.getItem(`facilities_condo_${condo.id}_documents`);
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    } else {
      const initialDocs = [
        { id: 'd1', title: 'Convenção Original Registrada em Cartório', category: 'Convenções', size: '2.4 MB', date: '12/03/2018', extension: 'PDF' },
        { id: 'd2', title: 'Ata da Assembleia Geral Ordinária - Março 2026', category: 'Atas', size: '640 KB', date: '21/03/2026', extension: 'PDF' },
        { id: 'd3', title: 'Regulamento Interno de Uso de Áreas de Lazer Atualizado', category: 'Regulamentos', size: '420 KB', date: '10/11/2025', extension: 'PDF' },
        { id: 'd4', title: 'Contrato de Prestação de Serviços de Segurança Facial Eletrônica', category: 'Contratos', size: '1.2 MB', date: '04/01/2026', extension: 'PDF' }
      ];
      setDocuments(initialDocs);
      localStorage.setItem(`facilities_condo_${condo.id}_documents`, JSON.stringify(initialDocs));
    }
  }, [condo.id]);

  // --- SAVE OBSERVATIONS IN REAL TIME ---
  const handleSaveObs = () => {
    localStorage.setItem(`facilities_obs_${condo.id}`, observations);
    onShowNotification('Observações Salvas', 'Histórico e comentários do condomínio arquivados.');
  };

  // --- CRUD OPERATORS ---
  const saveToStorage = (keySuffix: string, data: any) => {
    localStorage.setItem(`facilities_condo_${condo.id}_${keySuffix}`, JSON.stringify(data));
  };

  // 1. Blocks CRUD
  const handleAddBlockSubmit = (e: any) => {
    e.preventDefault();
    if (!blockName.trim()) return;
    const newBlock = {
      id: editingBlock ? editingBlock.id : `b-${Date.now()}`,
      name: blockName,
      unitsCount: Number(blockUnitsCount) || 0
    };
    let updated;
    if (editingBlock) {
      updated = blocks.map(b => b.id === editingBlock.id ? newBlock : b);
      onShowNotification('Sucesso', 'Bloco atualizado.');
    } else {
      updated = [...blocks, newBlock];
      onShowNotification('Sucesso', 'Bloco cadastrado no condomínio.');
    }
    setBlocks(updated);
    saveToStorage('blocks', updated);
    setBlockName('');
    setBlockUnitsCount(12);
    setEditingBlock(null);
    setShowAddBlockModal(false);
  };

  const handleEditBlock = (b: any) => {
    setEditingBlock(b);
    setBlockName(b.name);
    setBlockUnitsCount(b.unitsCount);
    setShowAddBlockModal(true);
  };

  const handleDeleteBlock = (bId: string) => {
    const blockObj = blocks.find(b => b.id === bId);
    setDeleteConfirm({
      isOpen: true,
      title: 'Confirmar Exclusão de Bloco',
      message: `Tem certeza de que deseja remover o "${blockObj?.name || 'bloco'}" da estrutura? Esta ação é irreversível.`,
      onConfirm: () => {
        const updated = blocks.filter(b => b.id !== bId);
        setBlocks(updated);
        saveToStorage('blocks', updated);
        onShowNotification('Sucesso', 'Bloco removido.');
        setDeleteConfirm(null);
      }
    });
  };

  // 2. Units CRUD
  const handleAddUnitSubmit = (e: any) => {
    e.preventDefault();
    if (!unitNumber.trim() || !unitBlock) return;
    const newUnit = {
      id: editingUnit ? editingUnit.id : `u-${Date.now()}`,
      number: unitNumber,
      block: unitBlock,
      owner: unitOwner || 'Sem Informação',
      resident: unitResident || 'Vago/Sem morador',
      status: unitStatus
    };
    let updated;
    if (editingUnit) {
      updated = units.map(u => u.id === editingUnit.id ? newUnit : u);
      onShowNotification('Sucesso', 'Unidade residencial atualizada.');
    } else {
      updated = [...units, newUnit];
      onShowNotification('Sucesso', 'Unidade residencial adicionada.');
    }
    setUnits(updated);
    saveToStorage('units', updated);
    setUnitNumber('');
    setUnitBlock('');
    setUnitOwner('');
    setUnitResident('');
    setUnitStatus('Ocupado');
    setEditingUnit(null);
    setShowAddUnitModal(false);
  };

  const handleEditUnit = (u: any) => {
    setEditingUnit(u);
    setUnitNumber(u.number);
    setUnitBlock(u.block);
    setUnitOwner(u.owner);
    setUnitResident(u.resident);
    setUnitStatus(u.status);
    setShowAddUnitModal(true);
  };

  const handleDeleteUnit = (uId: string) => {
    const unitObj = units.find(u => u.id === uId);
    setDeleteConfirm({
      isOpen: true,
      title: 'Confirmar Exclusão de Unidade',
      message: `Deseja realmente remover a unidade "${unitObj?.number || 'unidade'}" do condomínio? Esta ação é irreversível.`,
      onConfirm: () => {
        const updated = units.filter(u => u.id !== uId);
        setUnits(updated);
        saveToStorage('units', updated);
        onShowNotification('Sucesso', 'Unidade excluída.');
        setDeleteConfirm(null);
      }
    });
  };

  // 3. Residents CRUD
  const handleAddResidentSubmit = async (e: any) => {
    e.preventDefault();
    if (!resName.trim() || !resUnit) return;
    
    const targetId = editingResident ? editingResident.id : `r-${Date.now()}`;
    let authUserGuid = targetId;

    // Optional Supabase Auth Account Creation for Morador
    if (resEnableAuth && resEmail && resEmail !== '---' && isSupabaseConfigured && supabase) {
      if (!editingResident && !resPassword.trim()) {
        onShowNotification('Atenção', 'Por favor, forneça uma senha de acesso para o login do morador.');
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

        // 1. Criar usuário no Supabase Auth
        const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
          email: resEmail.trim(),
          password: resPassword || '123456',
          options: {
            data: {
              full_name: resName.trim(),
              profile: 'Morador',
              unidade: resUnit
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData?.user) {
          authUserGuid = signUpData.user.id;

          // 2. Vincular usuário na única tabela 'perfil'
          await supabase.from('perfil').upsert({
            id: authUserGuid,
            nome: resName.trim(),
            email: resEmail.trim(),
            tipo: 'morador',
            unidade: resUnit,
            ativo: resStatus === 'Ativo',
            condominio_id: condo.id
          });

          console.log('[CondoDetailsView] Criado e vinculado morador no Supabase Auth:', authUserGuid);
        }
      } catch (authErr: any) {
        console.error('[CondoDetailsView] Erro ao criar login do morador:', authErr);
        onShowNotification('Erro', `Não foi possível criar as credenciais no Supabase Auth: ${authErr.message || authErr}`);
        return;
      }
    }

    // Capture simulated credentials offline
    if (resEnableAuth && resEmail && resEmail !== '---') {
      try {
        const savedUsers = localStorage.getItem('facilities_portal_users') || '[]';
        const users = JSON.parse(savedUsers);
        const userSimObj = {
          email: resEmail.trim(),
          pass: resPassword || '123456',
          name: resName.trim(),
          unit: resUnit,
          profile: 'Morador',
          tipo: 'morador',
          ativo: resStatus === 'Ativo',
          condominio_id: condo.id
        };
        const existingIdx = users.findIndex((u: any) => u.email.toLowerCase() === resEmail.trim().toLowerCase());
        if (existingIdx !== -1) {
          users[existingIdx] = { ...users[existingIdx], ...userSimObj };
        } else {
          users.push(userSimObj);
        }
        localStorage.setItem('facilities_portal_users', JSON.stringify(users));
      } catch (err) {
        console.warn('Erro ao salvar simulador offline de login do morador:', err);
      }
    }

    const newRes = {
      id: authUserGuid, // Reutiliza ID do Auth para integridade direta ou ID geral
      name: resName,
      unit: resUnit,
      phone: resPhone || '(13) ---',
      email: resEmail || '---',
      status: resStatus
    };

    let updated;
    if (editingResident) {
      updated = residents.map(r => r.id === editingResident.id ? newRes : r);
      onShowNotification('Sucesso', 'Ficha do morador atualizada e credenciais de acesso sincronizadas.');
    } else {
      updated = [newRes, ...residents];
      onShowNotification('Sucesso', 'Morador cadastrado com sucesso. Um convite por e-mail foi simulado para ativação imediata.');
    }

    // Save to backend database table 'moradores' if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('moradores').upsert({
          id: newRes.id,
          nome: newRes.name,
          unidade: newRes.unit,
          telefone: newRes.phone,
          email: newRes.email === '---' ? null : newRes.email,
          condominio_id: condo.id,
          proprietario: true
        });
      } catch (dbErr) {
        console.warn('Erro ao persistir no Supabase tabela moradores:', dbErr);
      }
    }

    setResidents(updated);
    saveToStorage('residents', updated);
    setResName('');
    setResUnit('');
    setResPhone('');
    setResEmail('');
    setResStatus('Ativo');
    setResPassword('');
    setResEnableAuth(false);
    setEditingResident(null);
    setShowAddResidentModal(false);
  };

  const handleEditResident = (r: any) => {
    setEditingResident(r);
    setResName(r.name);
    setResUnit(r.unit);
    setResPhone(r.phone);
    setResEmail(r.email);
    setResStatus(r.status);
    setResPassword('');
    setResEnableAuth(!!r.email && r.email !== '---');
    setShowAddResidentModal(true);
  };

  const handleDeleteResident = (rId: string) => {
    const residentObj = residents.find(r => r.id === rId);
    setDeleteConfirm({
      isOpen: true,
      title: 'Confirmar Exclusão de Morador',
      message: `Deletar cadastro do morador "${residentObj?.name || 'morador'}"? Esta ação não afetará financeiramente a unidade anterior.`,
      onConfirm: () => {
        const updated = residents.filter(r => r.id !== rId);
        setResidents(updated);
        saveToStorage('residents', updated);
        onShowNotification('Sucesso', 'Cadastro do morador removido.');
        setDeleteConfirm(null);
      }
    });
  };

  // 4. Financial Add transaction
  const handleAddTxSubmit = (e: any) => {
    e.preventDefault();
    if (!txDesc.trim() || !txVal) return;
    const newTx = {
      id: editingTx ? editingTx.id : `f-${Date.now()}`,
      description: txDesc,
      category: txCat,
      type: txType,
      value: Number(txVal),
      date: txDate || new Date().toISOString().split('T')[0],
      status: editingTx ? editingTx.status : 'Confirmado'
    };
    let updated;
    if (editingTx) {
      updated = financeLogs.map(f => f.id === editingTx.id ? newTx : f);
      onShowNotification('Sucesso', 'Lançamento financeiro atualizado.');
    } else {
      updated = [newTx, ...financeLogs];
      onShowNotification('Sucesso', 'Transação consolidada na prestação de contas.');
    }
    setFinanceLogs(updated);
    saveToStorage('fin', updated);
    setTxDesc('');
    setTxVal('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setEditingTx(null);
    setShowAddTxModal(false);
  };

  const handleEditTx = (tx: any) => {
    setEditingTx(tx);
    setTxDesc(tx.description);
    setTxVal(tx.value.toString());
    setTxCat(tx.category);
    setTxType(tx.type);
    setTxDate(tx.date);
    setShowAddTxModal(true);
  };

  const handleDeleteTx = (txId: string) => {
    const txObj = financeLogs.find(f => f.id === txId);
    setDeleteConfirm({
      isOpen: true,
      title: 'Confirmar Exclusão de Transação',
      message: `Deseja realmente excluir a transação "${txObj?.description || 'lançamento'}" do balanço financeiro?`,
      onConfirm: () => {
        const updated = financeLogs.filter(f => f.id !== txId);
        setFinanceLogs(updated);
        saveToStorage('fin', updated);
        onShowNotification('Sucesso', 'Lançamento estornado.');
        setDeleteConfirm(null);
      }
    });
  };

  // 5. Announcements CRUD
  const handleAddAnnSubmit = (e: any) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    const newAnn = {
      id: editingAnn ? editingAnn.id : `a-${Date.now()}`,
      title: annTitle,
      content: annContent,
      author: annAuthor,
      date: editingAnn ? editingAnn.date : new Date().toISOString().split('T')[0],
      status: annStatus
    };
    let updated;
    if (editingAnn) {
      updated = announcements.map(a => a.id === editingAnn.id ? newAnn : a);
      onShowNotification('Sucesso', 'Comunicado editado nos murais.');
    } else {
      updated = [newAnn, ...announcements];
      onShowNotification('Sucesso', 'Comunicado divulgado nos murais.');
    }
    setAnnouncements(updated);
    saveToStorage('announcements', updated);
    setAnnTitle('');
    setAnnContent('');
    setAnnAuthor('Síndico');
    setAnnStatus('Ativo');
    setEditingAnn(null);
    setShowAddAnnModal(false);
  };

  const handleEditAnn = (ann: any) => {
    setEditingAnn(ann);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnAuthor(ann.author);
    setAnnStatus(ann.status);
    setShowAddAnnModal(true);
  };

  const handleDeleteAnn = (aId: string) => {
    const annObj = announcements.find(a => a.id === aId);
    setDeleteConfirm({
      isOpen: true,
      title: 'Confirmar Remoção de Comunicado',
      message: `Deseja remover o comunicado "${annObj?.title || 'aviso'}" dos murais gerais?`,
      onConfirm: () => {
        const updated = announcements.filter(a => a.id !== aId);
        setAnnouncements(updated);
        saveToStorage('announcements', updated);
        onShowNotification('Sucesso', 'Comunicado removido.');
        setDeleteConfirm(null);
      }
    });
  };

  // 6. Tickets CRUD & Status Update
  const handleAddTicketSubmit = (e: any) => {
    e.preventDefault();
    if (!tktTitle.trim() || !tktDesc.trim()) return;
    const newTkt = {
      id: editingTicket ? editingTicket.id : `t-${Date.now()}`,
      title: tktTitle,
      category: tktCategory,
      description: tktDesc,
      date: editingTicket ? editingTicket.date : new Date().toISOString().split('T')[0],
      resident: tktResident || 'Portaria Principal',
      status: editingTicket ? editingTicket.status : 'Aberto',
      priority: tktPriority
    };
    let updated;
    if (editingTicket) {
      updated = tickets.map(t => t.id === editingTicket.id ? newTkt : t);
      onShowNotification('Sucesso', 'Ocorrência/Chamado atualizado com sucesso.');
    } else {
      updated = [newTkt, ...tickets];
      onShowNotification('Sucesso', 'Ocorrência registrada no livro negro do condomínio.');
    }
    setTickets(updated);
    saveToStorage('tickets', updated);
    setTktTitle('');
    setTktDesc('');
    setTktResident('');
    setTktPriority('Média');
    setEditingTicket(null);
    setShowAddTicketModal(false);
  };

  const handleEditTicket = (tkt: any) => {
    setEditingTicket(tkt);
    setTktTitle(tkt.title);
    setTktDesc(tkt.description);
    setTktCategory(tkt.category);
    setTktResident(tkt.resident);
    setTktPriority(tkt.priority);
    setShowAddTicketModal(true);
  };

  const handleUpdateTicketStatus = (tId: string, newStatus: string) => {
    const updated = tickets.map(t => t.id === tId ? { ...t, status: newStatus } : t);
    setTickets(updated);
    saveToStorage('tickets', updated);
    onShowNotification('Ocorrência Atualizada', `Status alterado para: ${newStatus}`);
  };

  const handleDeleteTicket = (tId: string) => {
    const tktObj = tickets.find(t => t.id === tId);
    setDeleteConfirm({
      isOpen: true,
      title: 'Confirmar Exclusão de Chamado/Ocorrência',
      message: `Excluir o chamado "${tktObj?.title || 'ocorrência'}" da base de dados histórica?`,
      onConfirm: () => {
        const updated = tickets.filter(t => t.id !== tId);
        setTickets(updated);
        saveToStorage('tickets', updated);
        onShowNotification('Sucesso', 'Registro de chamado apagado.');
        setDeleteConfirm(null);
      }
    });
  };

  // 7. Documents Upload & Download Simulate
  const handleDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      simulateFileUpload(files[0].name, files[0].size);
    }
  };

  const handleFileSelect = (e: any) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateFileUpload(files[0].name, files[0].size);
    }
  };

  const simulateFileUpload = (name: string, rawSize: number) => {
    const sizeKB = Math.round(rawSize / 1024);
    const formattedSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const cleanName = name.split('.')[0] || name;
            const ext = name.split('.').pop()?.toUpperCase() || 'PDF';
            const newDoc = {
              id: `d-${Date.now()}`,
              title: cleanName,
              category: 'Outros',
              size: formattedSize,
              date: new Date().toLocaleDateString('pt-BR'),
              extension: ext
            };
            const updated = [newDoc, ...documents];
            setDocuments(updated);
            saveToStorage('documents', updated);
            setUploadProgress(null);
            onShowNotification('Sucesso', `Documento "${cleanName}" carregado.`);
          }, 300);
          return 100;
        }
        return prev + 15;
      });
    }, 150);
  };

  const handleDownloadDoc = (doc: any) => {
    // Generate actual mock text file representing the metadata
    try {
      const fileContent = `FACILITIES PORTAL CONDOS DEPARTAMENTO JURĺDICO\n---------------------------------------------\nDOCUMENTO ORIGINAL DO CONDOMĺNIO: ${condo.nome.toUpperCase()}\nDATA DO CADASTRO: ${doc.date}\nCATEGORIA DE DOCUMENTO: ${doc.category}\nTĺTULO DO REGISTRO: ${doc.title}\nID IDENTIFICADOR: ${doc.id}\nTamanho do arquivo: ${doc.size}\n\nTermos e diretrizes gerais simulados para verificação técnica do portal.\nCopyright © Facilities Administradora de Condomínios LTDA 2026.`;
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.title.toLowerCase().replace(/\s+/g, '_')}_document.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowNotification('Download Iniciado', `Arquivo "${doc.title}" enviado para o navegador.`);
    } catch (e) {
      onShowNotification('Erro no download', 'Falha ao compactar arquivo simulado.');
    }
  };

  const handleDeleteDoc = (dId: string) => {
    const docObj = documents.find(d => d.id === dId);
    setDeleteConfirm({
      isOpen: true,
      title: 'Confirmar Exclusão de Documento',
      message: `Tem certeza que deseja excluir o documento "${docObj?.title || 'documento'}" permanentemente da nuvem corporativa?`,
      onConfirm: () => {
        const updated = documents.filter(d => d.id !== dId);
        setDocuments(updated);
        saveToStorage('documents', updated);
        onShowNotification('Sucesso', 'Documento removido.');
        setDeleteConfirm(null);
      }
    });
  };

  const handleAddDocSubmit = (e: any) => {
    e.preventDefault();
    if (!docTitleState.trim()) return;
    const newDoc = {
      id: editingDoc ? editingDoc.id : `d-${Date.now()}`,
      title: docTitleState,
      category: docCategoryState,
      size: editingDoc ? editingDoc.size : docSizeState,
      date: editingDoc ? editingDoc.date : new Date().toLocaleDateString('pt-BR'),
      extension: editingDoc ? editingDoc.extension : docExtensionState.toUpperCase()
    };
    let updated;
    if (editingDoc) {
      updated = documents.map(d => d.id === editingDoc.id ? newDoc : d);
      onShowNotification('Sucesso', 'Metadados do documento atualizados.');
    } else {
      updated = [newDoc, ...documents];
      onShowNotification('Sucesso', 'Documento cadastrado com sucesso.');
    }
    setDocuments(updated);
    saveToStorage('documents', updated);
    setDocTitleState('');
    setDocCategoryState('Outros');
    setDocExtensionState('PDF');
    setDocSizeState('120 KB');
    setEditingDoc(null);
    setShowAddDocModal(false);
  };

  const handleEditDoc = (doc: any) => {
    setEditingDoc(doc);
    setDocTitleState(doc.title);
    setDocCategoryState(doc.category);
    setDocExtensionState(doc.extension);
    setDocSizeState(doc.size);
    setShowAddDocModal(true);
  };

  // --- RECALCULATE DYNAMIC KPI SUMMARY METRICS ---
  const activeTicketsCount = tickets.filter(t => t.status !== 'Resolvido').length;
  const currentMonthBookings = 7; // Statistically consistent
  const activeAnnCount = announcements.filter(a => a.status === 'Ativo').length;

  const totalCalculatedRevenue = financeLogs.filter(f => f.type === 'Receita').reduce((sum, item) => sum + item.value, 0);
  const totalCalculatedExpense = financeLogs.filter(f => f.type === 'Despesa').reduce((sum, item) => sum + item.value, 0);
  const balanceValue = totalCalculatedRevenue - totalCalculatedExpense;

  // --- FILTER ARRAYS FOR RENDERING ---
  const filteredUnitsList = units.filter(u => {
    const q = unitSearch.toLowerCase().trim();
    return !q || 
      u.number.toLowerCase().includes(q) || 
      u.block.toLowerCase().includes(q) || 
      u.owner.toLowerCase().includes(q) || 
      u.resident.toLowerCase().includes(q);
  });

  const filteredResidentsList = residents.filter(r => {
    const q = residentSearch.toLowerCase().trim();
    const matchQ = !q || 
      r.name.toLowerCase().includes(q) || 
      r.unit.toLowerCase().includes(q) || 
      r.phone.includes(q) || 
      r.email.toLowerCase().includes(q);
    const matchStatus = residentFilter === 'Todos' || r.status === residentFilter;
    return matchQ && matchStatus;
  });

  const filteredTicketsList = tickets.filter(t => {
    const q = ticketSearch.toLowerCase().trim();
    const matchQ = !q || 
      t.title.toLowerCase().includes(q) || 
      t.resident.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q);
    const matchesStatus = ticketStatusFilter === 'Todos' || t.status === ticketStatusFilter;
    const matchesPriority = ticketPriorityFilter === 'Todos' || t.priority === ticketPriorityFilter;
    return matchQ && matchesStatus && matchesPriority;
  });

  // Render sub-tabs sidebar/bar styled after Monday & HubSpot
  const subTabs = [
    { id: 'geral', label: 'Informações Gerais', icon: <Info className="w-4 h-4" /> },
    { id: 'blocos', label: `Blocos (${blocks.length})`, icon: <Layers className="w-4 h-4" /> },
    { id: 'unidades', label: `Unidades (${units.length})`, icon: <Home className="w-4 h-4" /> },
    { id: 'moradores', label: `Moradores (${residents.length})`, icon: <Users className="w-4 h-4" /> },
    { id: 'financeiro', label: 'Balanço Financeiro', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'comunicados', label: `Mural Comunicados (${announcements.length})`, icon: <Bell className="w-4 h-4" /> },
    { id: 'ocorrencias', label: `Livro Ocorrências (${tickets.length})`, icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'documentos', label: `Gestão Documentos (${documents.length})`, icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* 1. CABEÇALHO INTEGRADO */}
      <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-2.5">
          {/* Back button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#101c29] text-xs font-bold hover:text-primary transition-all bg-transparent border-0 cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para a lista de condomínios
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-[#101c29] font-display tracking-tight leading-none">{condo.nome}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              condo.status === 'Crítico' ? 'bg-red-100 text-red-700' : condo.status === 'Alerta' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {condo.status === 'Normal' ? 'Ativo' : condo.status || 'Ativo'}
            </span>
          </div>
          <p className="text-stone-500 text-xs font-sans leading-relaxed max-w-2xl">
            📍 {condo.endereco}, {condo.bairro || 'Centro'} &bull; {condo.cidade} - {condo.estado} &bull; CEP: {condo.cep}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-secondary text-xs pt-1.5">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Cadastrado: 11/10/2024</span>
            <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-gray-400" /> Síndico: <strong className="text-stone-700">{condo.sindico}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 pt-2 xl:pt-0 self-stretch xl:self-auto justify-end">
          <button
            onClick={() => onEdit(condo)}
            className="px-4 py-2 bg-stone-50 border border-gray-200 hover:bg-stone-100 text-[#101c29] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Edit2 className="w-3.5 h-3.5 text-primary" /> Editar Informações Básicas
          </button>
          <button
            onClick={() => {
              setDeleteConfirm({
                isOpen: true,
                title: 'Desativar/Excluir Condomínio',
                message: `Deseja realmente remover o condomínio "${condo.nome}" do sistema corporativo? Todos os registros operacionais vinculados serão desativados.`,
                onConfirm: () => {
                  onDelete(condo);
                  setDeleteConfirm(null);
                }
              });
            }}
            className="px-4 py-2 bg-red-50 hover:bg-red-100/75 text-red-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Trash2 className="w-3.5 h-3.5" /> Excluir Condomínio
          </button>
        </div>
      </div>

      {/* 2. DASHBOARD RESUMIDO (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl text-left shadow-md hover:shadow-lg transition-all duration-200 space-y-1">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Estrutura Blocos</span>
          <p className="text-xl font-black text-[#101c29] font-display">{blocks.length}</p>
          <span className="text-[10px] text-gray-400 block truncate">Blocos de Prédios</span>
        </div>
        <div className="bg-white p-4 rounded-2xl text-left shadow-md hover:shadow-lg transition-all duration-200 space-y-1">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Total Unidades</span>
          <p className="text-xl font-black text-blue-700 font-display">{units.length}</p>
          <span className="text-[10px] text-stone-400 block truncate">{units.filter(u => u.status === 'Vago').length} aptos vagos</span>
        </div>
        <div className="bg-white p-4 rounded-2xl text-left shadow-md hover:shadow-lg transition-all duration-200 space-y-1">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Habitantes</span>
          <p className="text-xl font-black text-[#101c29] font-display">{residents.length}</p>
          <span className="text-[10px] text-gray-400 block truncate">Moradores ativos</span>
        </div>
        <div className="bg-white p-4 rounded-2xl text-left shadow-md hover:shadow-lg transition-all duration-200 space-y-1">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Ocorrências</span>
          <p className="text-xl font-black text-red-700 font-display">{activeTicketsCount}</p>
          <span className="text-[10px] text-red-650 block font-semibold truncate">&#x25cf; Em andamento</span>
        </div>
        <div className="bg-white p-4 rounded-2xl text-left shadow-md hover:shadow-lg transition-all duration-200 space-y-1">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Reservas / Mês</span>
          <p className="text-xl font-black text-emerald-800 font-display">{currentMonthBookings}</p>
          <span className="text-[10px] text-stone-400 block truncate">Lazer agendados</span>
        </div>
        <div className="bg-white p-4 rounded-2xl text-left shadow-md hover:shadow-lg transition-all duration-200 space-y-1">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Comunicados</span>
          <p className="text-xl font-black text-amber-700 font-display">{activeAnnCount}</p>
          <span className="text-[10px] text-amber-650 block font-semibold truncate">&#x25cf; Visíveis nos murais</span>
        </div>
      </div>

      {/* 3. LAYOUT MAIN TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Column */}
        <div className="lg:col-span-1 bg-white p-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 space-y-2">
          <p className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1 text-left">Navegar Módulos</p>
          <div className="flex flex-col gap-1">
            {subTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-stone-900 text-white shadow-xs' 
                    : 'text-[#5f5e5e] hover:bg-stone-50 hover:text-[#101c29]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Panel Column */}
        <div className="lg:col-span-3 min-h-[500px]">
          
          {/* TAB 1: INFORMAÇÕES GERAIS */}
          {activeTab === 'geral' && (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left">
              <div className="p-5 border-b border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-2">
                <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> Ficha Cadastral e Dados de Contato
                </h5>
                <button
                  onClick={() => onEdit(condo)}
                  className="bg-[#af101a] hover:bg-[#930010] active:scale-[0.98] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar Informações Básicas
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Nome Oficial do Condomínio</span>
                    <p className="text-sm font-bold text-[#101c29] mt-0.5">{condo.nome}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">CNPJ / Inscrição</span>
                    <p className="text-sm font-bold text-stone-700 font-mono mt-0.5">{condo.cnpj || 'Não informado / Isento'}</p>
                  </div>
                  <div className="md:col-span-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Endereço de Correspondência</span>
                    <p className="text-sm font-bold text-[#101c29] mt-0.5">
                      📍 {condo.endereco}, {condo.bairro || 'Centro'}. {condo.cidade} - {condo.estado}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">CEP Postal</span>
                    <p className="text-sm font-bold text-stone-700 font-mono mt-0.5">{condo.cep || '11060-001'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Síndico Responsável</span>
                    <p className="text-sm font-bold text-[#101c29] mt-0.5">{condo.sindico || 'Administradora Facilities'}</p>
                  </div>
                  <div className="md:col-span-2 pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">WhatsApp / Telefone de Contato</span>
                      <p className="text-sm font-bold text-stone-700 font-mono mt-0.5">(13) 3219-5800</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">E-mail Administrativo</span>
                      <p className="text-sm font-bold text-stone-700 font-mono mt-0.5">gestao.{condo.nome.toLowerCase().replace(/\s+/g, '')}@facilites.com</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Observações e Informações do Empreendimento</span>
                  <textarea
                    rows={4}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-gray-250 p-3 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-relaxed font-sans"
                    placeholder="Escreva notas, histórico de infiltrações, restrições e pendências específicas..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveObs}
                      className="px-4 py-2 bg-stone-900 text-white hover:bg-stone-850 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Salvar Observações
                    </button>
                  </div>
                </div>

                {/* SEÇÃO SÍNDICO DO CONDOMÍNIO (Requirement implementation) */}
                <div className="pt-6 border-t border-gray-150 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-stone-50/70 p-3.5 rounded-xl border border-gray-100 gap-3">
                    <div>
                      <h6 className="font-extrabold text-xs text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" /> Ficha de Identificação do Síndico
                      </h6>
                      <p className="text-[10px] text-gray-400 mt-0.5">Gestão cadastral do profissional responsável civil pelo condomínio.</p>
                    </div>
                     <div className="flex flex-wrap items-center gap-2">
                      {sindicoProfile && (
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: "Confirmar Exclusão de Síndico",
                              message: `Deseja realmente excluir o cadastro de síndico de "${sindicoProfile.nome} ${sindicoProfile.sobrenome || ''}" deste condomínio? Esta ação é irreversível.`,
                              onConfirm: async () => {
                                setDeleteConfirm(null);
                                await handleDeleteSyndic();
                              }
                            });
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Excluir cadastro do Síndico"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          Excluir Síndico
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (sindicoProfile) {
                            setSindicoToEdit({
                              id: sindicoProfile.id,
                              nome: sindicoProfile.nome,
                              sobrenome: sindicoProfile.sobrenome || '',
                              apelido: sindicoProfile.apelido || '',
                              cpf: sindicoProfile.cpf || '',
                              foto_url: sindicoProfile.foto_perfil || '',
                              telefone: sindicoProfile.telefone || '',
                              whatsapp: sindicoProfile.whatsapp || '',
                              email: sindicoProfile.email || '',
                              condominio_id: condo.id
                            });
                          } else {
                            setSindicoToEdit(null);
                          }
                          setShowAddSindicoModal(true);
                        }}
                        className="bg-primary hover:bg-[#af101a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        {sindicoProfile ? <Edit2 className="w-3 h-3 text-white" /> : <Plus className="w-3.5 h-3.5" />}
                        {sindicoProfile ? 'Alterar Síndico' : 'Definir/Adicionar Síndico'}
                      </button>
                    </div>
                  </div>

                  {sindicoProfile ? (
                    <div className="bg-stone-50/50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center md:items-start gap-4">
                      <img
                        src={sindicoProfile.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                        alt="Foto de Perfil"
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-xs"
                      />
                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <h6 className="text-[#101c29] font-sans font-extrabold text-sm flex items-center justify-center md:justify-start gap-2">
                              {sindicoProfile.nome} {sindicoProfile.sobrenome || ''}
                              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider select-none leading-none">Síndico Ativo</span>
                            </h6>
                            {sindicoProfile.apelido && (
                              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Nome Social / Apelido: <strong className="text-stone-700">{sindicoProfile.apelido}</strong></p>
                            )}
                          </div>
                          
                          {/* EDIT AND DELETE CARD ACCORDION BUTTONS */}
                          <div className="flex items-center justify-center sm:justify-end gap-1.5 pt-1 sm:pt-0">
                            <button
                              onClick={() => {
                                setSindicoToEdit({
                                  id: sindicoProfile.id,
                                  nome: sindicoProfile.nome,
                                  sobrenome: sindicoProfile.sobrenome || '',
                                  apelido: sindicoProfile.apelido || '',
                                  cpf: sindicoProfile.cpf || '',
                                  foto_url: sindicoProfile.foto_perfil || '',
                                  telefone: sindicoProfile.telefone || '',
                                  whatsapp: sindicoProfile.whatsapp || '',
                                  condominio_id: condo.id
                                });
                                setShowAddSindicoModal(true);
                              }}
                              className="bg-white hover:bg-stone-100 text-stone-700 border border-gray-250 hover:border-stone-400 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Editar dados cadastrais do Síndico"
                            >
                              <Edit2 className="w-3 h-3 text-[#101c29]" />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  isOpen: true,
                                  title: "Confirmar Exclusão de Síndico",
                                  message: `Deseja realmente excluir o cadastro de síndico de "${sindicoProfile.nome} ${sindicoProfile.sobrenome || ''}" deste condomínio? Esta ação é irreversível.`,
                                  onConfirm: async () => {
                                    setDeleteConfirm(null);
                                    await handleDeleteSyndic();
                                  }
                                });
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-750 border border-red-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Excluir cadastro do Síndico"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Excluir
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-left pt-1">
                          <div className="bg-white p-2 rounded border border-gray-150">
                            <span className="text-[9px] text-gray-400 font-bold uppercase block">CPF</span>
                            <span className="text-stone-700 text-xs font-mono font-bold leading-normal">{sindicoProfile.cpf || 'Não informado'}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-150">
                            <span className="text-[9px] text-gray-400 font-bold uppercase block">Telefone</span>
                            <span className="text-stone-700 text-xs font-mono font-bold leading-normal">{sindicoProfile.telefone || 'Não informado'}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-150">
                            <span className="text-[9px] text-gray-400 font-bold uppercase block">WhatsApp</span>
                            <span className="text-stone-700 text-xs font-mono font-bold leading-normal">{sindicoProfile.whatsapp || 'Não informado'}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-150">
                            <span className="text-[9px] text-gray-400 font-bold uppercase block">Email</span>
                            <span className="text-stone-700 text-xs font-mono font-bold truncate block" title={sindicoProfile.email}>{sindicoProfile.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-stone-50 border border-dashed border-gray-250 p-6 rounded-xl text-center space-y-1.5 select-none">
                      <Briefcase className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="text-xs font-bold text-stone-600">Nenhum síndico cadastrado diretamente na tabela sindico para este condomínio.</p>
                      <p className="text-[10px] text-gray-400">Ao definir o síndico, os dados serão lidos e gravados de forma resiliente usando o código identificador (ID) do condomínio de destino.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: BLOCOS */}
          {activeTab === 'blocos' && (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left">
              <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#af101a]" /> Estrutura de Blocos ({blocks.length})
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Gerencie os edifícios e blocos estruturais que compõem o condomínio.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingBlock(null);
                    setBlockName('');
                    setBlockUnitsCount(12);
                    setShowAddBlockModal(true);
                  }}
                  className="bg-primary hover:bg-[#af101a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Bloco
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {blocks.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 text-stone-400 text-xs">
                      Nenhum bloco cadastrado estruturalmente. Adicione um acima.
                    </div>
                  ) : (
                    blocks.map(b => (
                      <div key={b.id} className="p-4 rounded-xl flex justify-between items-center bg-white shadow-md hover:shadow-lg transition-all duration-200">
                        <div className="space-y-1 text-left">
                          <p className="font-black text-sm text-[#101c29]">{b.name}</p>
                          <p className="text-xs text-secondary font-sans font-medium">{b.unitsCount} unidades residenciais</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditBlock(b)}
                            className="p-1.5 hover:bg-white border hover:border-gray-200 rounded-lg text-blue-600 transition-colors cursor-pointer"
                            title="Editar bloco"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(b.id)}
                            className="p-1.5 hover:bg-white border hover:border-gray-200 rounded-lg text-red-600 transition-colors cursor-pointer"
                            title="Excluir Bloco"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UNIDADES */}
          {activeTab === 'unidades' && (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left">
              <div className="p-5 border-b border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50 gap-4">
                <div>
                  <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600" /> Unidades do Condomínio ({filteredUnitsList.length})
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Visualização e pesquisa de apartamentos, proprietários e moradores.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingUnit(null);
                    setUnitNumber('');
                    setUnitBlock(blocks[0]?.name || 'Bloco A');
                    setUnitOwner('');
                    setUnitResident('');
                    setUnitStatus('Ocupado');
                    setShowAddUnitModal(true);
                  }}
                  className="bg-primary hover:bg-[#af101a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer self-end md:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Unidade
                </button>
              </div>

              {/* Integrated Search row */}
              <div className="p-4 border-b border-gray-150 text-left">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Pesquisar por número, bloco, proprietário ou morador..."
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white text-[#101c29]"
                  />
                </div>
              </div>

              {/* Table rendering units */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-400 uppercase font-extrabold font-sans">
                      <th className="p-4">Apartamento</th>
                      <th className="p-4">Bloco</th>
                      <th className="p-4">Proprietário</th>
                      <th className="p-4">Morador Principal</th>
                      <th className="p-4">Ocupação</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredUnitsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-stone-400">
                          Nenhuma unidade correspondente encontrada na pesquisa.
                        </td>
                      </tr>
                    ) : (
                      filteredUnitsList.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-4 font-black text-[#101c29]">Apto {u.number}</td>
                          <td className="p-4 font-semibold text-stone-600">{u.block}</td>
                          <td className="p-4 font-medium text-stone-700">{u.owner}</td>
                          <td className="p-4 font-medium text-stone-700">{u.resident}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                              u.status === 'Ocupado' ? 'bg-green-50 text-green-700' : u.status === 'Reforma' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-650'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditUnit(u)}
                                className="p-1 hover:bg-white border rounded text-blue-600 cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUnit(u.id)}
                                className="p-1 hover:bg-white border rounded text-red-600 cursor-pointer"
                                title="Deletar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MORADORES */}
          {activeTab === 'moradores' && (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left">
              <div className="p-5 border-b border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50 gap-4">
                <div>
                  <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-650" /> Base Geral de Moradores ({filteredResidentsList.length})
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Histórico cadastral de contatos, e-mails e perfis dos moradores ativos.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingResident(null);
                    setResName('');
                    setResUnit('');
                    setResPhone('');
                    setResEmail('');
                    setResStatus('Ativo');
                    setShowAddResidentModal(true);
                  }}
                  className="bg-primary hover:bg-[#af101a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer self-end md:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Morador
                </button>
              </div>

              {/* Integrated Filters column */}
              <div className="p-4 border-b border-gray-150 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Pesquisar moradores por nome, unidade, telefone ou email..."
                    value={residentSearch}
                    onChange={(e) => setResidentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-gray-205 rounded-xl text-xs outline-none focus:bg-white text-[#101c29]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={residentFilter}
                    onChange={(e) => setResidentFilter(e.target.value)}
                    className="w-full bg-white border border-gray-205 p-2 rounded-xl text-xs outline-none text-[#101c29] cursor-pointer"
                  >
                    <option value="Todos">Todas as Situações</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Temporário font-sans">Temporário</option>
                  </select>
                </div>
              </div>

              {/* Table of residents */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-400 uppercase font-extrabold font-sans">
                      <th className="p-4">Morador Nome</th>
                      <th className="p-4">Unidade / Apto</th>
                      <th className="p-4">Telefone de Contato</th>
                      <th className="p-4">E-mail Cadastrado</th>
                      <th className="p-4">Perfil Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredResidentsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-stone-400">
                          Nenhum morador correspondente localizado nos arquivos.
                        </td>
                      </tr>
                    ) : (
                      filteredResidentsList.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-4 font-bold text-[#101c29]">{r.name}</td>
                          <td className="p-4 font-semibold text-stone-605">{r.unit}</td>
                          <td className="p-4 font-mono text-stone-600">{r.phone}</td>
                          <td className="p-4 font-serif text-stone-600">{r.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              r.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : r.status === 'Temporário' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-650'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditResident(r)}
                                className="p-1 hover:bg-white border rounded text-blue-600 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteResident(r.id)}
                                className="p-1 hover:bg-white border rounded text-red-605 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCEIRO */}
          {activeTab === 'financeiro' && (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left space-y-6 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
                <div>
                  <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-800" /> Prestação de Contas & Balanço Financeiro
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Resumo histórico, lançamentos consolidados de receitas contratuais e fluxos de caixa.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTx(null);
                    setTxDesc('');
                    setTxVal('');
                    setTxDate(new Date().toISOString().split('T')[0]);
                    setTxCat('Taxa Condominial');
                    setTxType('Receita');
                    setShowAddTxModal(true);
                  }}
                  className="bg-stone-900 hover:bg-stone-850 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Lançar Nova Transação
                </button>
              </div>

              {/* Balances widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-55/10 border border-emerald-100 p-4.5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider block">Receitas Acumuladas</span>
                    <p className="text-xl font-black text-emerald-800 font-display mt-0.5">R$ {totalCalculatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-800">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-red-54/5 border border-red-100 p-4.5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-red-600 font-extrabold uppercase tracking-wider block">Despesas Pagas</span>
                    <p className="text-xl font-black text-red-800 font-display mt-0.5">R$ {totalCalculatedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <span className="text-red-700 bg-red-100/40 px-2 py-0.5 rounded text-[10px] font-extrabold font-sans">74% previsto</span>
                </div>
                <div className={`${balanceValue >= 0 ? 'bg-blue-53/5 border-blue-100' : 'bg-red-54/5 border-red-100'} border p-4.5 rounded-2xl flex justify-between items-center`}>
                  <div>
                    <span className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider block">Saldo de Caixa Disponível</span>
                    <p className={`text-xl font-black font-display mt-0.5 ${balanceValue >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                      R$ {balanceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-sans ${balanceValue >= 0 ? 'bg-blue-100/50 text-blue-800' : 'bg-red-100/50 text-red-800'}`}>
                    {balanceValue >= 0 ? 'Superavitário' : 'Déficit'}
                  </span>
                </div>
              </div>

              {/* GORGEOUS HIGH-FIDELITY SVG CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-stone-50 p-5 rounded-2xl">
                {/* 1. Bar chart SVG - Receitas x Despesas */}
                <div className="bg-white p-4.5 rounded-xl shadow-md text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <h6 className="text-[11px] font-extrabold uppercase tracking-wider text-[#101c29]">Comparativo de Fluxos Mensais (Semestre)</h6>
                    <span className="text-[10px] font-bold text-emerald-800">R$ Arrecadados</span>
                  </div>
                  
                  {/* SVG Bar representation */}
                  <div className="h-52 w-full flex items-end justify-between font-mono text-[9px] text-stone-500 pt-3 relative">
                    <div className="absolute top-0 bottom-0 left-0 right-0 border-b border-gray-100 pointer-events-none flex flex-col justify-between">
                      <div className="w-full border-t border-dashed border-gray-150 h-0"></div>
                      <div className="w-full border-t border-dashed border-gray-150 h-0"></div>
                      <div className="w-full border-t border-dashed border-gray-155 h-0"></div>
                    </div>
                    {/* Jan */}
                    <div className="flex flex-col items-center gap-1.5 flex-1 group relative cursor-pointer">
                      <div className="h-28 w-4.5 bg-emerald-600 rounded-t-sm transition-all group-hover:bg-emerald-700"></div>
                      <div className="h-24 w-4.5 bg-red-650 rounded-t-sm transition-all group-hover:bg-red-700 -mt-24 z-10 opacity-80"></div>
                      <span className="font-sans font-semibold">Jan</span>
                    </div>
                    {/* Fev */}
                    <div className="flex flex-col items-center gap-1.5 flex-1 group cursor-pointer">
                      <div className="h-32 w-4.5 bg-emerald-600 rounded-t-sm"></div>
                      <div className="h-28 w-4.5 bg-red-650 rounded-t-sm -mt-28 opacity-80"></div>
                      <span className="font-sans font-semibold">Fev</span>
                    </div>
                    {/* Mar */}
                    <div className="flex flex-col items-center gap-1.5 flex-1 group cursor-pointer">
                      <div className="h-36 w-4.5 bg-emerald-600 rounded-t-sm"></div>
                      <div className="h-30 w-4.5 bg-red-650 rounded-t-sm -mt-30 opacity-80"></div>
                      <span className="font-sans font-semibold">Mar</span>
                    </div>
                    {/* Abr */}
                    <div className="flex flex-col items-center gap-1.5 flex-1 group cursor-pointer">
                      <div className="h-30 w-4.5 bg-emerald-600 rounded-t-sm"></div>
                      <div className="h-29 w-4.5 bg-red-650 rounded-t-sm -mt-29 opacity-80"></div>
                      <span className="font-sans font-semibold">Abr</span>
                    </div>
                    {/* Mai */}
                    <div className="flex flex-col items-center gap-1.5 flex-1 group cursor-pointer">
                      <div className="h-42 w-4.5 bg-emerald-600 rounded-t-sm animate-pulse-slow"></div>
                      <div className="h-32 w-4.5 bg-red-650 rounded-t-sm -mt-32 opacity-80"></div>
                      <span className="font-sans font-semibold">Mai</span>
                    </div>
                    {/* Jun (Current recalculated in real-time) */}
                    <div className="flex flex-col items-center gap-1.5 flex-1 group cursor-pointer">
                      <div className="bg-emerald-700 rounded-t-md transition-all w-5" style={{ height: `${Math.min(180, (totalCalculatedRevenue / (condo.receita || 1)) * 110)}px` }}></div>
                      <div className="bg-red-700 rounded-t-md transition-all w-5 -mt-[1px]" style={{ height: `${Math.min(180, (totalCalculatedExpense / (condo.despesa || 1)) * 102)}px`, transform: `translateY(-${Math.min(180, (totalCalculatedRevenue / (condo.receita || 1)) * 110)}px)` }}></div>
                      <span className="font-sans font-black text-rose-700">Jun</span>
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-6 text-[10px] text-stone-500 pt-2 font-semibold">
                    <span className="flex items-center gap-1.5"><strong className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></strong> Receitas Consolidadas</span>
                    <span className="flex items-center gap-1.5"><strong className="w-2.5 h-2.5 bg-red-650 rounded-full inline-block"></strong> Despesas Pagas</span>
                  </div>
                </div>

                {/* 2. Donut Pie Chart or Breakdown of Expense */}
                <div className="bg-white p-4.5 rounded-xl shadow-md text-left space-y-4 flex flex-col justify-between">
                  <h6 className="text-[11px] font-extrabold uppercase tracking-wider text-[#101c29]">Composição Proporcional de Custos Mensais</h6>
                  <div className="flex flex-row items-center gap-4 py-2">
                    {/* Pie Chart Representation using SVG */}
                    <div className="w-28 h-28 relative shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Circle segment 1: RH (45%) */}
                        <circle cx="56" cy="56" r="45" fill="transparent" stroke="#af101a" strokeWidth="16" strokeDasharray="282" strokeDashoffset="126" />
                        {/* Circle segment 2: Manutenção (25%) */}
                        <circle cx="56" cy="56" r="45" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="282" strokeDashoffset="197" style={{ transform: 'rotate(162deg)', transformOrigin: 'center' }} />
                        {/* Circle segment 3: Utilities (20%) */}
                        <circle cx="56" cy="56" r="45" fill="transparent" stroke="#3b82f6" strokeWidth="16" strokeDasharray="282" strokeDashoffset="225" style={{ transform: 'rotate(252deg)', transformOrigin: 'center' }} />
                        {/* Circle segment 4: Reservas (10%) */}
                        <circle cx="56" cy="56" r="45" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="282" strokeDashoffset="253" style={{ transform: 'rotate(324deg)', transformOrigin: 'center' }} />
                      </svg>
                      <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col justify-center items-center">
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase leading-none">Junho</span>
                        <span className="text-xs font-black text-stone-800 leading-none mt-0.5">100%</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center bg-stone-50 p-1.5 rounded border-l-2 border-red-700">
                        <span className="font-semibold text-stone-600">Recursos Humanos</span>
                        <span className="font-mono font-bold">45%</span>
                      </div>
                      <div className="flex justify-between items-center bg-stone-50 p-1.5 rounded border-l-2 border-amber-500">
                        <span className="font-semibold text-stone-600">Manutenção Geral</span>
                        <span className="font-mono font-bold">25%</span>
                      </div>
                      <div className="flex justify-between items-center bg-stone-50 p-1.5 rounded border-l-2 border-blue-500">
                        <span className="font-semibold text-stone-600">Utilities / Energia</span>
                        <span className="font-mono font-bold">20%</span>
                      </div>
                      <div className="flex justify-between items-center bg-stone-50 p-1.5 rounded border-l-2 border-emerald-500">
                        <span className="font-semibold text-stone-600">Aportes e Custos Extras</span>
                        <span className="font-mono font-bold">10%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 text-center leading-tight">Proporções dinâmicas calculadas na apuração contábil ordinária do condomínio.</p>
                </div>
              </div>

              {/* Lançamentos recents log */}
              <div className="space-y-3.5">
                <h6 className="text-[11px] font-extrabold uppercase tracking-wider text-[#101c29]">Últimos Lançamentos Financeiros Liquidados</h6>
                <div className="shadow-md rounded-xl overflow-hidden bg-white divide-y divide-gray-100">
                  {financeLogs.length === 0 ? (
                    <div className="text-center py-8 text-[#5f5e5e] text-xs">Nenhuma movimentação lançada este mês.</div>
                  ) : (
                    financeLogs.map(f => (
                      <div key={f.id} className="p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white hover:bg-gray-50/50">
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-[#101c29] leading-snug">{f.description}</p>
                          <div className="flex items-center gap-2.5 text-[10px] text-stone-450">
                            <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold font-sans">{f.category}</span>
                            <span>📅 Competência: {f.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <span className={`font-black text-xs font-mono py-1.5 px-3 rounded-lg ${
                            f.type === 'Receita' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50/70 text-red-800'
                          }`}>
                            {f.type === 'Receita' ? '+' : '-'} R$ {f.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => handleEditTx(f)}
                            className="text-stone-400 hover:text-blue-600 p-1 rounded hover:bg-gray-50 cursor-pointer"
                            title="Editar lançamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTx(f.id)}
                            className="text-stone-400 hover:text-red-700 p-1 rounded hover:bg-gray-50 cursor-pointer"
                            title="Estornar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COMUNICADOS */}
          {activeTab === 'comunicados' && (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left">
              <div className="p-5 border-b border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50 gap-4">
                <div>
                  <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500 animate-swing" /> Mural Digital de Comunicados ({announcements.length})
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Editais e comunicados enviados para o aplicativo dos moradores e murais físicos.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingAnn(null);
                    setAnnTitle('');
                    setAnnContent('');
                    setAnnAuthor('Síndico Responsável');
                    setAnnStatus('Ativo');
                    setShowAddAnnModal(true);
                  }}
                  className="bg-stone-900 hover:bg-[#af101a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer self-end md:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Comunicado
                </button>
              </div>

              {/* List announcements */}
              <div className="p-6 space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    Nenhum informativo divulgado para este residencial.
                  </div>
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} className="p-5 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 relative space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 text-left">
                        <div className="space-y-1">
                          <h6 className="font-extrabold text-sm text-[#101c29] leading-snug">{ann.title}</h6>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium font-sans">
                            <span>✍ Outorgante: <strong>{ann.author}</strong></span>
                            <span>&bull;</span>
                            <span>📅 Postado: {ann.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            ann.status === 'Ativo' ? 'bg-green-50 text-emerald-800' : 'bg-gray-100 text-stone-500'
                          }`}>
                            {ann.status}
                          </span>
                          <button
                            onClick={() => handleEditAnn(ann)}
                            className="p-1 hover:bg-stone-100/50 rounded hover:text-blue-600 text-stone-400 cursor-pointer"
                            title="Editar comunicado"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnn(ann.id)}
                            className="p-1 hover:bg-stone-100/50 rounded hover:text-red-700 text-stone-400 cursor-pointer"
                            title="Remover comunicado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-stone-650 text-xs font-sans leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: OCORRÊNCIAS */}
          {activeTab === 'ocorrencias' && (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left">
              <div className="p-5 border-b border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50 gap-4">
                <div>
                  <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 animate-pulse-slow" /> Chamados e Livre Ocorrências ({filteredTicketsList.length})
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Livro de chamados abertos por condôminos referente a ruídos, vazamentos e portarias.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTicket(null);
                    setTktTitle('');
                    setTktDesc('');
                    setTktResident('');
                    setTktCategory('Manutenção');
                    setTktPriority('Média');
                    setShowAddTicketModal(true);
                  }}
                  className="bg-primary hover:bg-[#af101a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer self-end md:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Registro
                </button>
              </div>

              {/* Filtration and filters list */}
              <div className="p-4 border-b border-gray-150 text-left space-y-3 bg-stone-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Filtrar chamados por assunto, descrição..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-205 rounded-xl text-xs outline-none text-[#101c29]"
                  />
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-medium items-center">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <span>Situação do Chamado:</span>
                    <select
                      value={ticketStatusFilter}
                      onChange={(e) => setTicketStatusFilter(e.target.value)}
                      className="bg-white border rounded p-1 text-[11px] font-semibold text-[#101c29] cursor-pointer"
                    >
                      <option value="Todos">Todos os Status</option>
                      <option value="Aberto">Aberto</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Resolvido">Resolvido</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>Gravidade / Prioridade:</span>
                    <select
                      value={ticketPriorityFilter}
                      onChange={(e) => setTicketPriorityFilter(e.target.value)}
                      className="bg-white border rounded p-1 text-[11px] font-semibold text-[#101c29] cursor-pointer"
                    >
                      <option value="Todos">Todas</option>
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Incidents Table list rendering */}
              <div className="divide-y divide-gray-150">
                {filteredTicketsList.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    Nenhum chamado de ocorrência cadastrado conforme filtros.
                  </div>
                ) : (
                  filteredTicketsList.map(t => (
                    <div key={t.id} className="p-5 hover:bg-stone-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 text-left flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-stone-400 font-extrabold">#{t.id.split('-').pop()?.slice(0, 5)}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            t.priority === 'Alta' ? 'bg-red-50 text-red-700' : t.priority === 'Média' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-stone-600'
                          }`}>
                            Precedência: {t.priority}
                          </span>
                          <span className="bg-stone-100 text-stone-500 text-[10px] px-1.5 rounded font-bold">{t.category}</span>
                        </div>
                        <h6 className="font-black text-sm text-[#101c29] leading-snug">{t.title}</h6>
                        <p className="text-stone-500 text-xs leading-relaxed max-w-3xl">{t.description}</p>
                        <div className="text-[10px] text-gray-400 font-medium font-sans flex items-center gap-2">
                          <span>Requerido por: <strong>{t.resident}</strong></span>
                          <span>&bull;</span>
                          <span>Reg. Histórico: {t.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0">
                        {/* Selector of status inline representation */}
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                          className={`p-1.5 border rounded text-xs font-bold ${
                            t.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-800' : t.status === 'Em Andamento font-sans' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-primary'
                          } cursor-pointer`}
                        >
                          <option value="Aberto">Aberto (Não iniciado)</option>
                          <option value="Em Andamento">Em Andamento</option>
                          <option value="Resolvido">Resolvido (Consolidado)</option>
                        </select>

                        <button
                          onClick={() => handleEditTicket(t)}
                          className="p-1.5 text-stone-450 hover:text-blue-600 rounded hover:bg-gray-50 cursor-pointer"
                          title="Editar incidente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(t.id)}
                          className="p-1.5 text-stone-450 hover:text-red-700 rounded hover:bg-gray-50 cursor-pointer"
                          title="Remover incidente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left space-y-6 p-6">
              <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h5 className="font-bold text-sm text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#af101a]" /> Repositório e Gestão Eletrônica de Documentos (GED)
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Atas, Convenções e Contratos vinculados à administração residencial.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingDoc(null);
                    setDocTitleState('');
                    setDocCategoryState('Outros');
                    setDocExtensionState('PDF');
                    setDocSizeState('120 KB');
                    setShowAddDocModal(true);
                  }}
                  className="bg-primary hover:bg-[#af101a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer self-end md:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Documento
                </button>
              </div>

              {/* Usability Pattern: Drag-and-Drop and Manual File Upload */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-primary bg-stone-50/50' : 'border-gray-200 hover:border-stone-400'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 border shadow-xs animate-bounce-slow">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#101c29]">Clique para selecionar ou arraste o arquivo até aqui</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Suporta PDF, DOCX, XLSX ou TXT (Simulação com criptografia de ponta a ponta)</p>
                  </div>
                </div>

                {uploadProgress !== null && (
                  <div className="mt-4 max-w-xs mx-auto space-y-1.5 animate-pulse">
                     <div className="flex justify-between items-center text-[10px] font-bold text-stone-600">
                       <span>Injetando arquivo no servidor...</span>
                       <span>{uploadProgress}%</span>
                     </div>
                     <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-primary h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                     </div>
                  </div>
                )}
              </div>

              {/* List of documents with mock downloads */}
              <div className="space-y-4">
                <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Documentos Corporativos ({documents.length})</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.length === 0 ? (
                    <div className="md:col-span-2 text-center py-6 text-stone-400 text-xs">
                      Nenhum documento anexado. Utilize o painel acima.
                    </div>
                  ) : (
                    documents.map(doc => (
                      <div key={doc.id} className="rounded-xl p-4 flex justify-between items-center bg-white shadow-md hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#af101a]/5 flex items-center justify-center font-mono font-black text-[10px] text-[#af101a] border border-[#af101a]/15 shrink-0">
                            {doc.extension}
                          </div>
                          <div className="text-left space-y-0.5 truncate max-w-[180px] sm:max-w-xs">
                            <p className="text-xs font-black text-[#101c29] truncate leading-tight" title={doc.title}>{doc.title}</p>
                            <p className="text-[10px] text-stone-450 font-sans font-medium flex items-center gap-1.5">
                              <span>{doc.size}</span>
                              <span>&bull;</span>
                              <span>{doc.category}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadDoc(doc); }}
                            className="p-2 hover:bg-stone-50 border border-transparent hover:border-gray-200 text-stone-600 rounded-lg transition-all cursor-pointer shadow-xs bg-white"
                            title="Baixar arquivo original"
                          >
                            <Download className="w-3.5 h-3.5 text-green-700" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditDoc(doc); }}
                            className="p-2 hover:bg-stone-50 border border-transparent hover:border-gray-200 text-blue-600 rounded-lg transition-all cursor-pointer shadow-xs bg-white"
                            title="Editar metadados"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                            className="p-2 hover:bg-stone-50 border border-transparent hover:border-gray-200 text-red-600 rounded-lg transition-all cursor-pointer shadow-xs bg-white"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div id="modal-confirmacao-details" className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-xs animate-fade-in p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.30)] border border-gray-150 space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
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

      {/* MORADOR ADD/EDIT MODAL overlay */}
      {showAddResidentModal && (
        <div id="modal-adicionar-morador" className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-xs animate-fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.30)] border border-gray-150 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 text-left">
              <h3 className="text-xs font-black text-[#0f1b29] uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> 
                {editingResident ? 'Editar Ficha do Morador' : 'Adicionar Novo Morador'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddResidentModal(false);
                  setEditingResident(null);
                }}
                className="text-gray-400 hover:text-gray-650 font-bold transition-colors cursor-pointer border-0 bg-transparent text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddResidentSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Nome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Unidade */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Unidade / Apto <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={resUnit}
                    onChange={(e) => setResUnit(e.target.value)}
                    placeholder="Ex: Apto 41-B"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Telefone</label>
                  <input
                    type="text"
                    value={resPhone}
                    onChange={(e) => setResPhone(e.target.value)}
                    placeholder="(13) 99123-4567"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Situação */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Situação</label>
                  <select
                    value={resStatus}
                    onChange={(e) => setResStatus(e.target.value)}
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal cursor-pointer"
                  >
                    <option value="Ativo">Ativo / Regular</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Temporário">Temporário</option>
                  </select>
                </div>
              </div>

              {/* AUTENTICAÇÃO SUPABASE AUTH PARA O MORADOR */}
              <div className="bg-[#F9FBFC] border border-[#e2e8f0] rounded-2xl p-4 space-y-3 mt-2 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-[#101c29] uppercase tracking-wider">Acesso e Credenciais do Morador</h4>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight">Gere credenciais para o morador acessar o portal e consultar finanças/reservas.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none font-sans">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={resEnableAuth}
                      onChange={(e) => setResEnableAuth(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {resEnableAuth && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f1f5f9] animate-fade-in font-sans">
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">E-mail de Login <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        required={resEnableAuth}
                        value={resEmail === '---' ? '' : resEmail}
                        onChange={(e) => setResEmail(e.target.value)}
                        placeholder="morador@email.com"
                        className="w-full bg-white border border-gray-250 p-2 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">{editingResident ? 'Nova Senha (Opcional)' : 'Senha de Acesso *'}</label>
                      <input
                        type="password"
                        required={resEnableAuth && !editingResident}
                        value={resPassword}
                        onChange={(e) => setResPassword(e.target.value)}
                        placeholder={editingResident ? 'Deixe em branco para manter' : 'Mín. 6 caracteres'}
                        className="w-full bg-white border border-gray-250 p-2 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddResidentModal(false);
                    setEditingResident(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#475569] text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-[#af101a] text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0 shadow-sm"
                >
                  {editingResident ? 'Salvar Alterações' : 'Cadastrar Morador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SÍNDICO ADD/EDIT MODAL overlay (Requirement implementation Code) */}
      {showSyndicModal && (
        <div id="modal-adicionar-sindico" className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-xs animate-fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.30)] border border-gray-150 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-xs font-black text-[#0f1b29] uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> 
                {sindicoProfile ? 'Alterar Ficha do Síndico' : 'Cadastrar Síndico do Condomínio'}
              </h3>
              <button 
                onClick={() => setShowSyndicModal(false)}
                className="text-gray-400 hover:text-gray-650 font-bold transition-colors cursor-pointer border-0 bg-transparent text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSyndic} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Nome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={syndicName}
                    onChange={(e) => setSyndicName(e.target.value)}
                    placeholder="Ex: João"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Sobrenome */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Sobrenome</label>
                  <input
                    type="text"
                    value={syndicLastName}
                    onChange={(e) => setSyndicLastName(e.target.value)}
                    placeholder="Ex: Silva"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Apelido */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Apelido (Nome Social)</label>
                  <input
                    type="text"
                    value={syndicNickname}
                    onChange={(e) => setSyndicNickname(e.target.value)}
                    placeholder="Ex: Neto"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* CPF */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">CPF</label>
                  <input
                    type="text"
                    value={syndicCpf}
                    onChange={(e) => setSyndicCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 font-mono leading-normal"
                  />
                </div>

                {/* E-mail (Required for database key integrity) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">E-mail de Contato <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={syndicEmail}
                    onChange={(e) => setSyndicEmail(e.target.value)}
                    placeholder="sindico@email.com"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Telefone</label>
                  <input
                    type="text"
                    value={syndicPhone}
                    onChange={(e) => setSyndicPhone(e.target.value)}
                    placeholder="(13) 99999-9999"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 font-mono leading-normal"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">WhatsApp</label>
                  <input
                    type="text"
                    value={syndicWhatsapp}
                    onChange={(e) => setSyndicWhatsapp(e.target.value)}
                    placeholder="(13) 99999-9999"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 font-mono leading-normal"
                  />
                </div>

                {/* Foto de Perfil */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">URL da Foto de Perfil</label>
                  <input
                    type="url"
                    value={syndicPhoto}
                    onChange={(e) => setSyndicPhoto(e.target.value)}
                    placeholder="https://images.unsplash.com/... ou imagem pública"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">Informe o endereço URL de uma imagem pública para usar como foto do síndico.</p>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSyndicModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#475569] text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0"
                  disabled={isSavingSyndic}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-[#af101a] text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0 shadow-sm flex items-center gap-1"
                  disabled={isSavingSyndic}
                >
                  {isSavingSyndic ? 'Gravando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOCO ADD/EDIT MODAL overlay */}
      {showAddBlockModal && (
        <div id="modal-adicionar-bloco" className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-xs animate-fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.30)] border border-gray-150 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 text-left">
              <h3 className="text-xs font-black text-[#0f1b29] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> 
                {editingBlock ? 'Editar Estrutura de Bloco' : 'Adicionar Novo Bloco / Edifício'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddBlockModal(false);
                  setEditingBlock(null);
                  setBlockName('');
                  setBlockUnitsCount(12);
                }}
                className="text-gray-400 hover:text-gray-650 font-bold transition-colors cursor-pointer border-0 bg-transparent text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddBlockSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 gap-4">
                {/* Nome do Bloco */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Nome do Bloco / Torre <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    placeholder="Ex: Bloco C, Torre 1, Edifício A"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Quantidade de Unidades */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Número de Unidades Estimadas</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={blockUnitsCount}
                    onChange={(e) => setBlockUnitsCount(Number(e.target.value))}
                    placeholder="Ex: 12"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">Define a contagem de unidades residenciais contidas neste bloco.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBlockModal(false);
                    setEditingBlock(null);
                    setBlockName('');
                    setBlockUnitsCount(12);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#475569] text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-[#af101a] text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0 shadow-sm"
                >
                  {editingBlock ? 'Salvar Alterações' : 'Cadastrar Bloco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIDADE ADD/EDIT MODAL overlay */}
      {showAddUnitModal && (
        <div id="modal-adicionar-unidade" className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-xs animate-fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.30)] border border-gray-150 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 text-left">
              <h3 className="text-xs font-black text-[#0f1b29] uppercase tracking-wider flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" /> 
                {editingUnit ? 'Editar Unidade' : 'Adicionar Nova Unidade / Apartamento'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddUnitModal(false);
                  setEditingUnit(null);
                  setUnitNumber('');
                  setUnitBlock('');
                  setUnitOwner('');
                  setUnitResident('');
                  setUnitStatus('Ocupado');
                }}
                className="text-gray-400 hover:text-gray-650 font-bold transition-colors cursor-pointer border-0 bg-transparent text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddUnitSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Número do Apartamento */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Número / Apt <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="Ex: 14, 102, C-4"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Bloco Vinculado */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Bloco / Torre <span className="text-red-500">*</span></label>
                  {blocks.length > 0 ? (
                    <select
                      required
                      value={unitBlock}
                      onChange={(e) => setUnitBlock(e.target.value)}
                      className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal cursor-pointer"
                    >
                      <option value="">Selecione o Bloco</option>
                      {blocks.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={unitBlock}
                      onChange={(e) => setUnitBlock(e.target.value)}
                      placeholder="Ex: Bloco A"
                      className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                    />
                  )}
                </div>

                {/* Proprietário */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Proprietário</label>
                  <input
                    type="text"
                    value={unitOwner}
                    onChange={(e) => setUnitOwner(e.target.value)}
                    placeholder="Ex: Antônio Carlos"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Morador Principal */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Morador Principal</label>
                  <input
                    type="text"
                    value={unitResident}
                    onChange={(e) => setUnitResident(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                  />
                </div>

                {/* Situação da Ocupação */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Situação da Unidade</label>
                  <select
                    value={unitStatus}
                    onChange={(e) => setUnitStatus(e.target.value)}
                    className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal cursor-pointer"
                  >
                    <option value="Ocupado">Ocupado</option>
                    <option value="Vago">Vago</option>
                    <option value="Reforma">Em Reforma</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUnitModal(false);
                    setEditingUnit(null);
                    setUnitNumber('');
                    setUnitBlock('');
                    setUnitOwner('');
                    setUnitResident('');
                    setUnitStatus('Ocupado');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#475569] text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-[#af101a] text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0 shadow-sm"
                >
                  {editingUnit ? 'Salvar Alterações' : 'Cadastrar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AddSindicoModal
        isOpen={showAddSindicoModal}
        onClose={() => {
          setShowAddSindicoModal(false);
          setSindicoToEdit(null);
        }}
        currentCondoId={condo.id}
        sindicoToEdit={sindicoToEdit}
        onSaveSuccess={(savedSindico) => {
          setSindicoProfile({
            id: savedSindico.id,
            nome: savedSindico.nome,
            sobrenome: savedSindico.sobrenome || '',
            apelido: savedSindico.apelido || '',
            cpf: savedSindico.cpf || '',
            foto_perfil: savedSindico.foto_url || '',
            telefone: savedSindico.telefone || '',
            whatsapp: savedSindico.whatsapp || '',
            email: savedSindico.email || `sindico.${condo.nome.toLowerCase().replace(/\s+/g, '')}@facilities.com`,
            tipo: 'sindico',
            perfil: 'Síndico',
            unidade: `Condomínio: ${condo.nome}`,
            condominio_id: condo.id
          });
          
          const fullNameCombined = `${savedSindico.nome} ${savedSindico.sobrenome || ''}`.trim();
          condo.sindico = fullNameCombined;

          const simCondos = localStorage.getItem('supabase_sim_condominios') || localStorage.getItem('facilities_portal_condos');
          if (simCondos) {
            try {
              const parsedCondos = JSON.parse(simCondos);
              const updated = parsedCondos.map((c: any) => {
                if (c.id === condo.id || c.nome === condo.nome) {
                  return { ...c, sindico: fullNameCombined };
                }
                return c;
              });
              localStorage.setItem('supabase_sim_condominios', JSON.stringify(updated));
              localStorage.setItem('facilities_portal_condos', JSON.stringify(updated));
            } catch (err) {
              console.error(err);
            }
          }

          onShowNotification("Sucesso", "Ficha do Síndico atualizada com sucesso.");
        }}
      />

    </div>
  );
}
