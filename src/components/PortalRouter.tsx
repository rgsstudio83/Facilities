import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { ShieldAlert, Loader2, Lock, HelpCircle } from 'lucide-react';

export type PortalRoute = 'login' | 'register' | 'dashboard';

interface PortalRouterContextType {
  currentRoute: PortalRoute;
  setRoute: (route: PortalRoute) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  sessionLoading: boolean;
  userProfile: any | null;
  setUserProfile: (profile: any) => void;
  triggerNotification: (title: string, text: string) => void;
  logout: () => Promise<void>;
}

const PortalRouterContext = createContext<PortalRouterContextType | undefined>(undefined);

export function usePortalRouter() {
  const context = useContext(PortalRouterContext);
  if (!context) {
    throw new Error('usePortalRouter deve ser usado dentro de um PortalRouterProvider');
  }
  return context;
}

interface PortalRouterProviderProps {
  children: React.ReactNode;
  onShowNotification: (title: string, text: string) => void;
  externalLoginState?: {
    isLoggedIn: boolean;
    setIsLoggedIn: (val: boolean) => void;
    username: string;
    setUsername: (val: string) => void;
    apartmentCode: string;
    setApartmentCode: (val: string) => void;
    profileType: string;
    setProfileType: (val: string) => void;
  };
}

export function PortalRouterProvider({
  children,
  onShowNotification,
  externalLoginState
}: PortalRouterProviderProps) {
  const [currentRoute, setCurrentRoute] = useState<PortalRoute>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(externalLoginState?.isLoggedIn || false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // Sync session with Supabase auth or simulation
  useEffect(() => {
    let authSubscription: any = null;

    const initAuth = async () => {
      setSessionLoading(true);
      
      if (isSupabaseConfigured && supabase) {
        try {
          // 1. Get active session on mount
          const { data: { session }, error } = await supabase.auth.getSession();
          if (session?.user) {
            const user = session.user;
            
            // Fetch profile
            let profileName = user.user_metadata?.full_name || 'Usuário Autenticado';
            let profileUnit = user.user_metadata?.unit || 'Apto 41-B';
            let profileType = user.user_metadata?.profile || 'Morador';

            try {
              const { data: dbProfile } = await supabase
                .from('perfis')
                .select('*')
                .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
                .maybeSingle();

              if (dbProfile) {
                profileName = dbProfile.nome || profileName;
                profileUnit = dbProfile.unidade || profileUnit;
                const rawTipo = dbProfile.tipo || dbProfile.perfil || 'Morador';
                profileType = rawTipo.charAt(0).toUpperCase() + rawTipo.slice(1);
                if (profileType === 'Sindico') profileType = 'Síndico';
                if (profileType === 'Subsindico') profileType = 'Subsíndico';
                if (profileType === 'Proprietario') profileType = 'Proprietário';
              }
            } catch (err) {
              console.warn('Erro ao obter perfil no PortalRouter:', err);
            }

            // Update local state
            setIsLoggedIn(true);
            setUserProfile(user);
            setCurrentRoute('dashboard');

            if (externalLoginState) {
              externalLoginState.setIsLoggedIn(true);
              externalLoginState.setUsername(profileName);
              externalLoginState.setApartmentCode(profileUnit);
              externalLoginState.setProfileType(profileType);
            }
          } else {
            // Check if there is an active offline simulation session in external states
            if (externalLoginState && externalLoginState.isLoggedIn) {
              setIsLoggedIn(true);
              setCurrentRoute('dashboard');
            } else {
              setIsLoggedIn(false);
              setCurrentRoute('login');
            }
          }

          // 2. Subscribe to auth state changes
          const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const user = session.user;
              setIsLoggedIn(true);
              setUserProfile(user);
              setCurrentRoute('dashboard');
              
              if (externalLoginState) {
                externalLoginState.setIsLoggedIn(true);
                externalLoginState.setUsername(user.user_metadata?.full_name || user.email || 'Usuário');
                externalLoginState.setApartmentCode(user.user_metadata?.unit || 'Apto 41-B');
                externalLoginState.setProfileType(user.user_metadata?.profile || 'Morador');
              }
            } else if (event === 'SIGNED_OUT') {
              setIsLoggedIn(false);
              setUserProfile(null);
              setCurrentRoute('login');
              
              if (externalLoginState) {
                externalLoginState.setIsLoggedIn(false);
              }
            }
          });
          authSubscription = data.subscription;
        } catch (e) {
          console.error('Falha de inicialização no portal auth:', e);
        }
      } else {
        // Simple sandbox setup validation
        const savedLoggedIn = localStorage.getItem('facilities_portal_sim_logged_in') === 'true';
        if (savedLoggedIn || (externalLoginState && externalLoginState.isLoggedIn)) {
          setIsLoggedIn(true);
          setCurrentRoute('dashboard');
        } else {
          setIsLoggedIn(false);
          setCurrentRoute('login');
        }
      }
      setSessionLoading(false);
    };

    initAuth();

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Guarantee that unauthenticated users can't bypass state to land on dashboard
  useEffect(() => {
    if (!sessionLoading && currentRoute === 'dashboard' && !isLoggedIn) {
      // Access violation!
      setCurrentRoute('login');
      onShowNotification(
        'Acesso Negado!',
        'Você precisa estar autenticado para acessar a área operacional do condomínio.'
      );
    }
  }, [currentRoute, isLoggedIn, sessionLoading]);

  // Sync state back to outer references if they change locally
  useEffect(() => {
    if (externalLoginState) {
      if (externalLoginState.isLoggedIn !== isLoggedIn) {
        setIsLoggedIn(externalLoginState.isLoggedIn);
        if (externalLoginState.isLoggedIn) {
          setCurrentRoute('dashboard');
        } else {
          setCurrentRoute('login');
        }
      }
    }
  }, [externalLoginState?.isLoggedIn]);

  const setRoute = (route: PortalRoute) => {
    if (route === 'dashboard' && !isLoggedIn) {
      onShowNotification(
        'Acesso Restrito',
        'Por favor, faça logon antes de acessar as rotas de gerenciamento.'
      );
      return;
    }
    setCurrentRoute(route);
  };

  const triggerNotification = (title: string, text: string) => {
    onShowNotification(title, text);
  };

  const logout = async () => {
    setSessionLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar no router:', err);
      }
    }
    
    setIsLoggedIn(false);
    setUserProfile(null);
    setCurrentRoute('login');
    localStorage.removeItem('facilities_portal_sim_logged_in');

    if (externalLoginState) {
      externalLoginState.setIsLoggedIn(false);
      externalLoginState.setUsername('Roberto Silva');
      externalLoginState.setApartmentCode('Apto 41-B');
      externalLoginState.setProfileType('Morador');
    }
    
    onShowNotification('Sessão encerrada!', 'Atividades do portal fechadas com segurança.');
    setSessionLoading(false);
  };

  return (
    <PortalRouterContext.Provider
      value={{
        currentRoute,
        setRoute,
        isLoggedIn,
        setIsLoggedIn,
        sessionLoading,
        userProfile,
        setUserProfile,
        triggerNotification,
        logout
      }}
    >
      {children}
    </PortalRouterContext.Provider>
  );
}

interface PortalRouteGuardProps {
  allowedRoute: PortalRoute;
  children: React.ReactNode;
  fallbackRoute?: PortalRoute;
}

export function PortalRouteGuard({
  allowedRoute,
  children,
  fallbackRoute = 'login'
}: PortalRouteGuardProps) {
  const { currentRoute, sessionLoading, isLoggedIn } = usePortalRouter();

  if (sessionLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-sans font-medium text-secondary">Verificando sessão segura...</p>
      </div>
    );
  }

  const isAuthorized = currentRoute === allowedRoute && (allowedRoute !== 'dashboard' || isLoggedIn);

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-amber-50/50 border border-amber-200/60 rounded-2xl m-4 text-center">
        <Lock className="w-12 h-12 text-[#af101a] mb-3" />
        <h4 className="font-display font-bold text-[#101c29] text-base">Acesso Protegido</h4>
        <p className="text-xs text-secondary max-w-sm mt-1.5 leading-relaxed font-sans">
          Essa visualização é protegida por criptografia de dados. Suas credenciais precisam ser validadas.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-[#af101a] hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
        >
          Autenticar Novamente
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

interface PortalRouteTransitionProps {
  children: React.ReactNode;
  routeKey: string;
}

export function PortalRouteTransition({ children, routeKey }: PortalRouteTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="w-full h-full flex flex-col flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
