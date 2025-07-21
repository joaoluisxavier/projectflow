import React from 'react';
import { useData } from '../../hooks/useDataContext';
import { Project } from '../../types';
import ProgressBar from '../common/ProgressBar';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface ProjectListProps {
  onEdit: (project: Project) => void;
  filterByClientUid?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ onEdit, filterByClientUid }) => {
  const { projects: allProjects, clients, deleteProject, loading } = useData();

  const projects = filterByClientUid
    // CORRIGIDO: usa 'clientuid' (tudo minúsculo) para filtrar
    ? allProjects.filter(p => p.clientuid === filterByClientUid)
    : allProjects;

  const getClientName = (clientUid: string) => {
    return clients.find(c => c.id === clientUid)?.name || 'Cliente não encontrado';
  };
  
  const handleDelete = async (projectId: string) => {
      await deleteProject(projectId);
  }

  // NOVA FUNÇÃO: Para formatar a data de forma segura
  const formatDate = (dateString: string) => {
      if (!dateString) return 'Data Inválida';
      try {
        const date = new Date(dateString);
        // Verifica se a data é válida
        if (isNaN(date.getTime())) {
            return 'Data Inválida';
        }
        return date.toLocaleDateString('pt-BR');
      } catch (error) {
          return 'Data Inválida';
      }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800">{filterByClientUid ? 'Projetos do Cliente' : 'Todos os Projetos'}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>
              {!filterByClientUid && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map(project => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{project.name}</div>
                </td>
                {!filterByClientUid && (
                    <td className="px-6 py-4 whitespace-nowrap">
                        {/* CORRIGIDO: usa 'clientuid' (tudo minúsculo) */}
                        <div className="text-sm text-gray-700">{getClientName(project.clientuid)}</div>
                    </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap min-w-[250px]">
                  <ProgressBar status={project.status} />
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {/* CORRIGIDO: usa a nova função e 'created_at' (com underline) */}
                  {formatDate(project.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    <button onClick={() => onEdit(project)} className="text-teal-600 hover:text-teal-900">
                      <EditIcon />
                    </button>
                    <button onClick={() => handleDelete(project.id)} disabled={loading} className="text-red-600 hover:text-red-900 disabled:text-gray-300">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">
                  Nenhum projeto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectList;