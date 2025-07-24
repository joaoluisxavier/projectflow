import React, { useState, useEffect } from 'react';
import { useData } from '../../hooks/useDataContext';
import { Project, ProjectStatus, Client, FileInfo } from '../../types';
import { PROJECT_STATUS_ORDER } from '../../constants';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { UploadIcon } from '../icons/UploadIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  forcedClientUid?: string;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, onClose, project, forcedClientUid }) => {
  const { clients, addProject, updateProject, loading, deleteFileFromProject } = useData();
  
  // CORRIGIDO: O estado inicial agora usa todos os nomes corretos
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    clientuid: '',
    status: ProjectStatus.PaymentMade,
    price: 0,
    payment_condition: '', // <-- CORRIGIDO
    delivery_date: null,     // <-- CORRIGIDO
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (isOpen) {
        if (project && project.id) { // Editing existing project
        // CORRIGIDO: Usa todos os nomes corretos ao editar
        setFormData({
            name: project.name,
            description: project.description,
            clientuid: project.clientuid,
            status: project.status,
            price: project.price,
            payment_condition: project.payment_condition, // <-- CORRIGIDO
            delivery_date: project.delivery_date || null,     // <-- CORRIGIDO
        });
        } else { // New project
        // CORRIGIDO: Usa todos os nomes corretos ao criar
        setFormData({
            name: '',
            description: '',
            clientuid: forcedClientUid || (clients.length > 0 ? clients[0].id : ''),
            status: ProjectStatus.PaymentMade,
            price: 0,
            payment_condition: '', // <-- CORRIGIDO
            delivery_date: null,     // <-- CORRIGIDO
        });
        }
        setPhotoFiles([]);
    }
  }, [project, clients, isOpen, forcedClientUid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setPhotoFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
      }
  }

  const removePhoto = (index: number) => {
      setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleDeleteFile = async (file: FileInfo) => {
      if(project && project.id) {
          setIsSubmitting(true);
          await deleteFileFromProject(project.id, file);
          setIsSubmitting(false);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let finalPrice = 0;
    if (formData.price) {
        const priceAsString = String(formData.price).replace(/\./g, '').replace(',', '.');
        finalPrice = parseFloat(priceAsString) || 0;
    }
    
    // CORRIGIDO: O objeto enviado para a API usa todos os nomes corretos
    const projectData = {
        name: formData.name!,
        description: formData.description!,
        clientuid: formData.clientuid!,
        status: formData.status!,
        price: finalPrice,
        payment_condition: formData.payment_condition!, // <-- CORRIGIDO
        delivery_date: formData.delivery_date,         // <-- CORRIGIDO
    };

    try {
        if (project && project.id) {
          await updateProject(project.id, projectData, photoFiles);
        } else {
          await addProject(projectData, photoFiles);
        }
    } catch (error) {
        console.error("Falha ao criar/atualizar projeto:", error);
        alert("Ocorreu um erro ao salvar o projeto. Verifique o console para mais detalhes.");
    } finally {
        setIsSubmitting(false);
    }
    onClose();
  };

  const existingPhotos = project?.files?.filter(f => f.type === 'photo') || [];
  
  const statusIndex = formData.status ? PROJECT_STATUS_ORDER.indexOf(formData.status) : -1;
  const measurementIndex = PROJECT_STATUS_ORDER.indexOf(ProjectStatus.MeasurementDone);
  const canSetDeliveryDate = statusIndex >= measurementIndex;


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project && project.id ? 'Editar Projeto' : 'Adicionar Novo Projeto'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Projeto</label>
          <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição do Projeto</label>
          <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Descreva os principais detalhes do projeto..."></textarea>
        </div>
        <div>
          <label htmlFor="clientuid" className="block text-sm font-medium text-gray-700">Cliente</label>
          <select name="clientuid" id="clientuid" value={formData.clientuid || ''} onChange={handleChange} required disabled={!!forcedClientUid} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100">
            {clients.map((client: Client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" id="status" value={formData.status || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
            {PROJECT_STATUS_ORDER.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
            <input type="text" name="price" id="price" value={formData.price || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: 1500,50" />
          </div>
          <div>
            {/* CORRIGIDO: Atributos do input alterados */}
            <label htmlFor="payment_condition" className="block text-sm font-medium text-gray-700">Condição de Pagamento</label>
            <input type="text" name="payment_condition" id="payment_condition" value={formData.payment_condition || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
          </div>
        </div>
        
        {canSetDeliveryDate && (
            <div>
                {/* CORRIGIDO: Atributos do input alterados */}
                <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700">Prazo de Entrega</label>
                <input 
                    type="date" 
                    name="delivery_date" 
                    id="delivery_date" 
                    value={formData.delivery_date || ''} 
                    onChange={handleChange} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" 
                />
            </div>
        )}

        {project && project.id && existingPhotos.length > 0 && (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Fotos Atuais</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 border border-gray-200 p-4 rounded-md">
                    {existingPhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                            <img src={photo.url} alt={photo.name} className="h-24 w-full object-cover rounded-md"/>
                             <button 
                                type="button" 
                                onClick={() => handleDeleteFile(photo)} 
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Excluir foto"
                            >
                                <TrashIcon className="h-4 w-4"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="space-y-4">
            <div>
                 <label className="block text-sm font-medium text-gray-700">Adicionar Novas Fotos</label>
                 <div className="mt-1">
                    <label htmlFor="photos-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 inline-flex items-center">
                        <UploadIcon className="mr-2"/>
                        Adicionar Fotos
                    </label>
                    <input id="photos-upload" name="photos-upload" type="file" multiple className="sr-only" onChange={handlePhotosChange} accept="image/*"/>
                 </div>
                 {photoFiles.length > 0 && (
                     <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Novas fotos para adicionar:</p>
                         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                             {photoFiles.map((file, index) => (
                                 <div key={index} className="relative group">
                                     <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="h-24 w-full object-cover rounded-md"/>
                                     <button 
                                        type="button" 
                                        onClick={() => removePhoto(index)} 
                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remover foto"
                                    >
                                         <TrashIcon className="h-4 w-4"/>
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
            </div>
        </div>


        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting || loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300">
            {(isSubmitting || loading) ? <LoadingSpinner size="sm"/> : (project && project.id ? 'Salvar Alterações' : 'Criar Projeto')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectFormModal;