import React, { useState, useEffect } from 'react';
import { useData } from '../../hooks/useDataContext';
import { AssistanceRequest, AssistanceStatus } from '../../types';
import { ASSISTANCE_STATUS_ORDER } from '../../constants';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

interface AssistanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AssistanceRequest | null;
}

const AssistanceFormModal: React.FC<AssistanceFormModalProps> = ({ isOpen, onClose, request }) => {
  const { updateAssistanceRequest, loading, projects } = useData();
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<AssistanceStatus>(AssistanceStatus.Open);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (request) {
      setResponse(request.response || '');
      setStatus(request.status);
    }
  }, [request]);

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateAssistanceRequest(request.id, { status, response });
    setIsSubmitting(false);
    onClose();
  };

  const projectName = projects.find(p => p.id === request.projectId)?.name || 'Desconhecido';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gerenciar Assistência: ${projectName}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-500">Cliente</h4>
            <p className="text-gray-800 font-medium">{request.clientName}</p>
            <h4 className="text-sm font-semibold text-gray-500 mt-2">Problema Relatado</h4>
            {/* CORRIGIDO: Agora usa 'description' */}
            <p className="text-gray-800 whitespace-pre-wrap">{request.description}</p>
        </div>

        {/* O resto do arquivo permanece o mesmo... */}
        
        {request.photos && request.photos.length > 0 && (
             <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Fotos Anexadas pelo Cliente</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {request.photos.map(photo => (
                    <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer" className="aspect-w-1 aspect-h-1 block">
                    <img src={photo.url} alt={photo.name} className="object-cover rounded-lg shadow-md w-full h-full" />
                    </a>
                ))}
                </div>
            </div>
        )}

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Alterar Status</label>
          <select 
            name="status" 
            id="status" 
            value={status} 
            onChange={(e) => setStatus(e.target.value as AssistanceStatus)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          >
            {ASSISTANCE_STATUS_ORDER.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="response" className="block text-sm font-medium text-gray-700">
            Resposta para o Cliente
          </label>
          <textarea
            id="response"
            name="response"
            rows={5}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Escreva aqui uma mensagem de retorno para o cliente..."
          ></textarea>
        </div>
        
        <div className="pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300"
          >
            {(loading || isSubmitting) ? <LoadingSpinner size="sm" /> : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssistanceFormModal;