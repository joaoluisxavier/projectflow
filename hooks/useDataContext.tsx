import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Client, Project, AssistanceRequest, Admin, AssistanceStatus, User, FileInfo } from '../types';
import { Session, User as AuthUser, PostgresChangesPayload } from '@supabase/supabase-js';

// ... (as funções sanitizeFilename e uploadFile permanecem as mesmas no topo)
const sanitizeFilename = (filename: string): string => {
  return filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s.-]/g, '').trim().replace(/\s+/g, '-');
};
const uploadFile = async (file: File, path: string, bucket: string): Promise<FileInfo> => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    const fileType = file.type.startsWith('image/') ? 'photo' : (file.type === 'application/pdf' ? 'contract' : 'report');
    return { id: data.path, name: file.name, url: publicUrl, type: fileType as 'photo' | 'contract' | 'report', uploadedAt: new Date().toISOString() };
};

interface DataContextType {
  userProfile: User | null;
  clients: Client[];
  admins: Admin[];
  projects: Project[];
  assistanceRequests: AssistanceRequest[];
  loading: boolean;
  getProjectsByClient: (clientUid: string) => Project[];
  getProjectById: (projectId: string) => Project | undefined;
  addProject: (projectData: Omit<Project, 'id' | 'created_at' | 'files'>, newPhotoFiles?: File[]) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Omit<Project, 'id' | 'files'>>, newPhotoFiles?: File[]) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  deleteFileFromProject: (projectId: string, file: FileInfo) => Promise<void>;
  updateUserInDb: (uid: string, data: Partial<User>) => Promise<void>;
  addContractToClient: (clientUid: string, file: File) => Promise<void>;
  addAssistanceRequest: (request: Omit<AssistanceRequest, 'id' | 'created_at' | 'status' | 'clientName' | 'clientUid' | 'response' | 'photos'>, photos: File[]) => Promise<void>;
  updateAssistanceRequest: (requestId: string, data: { status: AssistanceStatus, response: string }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ### LÓGICA DE AUTENTICAÇÃO E PERFIL UNIFICADA E CORRIGIDA ###
  useEffect(() => {
    const fetchSessionAndProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            try {
                const { data: profile, error } = await supabase.from('clientes').select('*').eq('id', session.user.id).single();
                if (error) throw error;
                setUserProfile(profile as User);
            } catch (error) {
                console.error("Sessão encontrada, mas falha ao buscar perfil:", error);
                // Força o logout se o perfil não puder ser carregado para evitar erros
                await supabase.auth.signOut();
                setUserProfile(null);
            }
        } else {
            setUserProfile(null);
        }
        setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setLoading(true);
        if (session?.user) {
            try {
                const { data: profile, error } = await supabase.from('clientes').select('*').eq('id', session.user.id).single();
                if (error) throw error;
                setUserProfile(profile as User);
            } catch (error) {
                console.error("Falha ao buscar perfil após mudança de autenticação:", error);
                setUserProfile(null);
            }
        } else {
            setUserProfile(null);
        }
        setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ... (O restante dos useEffects e funções permanecem iguais)
   useEffect(() => {
    if (!userProfile) return;
    const fetchInitialData = async () => {
        try {
            if (userProfile.role === 'admin') {
                const [{ data: pD, error: pE }, { data: uD, error: uE }, { data: aD, error: aE }] = await Promise.all([
                    supabase.from('projects').select('*').order('created_at', { ascending: false }),
                    supabase.from('clientes').select('*'),
                    supabase.from('assistanceRequests').select('*').order('created_at', { ascending: false })
                ]);
                if (pE) throw pE; if (uE) throw uE; if (aE) throw aE;
                setProjects((pD as any[]) || []);
                setClients((uD || []).filter(u => u.role === 'client') as Client[]);
                setAdmins((uD || []).filter(u => u.role === 'admin') as Admin[]);
                setAssistanceRequests((aD as any[]) || []);
            } else if (userProfile.role === 'client') {
                 const [{ data: pD, error: pE }, { data: aD, error: aE }] = await Promise.all([
                    supabase.from('projects').select('*').eq('clientuid', userProfile.id).order('created_at', { ascending: false }),
                    supabase.from('assistanceRequests').select('*').eq('clientUid', userProfile.id).order('created_at', { ascending: false })
                ]);
                if (pE) throw pE; if (aE) throw aE;
                setProjects((pD as any[]) || []);
                setAssistanceRequests((aD as any[]) || []);
            }
        } catch(error) { console.error("Error fetching initial data", error); }
    }
    fetchInitialData();
    const handleChanges = (payload: PostgresChangesPayload<any>, setState: React.Dispatch<React.SetStateAction<any[]>>, sortField = 'created_at') => {
        const sortByDate = (a: any, b: any) => new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
        if (payload.eventType === 'INSERT') { setState(prev => [payload.new, ...prev].sort(sortByDate)); }
        if (payload.eventType === 'UPDATE') { setState(prev => prev.map(item => item.id === payload.new.id ? payload.new : item).sort(sortByDate)); }
        if (payload.eventType === 'DELETE') { setState(prev => prev.filter(item => item.id !== (payload.old as { id: string }).id)); }
    };
    const projectsChannel = supabase.channel('public:projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => handleChanges(payload, setProjects, 'created_at')).subscribe();
    const usersChannel = supabase.channel('public:clientes').on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload) => {
        if (payload.new.role === 'client') { setClients(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));} 
        else if (payload.new.role === 'admin') { setAdmins(prev => prev.map(a => a.id === payload.new.id ? payload.new : a)); }
    }).subscribe();
    const assistanceChannel = supabase.channel('public:assistanceRequests').on('postgres_changes', { event: '*', schema: 'public', table: 'assistanceRequests' }, (payload) => handleChanges(payload, setAssistanceRequests, 'created_at')).subscribe();
    return () => { supabase.removeChannel(projectsChannel); supabase.removeChannel(usersChannel); supabase.removeChannel(assistanceChannel); };
  }, [userProfile]);
  const getProjectsByClient = useCallback((clientUid: string) => projects.filter(p => p.clientuid === clientUid), [projects]);
  const getProjectById = useCallback((projectId: string) => projects.find(p => p.id === projectId), [projects]);
  const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'files'>, newPhotoFiles: File[] = []) => { const newPhotoInfos = await Promise.all(newPhotoFiles.map(file => uploadFile(file, `projects/${Date.now()}-${sanitizeFilename(file.name)}`, 'project-files'))); const { error } = await supabase.from('projects').insert({ ...projectData, created_at: new Date().toISOString(), files: newPhotoInfos }); if (error) throw error; };
  const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id' | 'files'>>, newPhotoFiles: File[] = []) => { const newPhotoInfos = await Promise.all(newPhotoFiles.map(file => uploadFile(file, `projects/${projectId}/${Date.now()}-${sanitizeFilename(file.name)}`, 'project-files'))); const currentProject = projects.find(p => p.id === projectId); const updatedFiles = [...(currentProject?.files || []), ...newPhotoInfos]; const { error } = await supabase.from('projects').update({ ...data, files: updatedFiles }).eq('id', projectId); if (error) throw error; };
  const deleteFileFromProject = async (projectId: string, file: FileInfo) => { if (!window.confirm('Tem certeza?')) return; const { error: storageError } = await supabase.storage.from('project-files').remove([file.id]); if (storageError) throw storageError; const currentProject = projects.find(p => p.id === projectId); const updatedFiles = currentProject?.files.filter(f => f.id !== file.id) || []; const { error: dbError } = await supabase.from('projects').update({ files: updatedFiles }).eq('id', projectId); if (dbError) throw dbError; };
  const deleteProject = async (projectId: string) => { if (!window.confirm('Tem certeza?')) return; const projectToDelete = projects.find(p => p.id === projectId); if (projectToDelete?.files?.length) { await supabase.storage.from('project-files').remove(projectToDelete.files.map(f => f.id)); } const { error: arError } = await supabase.from('assistanceRequests').delete().eq('projectId', projectId); if(arError) throw arError; const { error: pError } = await supabase.from('projects').delete().eq('id', projectId); if(pError) throw pError; };
  const updateUserInDb = async (uid: string, data: Partial<User>) => { const { error } = await supabase.from('clientes').update(data).eq('id', uid); if (error) throw error; setClients(prev => prev.map(c => c.id === uid ? { ...c, ...data } : c)); };
  const addContractToClient = async (clientUid: string, file: File) => { const newContract = await uploadFile(file, `contracts/${clientUid}/${sanitizeFilename(file.name)}`, 'contracts'); await updateUserInDb(clientUid, { contract: newContract }); };
  const addAssistanceRequest = async (requestData: Omit<AssistanceRequest, 'id' | 'created_at' | 'status' | 'clientName'| 'clientUid' | 'response' | 'photos'>, photos: File[] = []) => { if (!userProfile) throw new Error("Usuário não autenticado"); const photoInfos = await Promise.all(photos.map(photo => uploadFile(photo, `assistance/${userProfile.id}/${Date.now()}-${sanitizeFilename(photo.name)}`, 'project-files'))); const newRequest = { ...requestData, clientUid: userProfile.id, clientName: userProfile.name, created_at: new Date().toISOString(), status: AssistanceStatus.Open, photos: photoInfos, response: '' }; const { error } = await supabase.from('assistanceRequests').insert(newRequest); if(error) throw error; };
  const updateAssistanceRequest = async (requestId: string, data: { status: AssistanceStatus, response: string }) => { const { error } = await supabase.from('assistanceRequests').update(data).eq('id', requestId); if(error) throw error; };
  const deleteUser = async (userId: string) => { if (!window.confirm("Tem certeza?")) return; try { const { error } = await supabase.from('clientes').delete().eq('id', userId); if (error) throw error; setClients(prevClients => prevClients.filter(client => client.id !== userId)); } catch (error: any) { console.error("Erro:", error); alert(`Erro: ${error.message}`); } };

    const value: DataContextType = {
        userProfile, clients, admins, projects, assistanceRequests, loading,
        getProjectsByClient, getProjectById, addProject, updateProject, deleteProject,
        deleteFileFromProject, updateUserInDb, addContractToClient,
        addAssistanceRequest, updateAssistanceRequest, deleteUser
    };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
export const useData = (): DataContextType => { const context = useContext(DataContext); if (context === undefined) throw new Error('useData must be used'); return context; };