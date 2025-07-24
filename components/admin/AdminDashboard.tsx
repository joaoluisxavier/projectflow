// ----- INÍCIO DO CÓDIGO PARA AdminDashboard.tsx -----
import React, { useState } from 'react';
import { useData } from '../../hooks/useDataContext';
import { Client, Project, ProjectStatus, AssistanceRequest, Admin } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { PlusIcon, BriefcaseIcon, UserGroupIcon, ArrowLeftIcon, WrenchScrewdriverIcon, ShieldCheckIcon } from '../icons';
import ProjectFormModal from './ProjectFormModal';
import ClientFormModal from './ClientFormModal';
import ProjectList from './ProjectList';
import ClientList from './ClientList';
import AssistanceList from './AssistanceList';
import AssistanceFormModal from './AssistanceFormModal';
import AdminList from './AdminList';
import AdminFormModal from './AdminFormModal';

const AdminDashboard: React.FC = () => {
    const { projects, clients, assistanceRequests, loading } = useData();
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [managingAssistance, setManagingAssistance] = useState<AssistanceRequest | null>(null);
    const [view, setView] = useState<{ type: 'main' | 'clientProjects', clientUid?: string, clientName?: string }>({ type: 'main' });
    const [activeTab, setActiveTab] = useState<'projects' | 'clients' | 'assistance' | 'admins'>('projects');

    const handleAddNewProject = (forcedClientUid?: string) => { setEditingProject(forcedClientUid ? { clientuid: forcedClientUid } as any : null); setIsProjectModalOpen(true); };
    const handleEditProject = (project: Project) => { setEditingProject(project); setIsProjectModalOpen(true); };
    const handleAddNewClient = () => { setEditingClient(null); setIsClientModalOpen(true); };
    const handleEditClient = (client: Client) => { setEditingClient(client); setIsClientModalOpen(true); };
    const handleAddNewAdmin = () => { setEditingAdmin(null); setIsAdminModalOpen(true); };
    const handleEditAdmin = (admin: Admin) => { setEditingAdmin(admin); setIsAdminModalOpen(true); };
    const handleViewClientProjects = (clientUid: string, clientName: string) => setView({ type: 'clientProjects', clientUid, clientName });
    const handleManageAssistance = (request: AssistanceRequest) => { setManagingAssistance(request); setIsAssistanceModalOpen(true); };

    const projectsInProgress = projects.filter(p => p.status !== ProjectStatus.Completed).length;
    const openAssistance = assistanceRequests.filter(ar => ar.status === 'Aberto').length;
    const stats = [{ name: 'Total de Projetos', value: projects.length, color: 'bg-blue-500' },{ name: 'Projetos em Andamento', value: projectsInProgress, color: 'bg-yellow-500' },{ name: 'Clientes Ativos', value: clients.length, color: 'bg-green-500' },{ name: 'Assistências Abertas', value: openAssistance, color: 'bg-red-500' }];

    if (view.type === 'clientProjects' && view.clientUid) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-2 md:space-x-4"><button onClick={() => setView({ type: 'main' })} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeftIcon /></button><h2 className="text-xl md:text-3xl font-bold text-gray-800">Projetos de <span className="text-teal-600">{view.clientName}</span></h2></div>
                <div className="flex justify-end mb-4"><button onClick={() => handleAddNewProject(view.clientUid)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700"><PlusIcon className="-ml-1 mr-2 h-5 w-5" />Novo Projeto para Cliente</button></div>
                {loading ? <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow"><LoadingSpinner /></div> : <ProjectList onEdit={handleEditProject} filterByClientUid={view.clientUid} />}
                <ProjectFormModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} project={editingProject} forcedClientUid={view.clientUid} />
            </div>
        );
    }
    
    const renderActiveButton = () => { const buttons = {projects: {label: 'Novo Projeto', handler: handleAddNewProject}, clients: {label: 'Novo Cliente', handler: handleAddNewClient}, admins: {label: 'Novo Administrador', handler: handleAddNewAdmin}}; const config = buttons[activeTab]; if (!config) return null; return <button onClick={config.handler} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700"><PlusIcon className="-ml-1 mr-2 h-5 w-5" />{config.label}</button>};

    const tabs = [{ key: 'projects', label: 'Projetos', icon: BriefcaseIcon },{ key: 'clients', label: 'Clientes', icon: UserGroupIcon },{ key: 'assistance', label: 'Assistência', icon: WrenchScrewdriverIcon },{ key: 'admins', label: 'Admins', icon: ShieldCheckIcon }];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Painel do Administrador</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{stats.map(stat => (<div key={stat.name} className={`p-6 rounded-lg shadow-lg text-white ${stat.color}`}><p className="text-sm font-medium opacity-80">{stat.name}</p><p className="text-4xl font-bold">{loading && stat.value === 0 ? <LoadingSpinner size="sm" /> : stat.value}</p></div>))}</div>
            <div>
                <div className="border-b border-gray-200"><nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">{tabs.map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`${activeTab === tab.key ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}><tab.icon className="mr-2" />{tab.label}</button>))}</nav></div>
                <div className="mt-6">
                    <div className="flex justify-end mb-4">{renderActiveButton()}</div>
                    {loading && projects.length === 0 && clients.length === 0 ? <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow"><LoadingSpinner /></div> : (<>{activeTab === 'projects' && <ProjectList onEdit={handleEditProject} />}{activeTab === 'clients' && <ClientList onEdit={handleEditClient} onViewProjects={handleViewClientProjects} />}{activeTab === 'assistance' && <AssistanceList onManage={handleManageAssistance} />}{activeTab === 'admins' && <AdminList onEdit={handleEditAdmin} />}</>)}
                </div>
            </div>
            <ProjectFormModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} project={editingProject} />
            <ClientFormModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} client={editingClient} />
            <AssistanceFormModal isOpen={isAssistanceModalOpen} onClose={() => setIsAssistanceModalOpen(false)} request={managingAssistance} />
            <AdminFormModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} admin={editingAdmin} />
        </div>
    );
};
export default AdminDashboard;
// ----- FIM DO CÓDIGO PARA AdminDashboard.tsx -----