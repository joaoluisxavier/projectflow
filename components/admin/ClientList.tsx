import React from 'react';
import { useData } from '../../hooks/useDataContext';
import { Client } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { FolderIcon } from '../icons/FolderIcon';
import { TrashIcon } from '../icons/TrashIcon'; // Importe o ícone da lixeira

interface ClientListProps {
  onEdit: (client: Client) => void;
  onViewProjects: (clientUid: string, clientName: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ onEdit, onViewProjects }) => {
  // Pegue a função deleteUser e o estado de loading do contexto
  const { clients, deleteUser, loading } = useData();

  const handleDelete = (clientId: string) => {
    // Chama a função de exclusão que está no nosso contexto
    deleteUser(clientId);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800">Todos os Clientes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{client.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{client.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => onViewProjects(client.id, client.name)} className="text-gray-500 hover:text-teal-700" title="Ver Projetos">
                        <FolderIcon />
                    </button>
                    <button onClick={() => onEdit(client)} className="text-teal-600 hover:text-teal-900" title="Editar Cliente">
                      <EditIcon />
                    </button>
                    {/* ### ADIÇÃO DO BOTÃO DE DELETAR ### */}
                    <button 
                        onClick={() => handleDelete(client.id)} 
                        disabled={loading}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400" 
                        title="Deletar Cliente"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientList;