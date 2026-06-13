import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  FileText, 
  Image as ImageIcon, 
  Building2, 
  Briefcase, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Upload
} from 'lucide-react';
import { supabase, isSupabaseConfigured, getSimulatedData, supabaseUrl, supabaseAnonKey } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Sindico } from '../types';

interface AddSindicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (newSindico: Sindico) => void;
  currentCondoId?: string; // Optative default selected condo
  sindicoToEdit?: Sindico | null; // Optional syndic for editing mode
}

export default function AddSindicoModal({ isOpen, onClose, onSaveSuccess, currentCondoId, sindicoToEdit }: AddSindicoModalProps) {
  // Input states
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [apelido, setApelido] = useState('');
  const [cpf, setCpf] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [condominioId, setCondominioId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enableAuth, setEnableAuth] = useState(false);

  // Drag and drop / local upload states
  const [isDragging, setIsDragging] = useState(false);

  // Loaded condominios to feed the dropdown
  const [condominios, setCondominios] = useState<any[]>([]);
  const [isLoadingCondos, setIsLoadingCondos] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse file to Base64
  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, envie apenas arquivos de imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFotoUrl(e.target.result as string);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Falha ao processar arquivo de imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Initialize and load condominiums
  useEffect(() => {
    if (!isOpen) return;

    // Reset messages on open
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(false);

    if (sindicoToEdit) {
      setNome(sindicoToEdit.nome || '');
      setSobrenome(sindicoToEdit.sobrenome || '');
      setApelido(sindicoToEdit.apelido || '');
      setCpf(sindicoToEdit.cpf || '');
      setFotoUrl(sindicoToEdit.foto_url || '');
      setTelefone(sindicoToEdit.telefone || '');
      setWhatsapp(sindicoToEdit.whatsapp || '');
      setCondominioId(sindicoToEdit.condominio_id || '');
      setEmail(sindicoToEdit.email || '');
      setPassword('');
      setEnableAuth(!!sindicoToEdit.email);
    } else {
      setNome('');
      setSobrenome('');
      setApelido('');
      setCpf('');
      setFotoUrl('');
      setTelefone('');
      setWhatsapp('');
      setEmail('');
      setPassword('');
      setEnableAuth(false);
      // Default condo id assigned if provided
      if (currentCondoId) {
        setCondominioId(currentCondoId);
      } else {
        setCondominioId('');
      }
    }

    // Load available condominiums from either Supabase or Local Storage mock data
    const fetchCondos = async () => {
      setIsLoadingCondos(true);
      let loadedList: any[] = [];

      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('condominios')
            .select('id, nome, cidade')
            .order('nome', { ascending: true });
          
          if (!error && data) {
            loadedList = data;
          }
        }
      } catch (e) {
        console.warn('Could not fetch condominiums from database, trying local sources:', e);
      }

      // Merge local storage default or simulated condominios to be resilient
      if (loadedList.length === 0) {
        const localSimCondos = localStorage.getItem('supabase_sim_condominios');
        const localPortalCondos = localStorage.getItem('facilities_portal_condos');
        const sourceData = localSimCondos || localPortalCondos;
        if (sourceData) {
          try {
            loadedList = JSON.parse(sourceData);
          } catch (_) {
            loadedList = [];
          }
        }
      }

      setCondominios(loadedList);
      setIsLoadingCondos(false);
    };

    fetchCondos();
  }, [isOpen, currentCondoId]);

  if (!isOpen) return null;

  // Formatting CPF input reactively
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    let formatted = rawVal;
    if (rawVal.length > 3 && rawVal.length <= 6) {
      formatted = `${rawVal.slice(0, 3)}.${rawVal.slice(3)}`;
    } else if (rawVal.length > 6 && rawVal.length <= 9) {
      formatted = `${rawVal.slice(0, 3)}.${rawVal.slice(3, 6)}.${rawVal.slice(6)}`;
    } else if (rawVal.length > 9) {
      formatted = `${rawVal.slice(0, 3)}.${rawVal.slice(3, 6)}.${rawVal.slice(6, 9)}-${rawVal.slice(9, 11)}`;
    }
    setCpf(formatted);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMessage('O campo Nome é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetId = sindicoToEdit?.id || crypto.randomUUID();
    let authUserGuid = targetId;

    if (enableAuth && email.trim() && isSupabaseConfigured && supabase) {
      if (!sindicoToEdit && !password.trim()) {
        setErrorMessage('Por favor, informe a senha de acesso para o login do Síndico.');
        setIsSubmitting(false);
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
          email: email.trim(),
          password: password || '123456',
          options: {
            data: {
              full_name: `${nome.trim()} ${sobrenome.trim()}`.trim(),
              profile: 'Síndico',
              cpf: cpf.trim()
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData?.user) {
          authUserGuid = signUpData.user.id;
          
          // 2. Vincular usuário nas tabelas de perfis
          const profilePayload = {
            id: authUserGuid,
            auth_user_id: authUserGuid,
            nome: `${nome.trim()} ${sobrenome.trim()}`.trim(),
            email: email.trim(),
            cpf: cpf.trim(),
            unidade: `Condomínio: ${condominioId || 'Geral'}`,
            tipo: 'sindico',
            perfil: 'Síndico',
            ativo: true,
            condominio_id: condominioId || null
          };

          await supabase.from('perfis').upsert(profilePayload);
          await supabase.from('perfil').upsert({
            id: authUserGuid,
            nome: `${nome.trim()} ${sobrenome.trim()}`.trim(),
            email: email.trim(),
            cpf: cpf.trim(),
            tipo: 'sindico',
            unidade: `Condomínio: ${condominioId || 'Geral'}`,
            ativo: true,
            condominio_id: condominioId || null
          });

          console.log('[AddSindicoModal] Criado e vinculado usuário no Supabase Auth:', authUserGuid);
        }
      } catch (authErr: any) {
        console.error('[AddSindicoModal] Erro ao criar login de acesso do síndico:', authErr);
        setErrorMessage(`Não foi possível registrar o Síndico no Supabase Auth: ${authErr.message || authErr}`);
        setIsSubmitting(false);
        return;
      }
    }

    // Capture simulated credentials offline
    if (enableAuth && email.trim()) {
      try {
        const savedUsers = localStorage.getItem('facilities_portal_users') || '[]';
        const users = JSON.parse(savedUsers);
        const userSimObj = {
          cpf: cpf.trim(),
          email: email.trim(),
          pass: password || '123456',
          name: `${nome.trim()} ${sobrenome.trim()}`.trim(),
          unit: `Condomínio: ${condominioId || 'Geral'}`,
          profile: 'Síndico',
          tipo: 'sindico',
          ativo: true,
          condominio_id: condominioId
        };
        const existingIdx = users.findIndex((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (existingIdx !== -1) {
          users[existingIdx] = { ...users[existingIdx], ...userSimObj };
        } else {
          users.push(userSimObj);
        }
        localStorage.setItem('facilities_portal_users', JSON.stringify(users));
      } catch (err) {
        console.warn('Erro ao salvar simulador offline de login do Síndico:', err);
      }
    }

    const payload: Sindico = {
      id: authUserGuid, // Reutiliza o UUID do usuário criado para vinculação direta
      nome: nome.trim(),
      sobrenome: sobrenome.trim() || undefined,
      apelido: apelido.trim() || undefined,
      cpf: cpf.trim() || undefined,
      foto_url: fotoUrl.trim() || undefined,
      telefone: telefone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      condominio_id: condominioId || undefined,
      email: email.trim() || undefined
    };

    let isSuccess = false;

    // 1. SUPABASE CLIENT TRANSACTION
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('sindico')
          .upsert([
            {
              id: payload.id,
              nome: payload.nome,
              sobrenome: payload.sobrenome,
              apelido: payload.apelido,
              cpf: payload.cpf,
              foto_url: payload.foto_url,
              telefone: payload.telefone,
              whatsapp: payload.whatsapp,
              condominio_id: payload.condominio_id,
              email: payload.email,
              updated_at: new Date().toISOString()
            }
          ]);

        if (error) {
          console.warn('Failed to upsert directly into Supabase, saving locally:', error);
          saveLocalSimulatedSindico(payload);
          setSuccessMessage('Salvo localmente (erro ao gravar na tabela).');
          isSuccess = true;
        } else {
          setSuccessMessage(sindicoToEdit ? 'Dados do síndico atualizados!' : 'Síndico cadastrado e habilitado com sucesso!');
          isSuccess = true;
        }
      } catch (err: any) {
        console.error('Supabase exception occurred:', err);
        saveLocalSimulatedSindico(payload);
        setSuccessMessage('Salvo localmente (erro de conexão com banco de dados).');
        isSuccess = true;
      }
    } else {
      // 2. SIMULATION MODE FALLBACK
      saveLocalSimulatedSindico(payload);
      setSuccessMessage(sindicoToEdit ? 'Síndico atualizado com sucesso (Simulação)!' : 'Síndico cadastrado com sucesso (Simulação e Convite Enviado)!');
      isSuccess = true;
    }

    if (isSuccess && onSaveSuccess) {
      setTimeout(() => {
        onSaveSuccess(payload);
        // Reset and close
        setNome('');
        setSobrenome('');
        setApelido('');
        setCpf('');
        setFotoUrl('');
        setTelefone('');
        setWhatsapp('');
        setEmail('');
        setPassword('');
        setEnableAuth(false);
        onClose();
      }, 1500);
    } else if (isSuccess) {
      setIsSubmitting(false);
    }
  };

  // Safe local mock database persistence helper
  const saveLocalSimulatedSindico = (item: Sindico) => {
    try {
      const current = localStorage.getItem('supabase_sim_sindico') 
        ? JSON.parse(localStorage.getItem('supabase_sim_sindico')!) 
        : [];
      const filtered = current.filter((s: any) => s.id !== item.id);
      const updated = [item, ...filtered];
      localStorage.setItem('supabase_sim_sindico', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update local store for simulated syndics:', e);
    }
  };

  return (
    <div 
      id="add-sindico-modal-overlay" 
      className="fixed inset-0 z-[9999] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
    >
      <div 
        id="add-sindico-modal-card" 
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-gray-150 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.30)] flex flex-col md:flex-row gap-6 relative animate-scale-up"
      >
        {/* Close Button Header */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 p-1 rounded-full hover:bg-stone-50 transition-all border-0 bg-transparent cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* IMAGE PREVIEW AND HERO SIDEBAR PANEL */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-start text-center space-y-4 pt-4 md:border-r md:border-stone-100 md:pr-6 select-none">
          <div className="relative group">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                document.getElementById('sindico-photo-file-input')?.click();
              }}
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 ${isDragging ? 'border-primary animate-pulse' : 'border-primary/20'} shadow-inner flex items-center justify-center bg-stone-50 cursor-pointer transition-all`}
            >
              {fotoUrl ? (
                <img 
                  src={fotoUrl} 
                  alt="Prévia Foto de Perfil" 
                  onError={(e) => {
                    // fall back on error
                    (e.target as HTMLImageElement).src = ''; 
                  }}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : null}
              {!fotoUrl && (
                <div className="text-gray-400 flex flex-col items-center justify-center gap-1">
                  <ImageIcon className="w-8 h-8 text-stone-300" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Sem Foto</span>
                </div>
              )}
            </div>
            
            {fotoUrl && (
              <span className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full text-[10px] shadow-xs" title="Prévia carregada">
                <CheckCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-sans font-extrabold text-[#101c29]">Foto do Síndico</h4>
            <p className="text-[11px] text-gray-505 leading-normal font-sans">
              Assegure o reconhecimento visual do profissional ativo.
            </p>
          </div>

          {/* DUAL MANUAL & DRAG FILE UPLOAD CONTROL */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              document.getElementById('sindico-photo-file-input')?.click();
            }}
            className={`w-full p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-gray-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 text-gray-400'
            }`}
          >
            <Upload className="w-5 h-5 text-gray-400 animate-bounce" />
            <p className="text-[10px] font-bold text-stone-700">Foto de perfil</p>
            <p className="text-[9px] text-gray-405 leading-tight">Escolha um arquivo <strong className="text-primary hover:underline">ou arraste aqui</strong></p>
            <input 
              type="file" 
              id="sindico-photo-file-input" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>

          {/* Integration Status Check */}
          <div className="w-full bg-[#FAFAFA] border border-gray-150 rounded-xl p-3 text-left space-y-1 mt-auto">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block font-mono">BARRIL DE INFRAESTRUTURA</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[10px] text-stone-600 font-bold font-mono">
                {isSupabaseConfigured ? 'CONNECTED SUPABASE' : 'TESTES EM MODO SIMULADO'}
              </span>
            </div>
          </div>
        </div>

        {/* INPUT FORM PANEL */}
        <div className="flex-1 space-y-4">
          <div className="pb-2 border-b border-gray-100 pr-8">
            <h3 className="text-lg font-sans font-black text-[#101c29] tracking-tight uppercase flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> {sindicoToEdit ? 'Editar Síndico' : 'Novo Síndico'}
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              {sindicoToEdit ? 'Atualize as credenciais e qualificações do síndico ativo.' : 'Informe a qualificação legal do profissional responsável civil pelo condomínio.'}
            </p>
          </div>

          {/* Errors and Success Alerts */}
          {errorMessage && (
            <div className="bg-red-50 text-red-700 border border-red-200 text-xs px-3 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in font-sans">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in font-sans">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <User className="w-3 h-3 text-stone-400" /> Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="EX: João"
                  className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                />
              </div>

              {/* Sobrenome */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide">
                  Sobrenome
                </label>
                <input
                  type="text"
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  placeholder="EX: Silva Santos"
                  className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                />
              </div>

              {/* Apelido */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide">
                  Apelido / Nome Social
                </label>
                <input
                  type="text"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="EX: Netinho"
                  className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                />
              </div>

              {/* CPF */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <FileText className="w-3 h-3 text-stone-400" /> CPF
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 font-mono leading-normal"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-400" /> Celular / Telefone
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(13) 99123-4567"
                  className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 font-mono leading-normal"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide">
                  WhatsApp Direct
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(13) 99123-4567"
                  className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 font-mono leading-normal"
                />
              </div>

              {/* Foto URL URL input */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-stone-400" /> Endereço URL da Foto (Visualização em Tempo Real)
                </label>
                <input
                  type="url"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
                  className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 block leading-normal"
                />
              </div>

              {/* Condominio_id optional linkage relation */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-stone-400" /> Condomínio Vinculado (Opcional)
                </label>
                <select
                  value={condominioId}
                  onChange={(e) => setCondominioId(e.target.value)}
                  disabled={isLoadingCondos}
                  className="w-full bg-stone-50 border border-gray-250 p-2.5 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                >
                  <option value="">-- Sem vínculo / Geral --</option>
                  {condominios.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} {item.cidade ? `(${item.cidade})` : ''}
                    </option>
                  ))}
                </select>
                {isLoadingCondos && (
                  <p className="text-[9px] text-gray-400 animate-pulse font-medium mt-1">Buscando lista de condomínios...</p>
                )}
              </div>

              {/* AUTENTICAÇÃO E CREDENCIAIS SUPABASE AUTH */}
              <div className="sm:col-span-2 bg-[#F9FBFC] border border-[#e2e8f0] rounded-2xl p-4 space-y-3 mt-2 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-[#101c29] uppercase tracking-wider">Acesso e Credenciais de Login</h4>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight">Habilite o login e senha no portal e aplicativo mobile para este síndico.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={enableAuth}
                      onChange={(e) => setEnableAuth(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {enableAuth && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f1f5f9] animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">E-mail de Login <span className="text-[#af101a]">*</span></label>
                      <input
                        type="email"
                        required={enableAuth}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sindico@email.com"
                        className="w-full bg-white border border-gray-250 p-2 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">{sindicoToEdit ? 'Nova Senha (Opcional)' : 'Senha de Acesso *'}</label>
                      <input
                        type="password"
                        required={enableAuth && !sindicoToEdit}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={sindicoToEdit ? 'Deixe vazio para manter' : 'Min. 6 caracteres'}
                        className="w-full bg-white border border-gray-250 p-2 rounded-lg text-xs outline-none focus:border-stone-500 text-stone-700 leading-normal"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 select-none">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#475569] text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary hover:bg-[#af101a] text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-0 shadow-md shadow-primary/10 flex items-center gap-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Gravando Registro...' : (sindicoToEdit ? 'Salvar Alterações' : 'Cadastrar Síndico')}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
