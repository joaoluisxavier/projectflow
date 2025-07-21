
import React from 'react';
import { useData } from '../../hooks/useDataContext';
import { AssistanceRequest, AssistanceStatus } from '../../types';

interface AssistanceListProps {
  onManage: (request: AssistanceRequest) => void;
}

const AssistanceStatusBadge: React.FC<{status: AssistanceStatus}> = ({status}) => {
    const statusInfo = {
        [AssistanceStatus.Open]: 'bg-red-100 text-red-800',
        [AssistanceStatus.InProgress]: 'bg-yellow-100 text-yellow-800',
        [AssistanceStatus.Closed]: 'bg-green-100 text-green-800',
    }
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo[status]}`}>{status}</span>
}

const AssistanceList: React.FC<AssistanceListProps> = ({ onManage }) => {
  const { assistanceRequests, projects, clients } = useData();

  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'Projeto não encontrado';

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800">Solicitações de Assistência Técnica</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problema</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assistanceRequests.map(request => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{request.clientName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{getProjectName(request.projectId)}</div>
                </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 max-w-xs truncate">{request.issue}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <AssistanceStatusBadge status={request.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                   <button onClick={() => onManage(request)} className="text-teal-600 hover:text-teal-900 font-semibold">
                      Gerenciar
                    </button>
                </td>
              </tr>
            ))}
            {assistanceRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  Nenhuma solicitação de assistência encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssistanceList;