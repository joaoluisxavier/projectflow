import React from 'react';
import { DataProvider, useData } from './hooks/useDataContext';
import AdminDashboard from './components/admin/AdminDashboard';
import ClientDashboard from './components/client/ClientDashboard';
import ChatWidget from './components/client/ChatWidget';
import LoginScreen from './components/auth/LoginScreen';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { supabase } from './services/supabase';

const AppContent: React.FC = () => {
    // CORRIGIDO: Não pega mais 'authUser', apenas 'userProfile' e 'loading'
    const { userProfile, loading } = useData();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return (
             <div className="flex h-screen w-screen items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    // LÓGICA DE RENDERIZAÇÃO SIMPLIFICADA E SEGURA
    // Se o userProfile não existir, mostra a tela de login. Ponto final.
    if (!userProfile) {
        return <LoginScreen />;
    }

    // Se o código chegou até aqui, é 100% seguro que 'userProfile' existe e não é nulo.
    const userName = userProfile.name || userProfile.email;

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800">
            <header className="bg-white shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Project<span className="text-teal-600">Flow</span>
                    </h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                            Logado como: <span className="font-semibold text-teal-700">{userName}</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
                            aria-label="Logout"
                        >
                           <LogoutIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">
                {userProfile.role === 'admin' ? (
                    <AdminDashboard />
                ) : (
                    <ClientDashboard clientUid={userProfile.id} />
                )}
            </main>
            {userProfile.role === 'client' && <ChatWidget />}
        </div>
    );
}

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;