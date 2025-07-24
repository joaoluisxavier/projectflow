import React, { useState } from 'react';
import { useData } from '../../hooks/useDataContext';
import { Project } from '../../types';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { UploadIcon } from '../icons/UploadIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface AssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const MAX_PHOTOS = 6;

const AssistanceModal: React.FC<AssistanceModalProps> = ({ isOpen, onClose, project }) => {
  const { addAssistanceRequest, loading } = useData();
  const [description, setDescription] = useState(''); // Usa o estado 'description'
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setError('');
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          if (photos.length + newFiles.length > MAX_PHOTOS) {
              setError(`Você pode anexar no máximo ${MAX_PHOTOS} fotos.`);
              return;
          }
          setPhotos(prev => [...prev, ...newFiles]);
      }
  }

  const removePhoto = (index: number) => {
      setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      setIsSubmitting(true);
      try {
        // CORRIGIDO: Envia um objeto com 'description'
        await addAssistanceRequest(
          {
            projectId: project.id,
            description,
          },
          photos
        );
        setDescription('');
        setPhotos([]);
        setError('');
        onClose();
      } catch (error) {
        console.error("Failed to submit assistance request", error);
        setError("Não foi possível enviar a solicitação. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Solicitar Assistência para: ${project.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descreva o problema
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Ex: A porta do armário não está fechando corretamente."
            required
          ></textarea>
        </div>

        {/* O resto do arquivo permanece o mesmo... */}

        <div>
            <label className="block text-sm font-medium text-gray-700">Anexar Fotos (opcional, máx. {MAX_PHOTOS})</label>
            <div className="mt-1">
                <label htmlFor="photos-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 inline-flex items-center">
                    <UploadIcon className="mr-2"/>
                    Adicionar Fotos
                </label>
                <input id="photos-upload" name="photos-upload" type="file" multiple className="sr-only" onChange={handlePhotoChange} accept="image/*" disabled={photos.length >= MAX_PHOTOS}/>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
             {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                    {photos.map((file, index) => (
                        <div key={index} className="relative">
                            <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="h-24 w-full object-cover rounded-md"/>
                            <button type="button" onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700">
                                <TrashIcon className="h-3 w-3"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
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
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
          >
            {(loading || isSubmitting) ? <LoadingSpinner size="sm" /> : 'Enviar Solicitação'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssistanceModal;