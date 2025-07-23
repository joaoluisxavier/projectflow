import React from 'react';
import { Project, FileInfo, AssistanceRequest, AssistanceStatus, ProjectStatus } from '../../types';
import ProgressBar from '../common/ProgressBar';
import { DownloadIcon } from '../icons/DownloadIcon';
import { useData } from '../../hooks/useDataContext';
import { PROJECT_STATUS_ORDER } from '../../constants';

interface ProjectDetailsProps {
  project: Project;
  onRequestAssistance: (project: Project) => void;
}

const AssistanceStatusBadge: React.FC<{ status: AssistanceStatus }> = ({ status }) => {
    const statusInfo = {
        [AssistanceStatus.Open]: { text: 'Aberto', color: 'bg-red-100 text-red-800' },
        [AssistanceStatus.InProgress]: { text: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
        [AssistanceStatus.Closed]: { text: 'Fechado', color: 'bg-green-100 text-green-800' },
    };
    const { text, color } = statusInfo[status] || { text: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>{text}</span>
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onRequestAssistance }) => {
    
  const { assistanceRequests } = useData();
  const projectRequests = assistanceRequests.filter(ar => ar.projectId === project.id);
  const photos = project.files.filter(f => f.type === 'photo');
  const documents = project.files.filter(f => f.type !== 'photo' && f.type !== 'contract');

  const measurementDoneIndex = PROJECT_STATUS_ORDER.indexOf(ProjectStatus.MeasurementDone);
  const currentStatusIndex = PROJECT_STATUS_ORDER.indexOf(project.status);
  const canShowDate = currentStatusIndex >= measurementDoneIndex;

   const formatDate = (dateString: string) => {
      if (!dateString) return "Data Inválida";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data Inválida';
        return date.toLocaleDateString('pt-BR');
      } catch (error) { return 'Data Inválida'; }
  };
  
   const formatDateWithTimezone = (dateString: string) => {
      if (!dateString) return "Data Inválida";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data Inválida';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      } catch (error) { return 'Data Inválida'; }
  };

  const FileItem: React.FC<{file: FileInfo}> = ({ file }) => (
    <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
        <div className="flex flex-col">
            <span className="font-medium text-sm text-gray-800 truncate">{file.name}</span>
            <span className="text-xs text-gray-500">Upload em: {formatDate(file.uploadedAt)}</span>
        </div>
        <DownloadIcon className="h-5 w-5 text-teal-600 flex-shrink-0 ml-2"/>
    </a>
  );

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-shadow hover:shadow-2xl">
      <div className="p-4 md:p-6">
        {/* Cabeçalho do Card Responsivo */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500 mt-1 sm:mt-0">Criado em: {formatDate(project.created_at)}</p>
        </div>
        <div className="mt-4">
          <ProgressBar status={project.status} />
        </div>
        {project.description && (
            <p className="mt-4 text-gray-600 text-sm bg-gray-50 p-3 rounded-md">{project.description}</p>
        )}
      </div>

      <div className="px-4 md:px-6 pb-6 space-y-6">
        {/* Galeria Responsiva */}
        {photos.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Fotos do Projeto</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer" className="aspect-w-1 aspect-h-1 block group">
                  <img src={photo.url} alt={photo.name} className="object-cover rounded-lg shadow-md w-full h-full transition-transform group-hover:scale-105" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Info do Projeto Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-teal-50/50 p-4 rounded-lg">
            <div className="text-center md:text-left">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Valor do Projeto</h4>
                <p className="text-lg font-bold text-teal-800">
                    {project.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
            <div className="text-center md:text-left">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Condição de Pagamento</h4>
                <p className="text-lg font-medium text-gray-700">{project.payment_condition}</p>
            </div>
            <div className="text-center md:text-left">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Prazo de Entrega</h4>
                {canShowDate && project.delivery_date ? (
                    <p className="text-lg font-medium text-gray-700">
                        {formatDateWithTimezone(project.delivery_date)}
                    </p>
                ) : (
                    <p className="text-sm font-medium text-gray-500 italic">Aguardando aprovação</p>
                )}
            </div>
        </div>
        
        {projectRequests.length > 0 && (
            <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Minhas Solicitações de Assistência</h4>
                <div className="space-y-4">
                    {projectRequests.map((req) => (
                        <div key={req.id} className="p-4 border border-gray-200 rounded-lg">
                           <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Solicitado em: {formatDate(req.created_at)}
                                    </p>
                                    <p className="mt-1 font-medium text-gray-800">{req.description}</p>
                                </div>
                                <AssistanceStatusBadge status={req.status} />
                           </div>
                           {req.response && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-sm font-semibold text-teal-700">Resposta do Atendimento:</p>
                                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{req.response}</p>
                                </div>
                           )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Documentos e Ações Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Documentos e Relatórios</h4>
                {documents.length > 0 ? (
                    <div className="space-y-2">
                        {documents.map(doc => <FileItem key={doc.id} file={doc} />)}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Nenhum documento disponível.</p>
                )}
            </div>
             <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Precisa de ajuda?</h4>
                <button 
                  onClick={() => onRequestAssistance(project)}
                  className="w-full text-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Solicitar Assistência Técnica
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectDetails;