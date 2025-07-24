import React, { useState, useEffect } from 'react';
import { useData } from '../../hooks/useDataContext';
import { Admin, User } from '../../types';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { supabase } from '../../services/supabase';

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: Admin | null;
}

const AdminFormModal: React.FC<AdminFormModalProps> = ({ isOpen, onClose, admin }) => {
  const { loading, addUserToDb, updateUserInDb } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!admin;

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (admin) {
        setFormData({
            name: admin.name,
            email: admin.email,
            password: '', 
        });
      } else {
        setFormData({ name: '', email: '', password: '' });
      }
    }
  }, [admin, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isEditing && admin) {
        // A lógica de edição continua a mesma
        await updateUserInDb(admin.id, { name: formData.name });
      } else {
        
        // ### CÓDIGO CORRIGIDO E SIMPLIFICADO ###
        // Usamos a função signUp, que funcionará agora que as RLS estão corretas.
        // A chave é o 'data' adicional para o nome e a role.
        const { data, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.name, // Passa o nome para o trigger
                    role: 'admin'            // Define a role para o trigger
                }
            }
        });
        
        if (authError) throw authError;
        // Não precisamos mais do addUserToDb, pois o TRIGGER que criamos cuidará disso!
      }
      onClose();
    } catch (err: any) {
        setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Administrador' : 'Adicionar Novo Administrador'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
         <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
         <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditing} disabled={isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
           {isEditing && <p className="mt-2 text-sm text-gray-500">A senha não pode ser alterada.</p>}
        </div>
       
        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md">
            Cancelar
          </button>
          <button type="submit" disabled={loading || isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-teal-600 hover:bg-teal-700">
            {(loading || isSubmitting) ? <LoadingSpinner size="sm"/> : (isEditing ? 'Salvar Alterações' : 'Criar Administrador')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminFormModal;