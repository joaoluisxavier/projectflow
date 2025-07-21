
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
        const updatedData: Partial<User> = {
            name: formData.name,
            email: formData.email,
        };
        await updateUserInDb(admin.id, updatedData);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password
        });
        if (authError) throw authError;
        if (!data.user) throw new Error("Criação de usuário falhou.");
        
        const newUser: User = {
          id: data.user.id,
          role: 'admin',
          name: formData.name,
          email: formData.email,
        };
        await addUserToDb(newUser);
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
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
        </div>
         <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditing} disabled={isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100" />
           {isEditing && <p className="mt-2 text-sm text-gray-500">A senha não pode ser alterada. O usuário deve usar a função "Esqueceu a senha" se necessário.</p>}
        </div>
       
        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
            Cancelar
          </button>
          <button type="submit" disabled={loading || isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300">
            {(loading || isSubmitting) ? <LoadingSpinner size="sm"/> : (isEditing ? 'Salvar Alterações' : 'Criar Administrador')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminFormModal;