
import React from 'react';
import { Client } from '../../types';
import { FileTextIcon } from '../icons/FileTextIcon';

interface ClientInfoPanelProps {
    client: Client;
}

const ClientInfoPanel: React.FC<ClientInfoPanelProps> = ({ client }) => {
    return (
        <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Minhas Informações</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Nome</h4>
                    <p className="text-md font-medium text-gray-800">{client.name}</p>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</h4>
                    <p className="text-md font-medium text-gray-800">{client.email}</p>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Telefone</h4>
                    <p className="text-md font-medium text-gray-800">{client.phone}</p>
                </div>
            </div>
            {client.contract && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                     <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Contrato</h4>
                     <a 
                        href={client.contract.url} 
                        download={client.contract.name} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        <FileTextIcon className="mr-2 -ml-1 h-5 w-5"/>
                        Baixar meu contrato
                    </a>
                </div>
            )}
        </div>
    );
}

export default ClientInfoPanel;
