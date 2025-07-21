
import React from 'react';
import { useData } from '../../hooks/useDataContext';
import { Admin } from '../../types';
import { EditIcon } from '../icons/EditIcon';

interface AdminListProps {
  onEdit: (admin: Admin) => void;
}

const AdminList: React.FC<AdminListProps> = ({ onEdit }) => {
  const { admins } = useData();

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800">Todos os Administradores</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{admin.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                  <div className="flex items-center space-x-4">
                     <button onClick={() => onEdit(admin)} className="text-teal-600 hover:text-teal-900" title="Editar Administrador">
                      <EditIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-10 text-gray-500">
                  Nenhum administrador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminList;
