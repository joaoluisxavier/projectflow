// ----- INÍCIO DO CÓDIGO PARA ClientFormModal.tsx -----
import React, { useState, useEffect } from 'react';
import { useData } from '../../hooks/useDataContext';
import { Client } from '../../types';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { UploadIcon } from '../icons/UploadIcon';
import { supabase } from '../../services/supabase';

interface ClientFormModalProps { isOpen: boolean; onClose: () => void; client: Client | null; }

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, client }) => {
    const { addContractToClient, updateUserInDb } = useData();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!client;

    useEffect(() => { if (isOpen) { setError(''); setContractFile(null); if (client) { setFormData({ name: client.name, email: client.email, phone: client.phone || '', password: '' }); } else { setFormData({ name: '', email: '', phone: '', password: '' }); } } }, [client, isOpen]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleContractChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setContractFile(e.target.files[0]); } };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError(''); setIsSubmitting(true);
        try {
            if (isEditing && client) { 
                await updateUserInDb(client.id, { name: formData.name, phone: formData.phone, }); 
                if (contractFile) { await addContractToClient(client.id, contractFile); } 
            } else {
                const { data: authData, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password, options: { data: { name: formData.name, phone: formData.phone, role: 'client' } } });
                if (authError) throw authError; 
                if (!authData.user) throw new Error("Criação de usuário falhou.");
                if (contractFile) { await addContractToClient(authData.user.id, contractFile); }
            }
            onClose();
        } catch (err: any) { setError(err.message || "Ocorreu um erro."); } finally { setIsSubmitting(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Editar Cliente' : 'Novo Cliente'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label><input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
                <div><label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label><input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" /></div>
                <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label><input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
                <div><label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label><input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditing} minLength={6} disabled={isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" /><p className="mt-2 text-sm text-gray-500">{isEditing ? 'Senha não pode ser alterada.' : 'Mín. 6 caracteres.'}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Contrato</label><div className="mt-1 flex items-center space-x-4"><label htmlFor="contract-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"><UploadIcon className="mr-2"/>Upload</label><input id="contract-upload" name="contract-upload" type="file" className="sr-only" onChange={handleContractChange} accept=".pdf,.doc,.docx,image/*"/>{contractFile && <span className="text-sm text-gray-600">{contractFile.name}</span>}{!contractFile && client?.contract && <span className="text-sm text-gray-600">{client.contract.name}</span>}</div></div>
                <div className="pt-4 flex justify-end space-x-3"><button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md">Cancelar</button><button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-teal-600 hover:bg-teal-700">{isSubmitting ? <LoadingSpinner size="sm"/> : (client ? 'Salvar' : 'Criar Cliente')}</button></div>
            </form>
        </Modal>
    );
};
export default ClientFormModal;
// ----- FIM DO CÓDIGO PARA ClientFormModal.tsx -----