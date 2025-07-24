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
  const { userProfile, getProjectsByClient, loading, projects } = useData();
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
  const [selectedProjectForAssistance, setSelectedProjectForAssistance] = useState<Project | null>(null);

  const client = userProfile as Client | null;
  const clientProjects = getProjectsByClient(clientUid);

  const handleRequestAssistance = (project: Project) => {
    setSelectedProjectForAssistance(project);
    setIsAssistanceModalOpen(true);
  };
  
  if (loading && !client) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-gray-600">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return <div className="text-center text-red-500">Cliente não encontrado.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Seja bem-vindo, {client.name.split(' ')[0]}!</h2>
        <p className="mt-1 text-base md:text-lg text-gray-600">Acompanhe aqui o andamento dos seus projetos.</p>
      </div>

      {/* Grid Responsivo para Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda (Informações e Contrato) */}
        <div className="lg:col-span-1 space-y-8">
          <ClientInfoPanel client={client} />
          {/* Se você tiver uma seção de contrato, ela ficaria aqui */}
        </div>
        
        {/* Coluna da Direita (Projetos) */}
        <div className="lg:col-span-2">
            {loading && !projects.length ? (
                <div className="text-center py-16 bg-white rounded-lg shadow">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-500">Carregando seus projetos...</p>
                </div>
            ) : clientProjects.length > 0 ? (
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