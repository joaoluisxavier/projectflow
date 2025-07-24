import React from 'react';
import { DataProvider, useData } from './hooks/useDataContext';
import AdminDashboard from './components/admin/AdminDashboard';
import ClientDashboard from './components/client/ClientDashboard';
import ChatWidget from './components/client/ChatWidget';
import LoginScreen from './components/auth/LoginScreen';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { supabase } from './services/supabase';

const AppContent: React.FC = () => {
    const { userProfile, loading } = useData();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) {
        return (
             <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    if (!userProfile) {
        return <LoginScreen />;
    }

    // Código à prova de falhas: garante que 'userName' sempre seja uma string.
    const userName = userProfile.name || userProfile.email || 'Usuário';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        Project<span className="text-teal-600">Flow</span>
                    </h1>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <span className="hidden sm:inline text-sm text-gray-500">
                            Logado como: <span className="font-semibold text-teal-700">{userName}</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center p-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
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

export default App;```

---

### **Passo 3: Substituir o Arquivo `ClientDashboard.tsx`**

Este é o arquivo que causava o erro `split` diretamente. Esta versão é à prova de falhas.

```tsx
import React, { useState } from 'react';
import { useData } from '../../hooks/useDataContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ProjectDetails from './ProjectDetails';
import AssistanceModal from './AssistanceModal';
import { Project, Client } from '../../types';
import ClientInfoPanel from './ClientInfoPanel';

interface ClientDashboardProps {
  clientUid: string;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientUid }) => {
  const { userProfile, getProjectsByClient, loading } = useData(); // Removido 'projects' pois 'getProjectsByClient' já usa do contexto
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
  const [selectedProjectForAssistance, setSelectedProjectForAssistance] = useState<Project | null>(null);

  const client = userProfile as Client | null;
  // Certifique-se que o código não quebre se o perfil ainda estiver carregando
  const clientProjects = client ? getProjectsByClient(client.id) : [];

  const handleRequestAssistance = (project: Project) => {
    setSelectedProjectForAssistance(project);
    setIsAssistanceModalOpen(true);
  };
  
  // O estado de loading principal já está no App.tsx, então podemos simplificar aqui.
  if (!client) {
    return (
        <div className="flex justify-center items-center h-64">
             <div className="text-center text-red-500">
                <p>Não foi possível carregar o perfil do cliente.</p>
             </div>
        </div>
    );
  }

  // Código à prova de falhas para extrair o primeiro nome.
  const firstName = client.name ? client.name.split(' ')[0] : 'Visitante';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Seja bem-vindo, {firstName}!</h2>
        <p className="mt-1 text-base md:text-lg text-gray-600">Acompanhe aqui o andamento dos seus projetos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <ClientInfoPanel client={client} />
          {/* Adicione a seção do contrato aqui se desejar */}
        </div>
        
        <div className="lg:col-span-2">
            {clientProjects.length > 0 ? (
                <div className="space-y-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">Meus Projetos</h3>
                {clientProjects.map(project => (
                    <ProjectDetails key={project.id} project={project} onRequestAssistance={handleRequestAssistance}/>
                ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow">
                <h3 className="text-xl font-medium text-gray-800">Nenhum projeto encontrado</h3>
                <p className="mt-2 text-gray-500">Você ainda não possui projetos conosco.</p>
                </div>
            )}
        </div>
      </div>

      {selectedProjectForAssistance && (
        <AssistanceModal 
            isOpen={isAssistanceModalOpen}
            onClose={() => setIsAssistanceModalOpen(false)}
            project={selectedProjectForAssistance}
        />
      )}
    </div>
  );
};

export default ClientDashboard;