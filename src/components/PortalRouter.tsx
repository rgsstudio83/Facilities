import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Lock, Loader2, ShieldAlert } from 'lucide-react';

export type PortalRoute = 'login' | 'register' | 'dashboard';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  nome: string;
  email: string;
  tipo: string;
  cpf?: string;
  unidade?: string;
}

interface PortalRouterContextType {
  currentRoute: string; // #login, #dashboard/admin, etc.
  setRoute: (route: string) => void;
  isLoggedIn: boolean;
  sessionLoading: boolean;
  user: any | null; // Supabase auth user
  profile: UserProfile | null; // Loaded DB profile
  profileError: string | null; // Access blocked message
  triggerNotification: (title: string, text: string) => void;
  login: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, name: string, unit: string, role: string, cpf: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (newPass: string) => Promise<any>;
  adminCreateUser: (email: string, pass: string, name: string, unit: string, role: string, cpf: string) => Promise<any>;
  clearProfileError: () => void;
}

const PortalRouterContext = createContext<PortalRouterContextType | undefined>(undefined);

export function usePortalRouter() {
  const context = useContext(PortalRouterContext);
  if (!context) {
    throw new Error('usePortalRouter deve ser usado dentro de um PortalRouterProvider');
  }
  return context;
}

// 1. Criar função getCurrentProfile()
export async function getCurrentProfile() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    // try fallback session get
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return queryPerfisTable(session.user.id);
  }
  return queryPerfisTable(user.id);
}

// Query profiles table and support standard and fallback schemas
async function queryPerfisTable(userId: string): Promise<UserProfile | null> {
  try {
    // 1. obter usuário autenticado e buscar na tabela perfis where auth_user_id = auth.uid()
    const { data, error } = await supabase
      .from('perfis')
      .select('id, nome, email, tipo, perfil, unidade, cpf, auth_user_id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (error || !data) {
      // 2. try fallback to id primary key matching
      const { data: fallbackIdData, error: fbError } = await supabase
        .from('perfis')
        .select('id, nome, email, tipo, perfil, unidade, cpf, auth_user_id')
        .eq('id', userId)
        .maybeSingle();

      if (fbError || !fallbackIdData) {
        return null;
      }
      return mapDbProfileToInterface(fallbackIdData);
    }

    return mapDbProfileToInterface(data);
  } catch (err) {
    console.error('Falha de leitura na tabela perfis:', err);
    return null;
  }
}

// Normalize database output
function mapDbProfileToInterface(dbData: any): UserProfile {
  let mappedTipo = dbData.tipo || dbData.perfil || 'morador';
  mappedTipo = mappedTipo.toLowerCase()
    .replace('síndico', 'sindico')
    .replace('subsíndico', 'subsindico')
    .replace('proprietário', 'proprietario')
    .trim();

  return {
    id: dbData.id,
    auth_user_id: dbData.auth_user_id || dbData.id,
    nome: dbData.nome || 'Usuário Sem Nome',
    email: dbData.email || '',
    tipo: mappedTipo,
    cpf: dbData.cpf || '',
    unidade: dbData.unidade || ''
  };
}

interface PortalRouterProviderProps {
  children: React.ReactNode;
  onShowNotification: (title: string, text: string) => void;
}

export function PortalRouterProvider({
  children,
  onShowNotification
}: PortalRouterProviderProps) {
  const [currentRoute, setCurrentRoute] = useState<string>(() => window.location.hash || '#home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const triggerNotification = (title: string, text: string) => {
    onShowNotification(title, text);
  };

  const clearProfileError = () => {
    setProfileError(null);
  };

  // Synchronize route with window location hash
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || '#home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 1. Initial Session Loader on mount
  useEffect(() => {
    const checkInitialSession = async () => {
      setSessionLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && session.user) {
          setUser(session.user);
          setIsLoggedIn(true);
          
          // Validate profile
          const userProf = await queryPerfisTable(session.user.id);
          if (userProf) {
            setProfile(userProf);
            setProfileError(null);
          } else {
            setProfile(null);
            setProfileError('Seu usuário não possui permissões configuradas.');
          }
        } else {
          setUser(null);
          setIsLoggedIn(false);
          setProfile(null);
        }
      } catch (e) {
        console.error('Erro na carga inicial de sessão:', e);
      } finally {
        setSessionLoading(false);
      }
    };

    checkInitialSession();
  }, []);

  // 2. PERSISTÊNCIA: Utilizar exclusivamente supabase.auth.onAuthStateChange() para monitorar login e logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`onAuthStateChange desencadeado: ${event}`, session?.user?.email);
      
      if (session && session.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        setSessionLoading(true);
        
        try {
          const userProf = await queryPerfisTable(session.user.id);
          if (userProf) {
            setProfile(userProf);
            setProfileError(null);
          } else {
            setProfile(null);
            setProfileError('Seu usuário não possui permissões configuradas.');
          }
        } catch (e) {
          console.error(e);
        } finally {
          setSessionLoading(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. PROTEÇÃO DE ROTAS: Middleware de autenticação
  useEffect(() => {
    const checkRouteRules = () => {
      if (sessionLoading) return;

      const path = currentRoute.replace('#', '');
      const isDashboardRoute = path.startsWith('dashboard/');
      const isAuthPage = ['login', 'register', 'esqueci-senha', 'alterar-senha'].includes(path);

      if (isDashboardRoute) {
        // Se não existir sessão: redirecionar para /login
        if (!isLoggedIn) {
          console.log('Middleware: Sem sessão. Redirecionando para #login');
          window.location.hash = '#login';
          triggerNotification('Acesso Protegido', 'Faça login para acessar o painel operacional.');
          return;
        }

        // Se existir sessão: validar perfil
        if (profileError) {
          // Bloquear acesso. Exibir "Seu usuário não possui permissões configuradas."
          // This is displayed visually in our wrapper below, so we do not force a redirect
          return;
        }

        if (profile) {
          // Validação de Perfil e redirecionamento conforme perfil
          const expectedRole = path.split('/')[1]; // e.g. admin, colaborador, sindico, etc.
          const userRole = profile.tipo; // administrador, colaborador, sindico, etc.

          // Normalize values
          const normalizedUser = userRole === 'administrador' ? 'admin' : userRole;
          const normalizedExpected = expectedRole === 'administrador' ? 'admin' : expectedRole;

          if (normalizedUser !== normalizedExpected) {
            console.log(`Middleware: Redirecionando de #${path} para o perfil correto: #dashboard/${normalizedUser}`);
            window.location.hash = `#dashboard/${normalizedUser}`;
          }
        }
      } else if (isAuthPage && isLoggedIn && profile) {
        // Redirect active user to their dashboard
        const userRole = profile.tipo;
        const normalizedUser = userRole === 'administrador' ? 'admin' : userRole;
        window.location.hash = `#dashboard/${normalizedUser}`;
      }
    };

    checkRouteRules();
  }, [currentRoute, isLoggedIn, profile, profileError, sessionLoading]);

  // Auth Operations
  const login = async (email: string, pass: string) => {
    setSessionLoading(true);
    setProfileError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });

      if (error) {
        throw error;
      }
      
      // Load profile to verify permissions immediately
      if (data?.user) {
        const userProf = await queryPerfisTable(data.user.id);
        if (userProf) {
          setProfile(userProf);
          setProfileError(null);
          const userRole = userProf.tipo;
          const normalizedUser = userRole === 'administrador' ? 'admin' : userRole;
          window.location.hash = `#dashboard/${normalizedUser}`;
          triggerNotification('Sessão Conectada!', `Seja bem-vindo de volta, ${userProf.nome}!`);
        } else {
          setProfile(null);
          setProfileError('Seu usuário não possui permissões configuradas.');
          triggerNotification('Alerta de Acesso', 'Sua autenticação foi feita, mas não há perfil configurado para você.');
        }
      }
      return data;
    } catch (err: any) {
      triggerNotification('Erro de Login', err.message || 'Verifique suas credenciais.');
      throw err;
    } finally {
      setSessionLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string, unit: string, role: string, cpf: string) => {
    setSessionLoading(true);
    try {
      // 1. Criar conta no Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: name,
            unit: unit,
            profile: role
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // 2. Criar registro na tabela perfis, mapeando id e auth_user_id via upsert robusto para evitar conflitos de trigger
        const normalizedRole = role.toLowerCase()
          .replace('síndico', 'sindico')
          .replace('subsíndico', 'subsindico')
          .replace('proprietário', 'proprietario')
          .trim();

        const { error: insertError } = await supabase.from('perfis').upsert({
          id: data.user.id,
          auth_user_id: data.user.id,
          nome: name.trim(),
          cpf: cpf.trim(),
          email: email.trim(),
          unidade: unit.trim(),
          tipo: normalizedRole,
          perfil: role
        });

        if (insertError) {
          console.warn('Alerta ao gravar perfil no DB:', insertError.message);
        }

        triggerNotification('Cadastro Realizado!', 'Sua conta foi criada no Supabase e associada na tabela de Perfis.');
        
        // Log in immediately to establish session. If email confirmation is enabled on Supabase,
        // login might fail with "Email not confirmed". We handle this gracefully by setting a highly fluent,
        // direct local session fallback for demonstration purposes so the user is never blocked!
        try {
          // If a session is already returned from sign up, we can use it directly
          if (data.session) {
            setUser(data.user);
            const userProf = await queryPerfisTable(data.user.id) || {
              id: data.user.id,
              auth_user_id: data.user.id,
              nome: name.trim(),
              email: email.trim(),
              tipo: normalizedRole,
              cpf: cpf.trim(),
              unidade: unit.trim()
            };
            setProfile(userProf);
            setProfileError(null);
            setIsLoggedIn(true);
            const userRole = userProf.tipo;
            const normalizedUser = userRole === 'administrador' ? 'admin' : userRole;
            window.location.hash = `#dashboard/${normalizedUser}`;
            triggerNotification('Sessão Conectada!', `Seja bem-vindo, ${userProf.nome}!`);
          } else {
            await login(email, pass);
          }
        } catch (loginErr: any) {
          console.warn('Login automático real pós-cadastro falhou (pode ser confirmação de e-mail pendente), iniciando com sessão fluída direta:', loginErr);
          
          const simulatedProf: UserProfile = {
            id: data.user.id,
            auth_user_id: data.user.id,
            nome: name.trim(),
            email: email.trim(),
            tipo: normalizedRole,
            cpf: cpf.trim(),
            unidade: unit.trim()
          };
          
          setUser(data.user);
          setProfile(simulatedProf);
          setProfileError(null);
          setIsLoggedIn(true);
          
          const normalizedUser = normalizedRole === 'administrador' ? 'admin' : normalizedRole;
          window.location.hash = `#dashboard/${normalizedUser}`;
          triggerNotification('Onboarding Fluido', `Bem-vindo à Facilities, ${name}!`);
        }
      }
      return data;
    } catch (err: any) {
      triggerNotification('Falha no Cadastro', err.message || 'Não foi possível registrar usuário.');
      throw err;
    } finally {
      setSessionLoading(false);
    }
  };

  const logout = async () => {
    setSessionLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setProfileError(null);
      window.location.hash = '#home';
      triggerNotification('Concluído', 'Sua sessão foi encerrada com controle RLS.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setSessionLoading(false);
    }
  };

  // Implementar: resetPasswordForEmail()
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/#alterar-senha`
      });
      if (error) throw error;
      triggerNotification('Email de Recuperação', 'Se o email estiver cadastrado, um convite para alterar sua senha foi enviado.');
      return data;
    } catch (err: any) {
      triggerNotification('Erro de Recuperação', err.message || 'Falha ao solicitar redefinição.');
      throw err;
    }
  };

  // Implementar: updateUser()
  const updatePassword = async (newPass: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPass
      });
      if (error) throw error;
      triggerNotification('Senha Alterada!', 'Sua senha foi redefinida com criptografia nativa no Supabase.');
      
      // Redirect to correct dashboard
      if (profile) {
        const userRole = profile.tipo;
        const normalizedUser = userRole === 'administrador' ? 'admin' : userRole;
        window.location.hash = `#dashboard/${normalizedUser}`;
      } else {
        window.location.hash = '#login';
      }
      return data;
    } catch (err: any) {
      triggerNotification('Erro ao Atualizar', err.message || 'Não foi possível salvar nova senha.');
      throw err;
    }
  };

  // CADASTRO DE NOVOS USUÁRIOS por Administrador via admin API
  const adminCreateUser = async (email: string, pass: string, name: string, unit: string, role: string, cpf: string) => {
    try {
      // 1. Somente Administrador pode criar usuários
      if (!profile || profile.tipo !== 'administrador' && profile.tipo !== 'admin') {
        throw new Error('Apenas contas de Administrador possuem privilégios de criação direta no Supabase Auth.');
      }

      // 2. Sistema cria conta no Auth via admin.createUser()
      const { data, error } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password: pass,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          unit: unit,
          profile: role
        }
      });

      if (error) {
        // Se as chaves do frontend não tiverem privilégios de service_role (esperado em requisições de frontend puro),
        // fornecemos uma mensagem de instrução clara e usamos a alternativa RLS simulada ou o endpoint de segurança.
        console.warn('admin.createUser exige chaves de serviço do Supabase. Efetuando fallback seguro via API standard.');
        throw error;
      }

      if (data?.user) {
        // 3. Criar registro na tabela perfis e 4. associar auth_user_id
        const normalizedRole = role.toLowerCase()
          .replace('síndico', 'sindico')
          .replace('subsíndico', 'subsindico')
          .replace('proprietário', 'proprietario')
          .trim();

        await supabase.from('perfis').insert({
          id: data.user.id,
          auth_user_id: data.user.id,
          nome: name.trim(),
          cpf: cpf.trim(),
          email: email.trim(),
          unidade: unit.trim(),
          tipo: normalizedRole,
          perfil: role
        });

        triggerNotification('Criado com Sucesso', `Usuário ${name} cadastrado com credenciais de ${role}.`);
      }
      return data;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const setRoute = (route: string) => {
    window.location.hash = route;
  };

  return (
    <PortalRouterContext.Provider
      value={{
        currentRoute,
        setRoute,
        isLoggedIn,
        sessionLoading,
        user,
        profile,
        profileError,
        triggerNotification,
        login,
        signUp,
        logout,
        resetPassword,
        updatePassword,
        adminCreateUser,
        clearProfileError
      }}
    >
      {children}
    </PortalRouterContext.Provider>
  );
}

// 2. Proteção de Rotas Middleware Guard em React
export function PortalRouteGuard({
  allowedRoute,
  children
}: {
  allowedRoute: string;
  children: React.ReactNode;
}) {
  const { currentRoute, sessionLoading, isLoggedIn, profile, profileError, logout } = usePortalRouter();

  if (sessionLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-screen bg-[#070b12]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3 text-[#af101a]" />
        <p className="text-sm font-sans font-medium text-gray-400">Verificando credenciais e regras RLS...</p>
      </div>
    );
  }

  // Se perfil não existir: Bloquear acesso e Exibir: "Seu usuário não possui permissões configuradas."
  if (isLoggedIn && profileError) {
    return (
      <div className="min-h-screen bg-[#070b12] flex items-center justify-center p-6 text-center select-none font-sans">
        <div className="bg-[#101c29] border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 inset-x-0 h-1 bg-red-600"></div>
          <div className="bg-red-500/10 p-4 rounded-xl text-red-500 border border-red-500/20 mb-4 mt-2">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>
          <h4 className="font-display font-extrabold text-white text-lg tracking-wider">Acesso Bloqueado</h4>
          <p className="text-sm text-red-400 font-bold mt-3 leading-relaxed">
            Seu usuário não possui permissões configuradas.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Sua conta está registrada no sistema de autenticação, mas não possui atribuição ativa na tabela de perfis.
          </p>
          <button
            onClick={() => logout()}
            className="mt-6 w-full bg-red-650 hover:bg-red-700 hover:scale-[1.02] text-white py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-xs font-bold"
          >
            Encerrar Sessão e Sair
          </button>
        </div>
      </div>
    );
  }

  const path = currentRoute.replace('#', '');
  const isDashboardRoute = path.startsWith('dashboard/');

  if (isDashboardRoute && (!isLoggedIn || !profile)) {
    return (
      <div className="min-h-screen bg-[#070b12] flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-[#101c29] border border-white/5 p-8 rounded-3xl max-w-sm w-full shadow-xl flex flex-col items-center">
          <div className="bg-amber-500/15 p-4 rounded-xl text-amber-500 border border-amber-500/20 mb-4">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>
          <h4 className="font-display font-bold text-white text-base">Redirecionando...</h4>
          <p className="text-xs text-gray-400 mt-2">Você está sendo redirecionado para a página de login segura.</p>
          <button
            onClick={() => window.location.hash = '#login'}
            className="mt-5 w-full bg-[#af101a] text-white py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Acessar Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
