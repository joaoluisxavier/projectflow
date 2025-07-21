import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Client, Project, AssistanceRequest, Admin, AssistanceStatus, User, FileInfo } from '../types';
import { Session, User as AuthUser, PostgresChangesPayload } from '@supabase/supabase-js';

// ... (o início do arquivo, uploadFile, sanitizeFilename, etc. continuam iguais) ...
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
  authUser: AuthUser | null;
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
  addUserToDb: (user: User) => Promise<void>;
  updateUserInDb: (uid: string, data: Partial<User>) => Promise<void>;
  addContractToClient: (clientUid: string, file: File) => Promise<void>;
  addAssistanceRequest: (request: Omit<AssistanceRequest, 'id' | 'created_at' | 'status' | 'clientName' | 'clientUid' | 'response' | 'photos'>, photos: File[]) => Promise<void>;
  updateAssistanceRequest: (requestId: string, data: { status: AssistanceStatus, response: string }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // ... (toda a parte de states e useEffects permanece igual) ...
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setAuthUser(session?.user ?? null);
            setLoading(false);
        }
        checkSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuthUser(session?.user ?? null);
            if (_event === 'SIGNED_OUT') {
                setUserProfile(null); setProjects([]); setClients([]); setAdmins([]); setAssistanceRequests([]);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!authUser) { setUserProfile(null); return; }
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.from('clientes').select('*').eq('id', authUser.id).single();
                if (error) throw error;
                setUserProfile(data as User);
            } catch (error) { console.error("Error fetching user profile", error); setUserProfile(null); } finally { setLoading(false); }
        }
        fetchUserProfile();
    }, [authUser]);
    
    useEffect(() => {
    if (!userProfile) return;
    setLoading(true);
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
        } catch(error) { console.error("Error fetching initial data", error); } finally { setLoading(false); }
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
        if (payload.new.role === 'client') { handleChanges(payload, setClients, 'created_at'); } else if (payload.new.role === 'admin') { handleChanges(payload, setAdmins, 'created_at'); }
    }).subscribe();
    const assistanceChannel = supabase.channel('public:assistanceRequests').on('postgres_changes', { event: '*', schema: 'public', table: 'assistanceRequests' }, (payload) => handleChanges(payload, setAssistanceRequests, 'created_at')).subscribe();
    return () => { supabase.removeChannel(projectsChannel); supabase.removeChannel(usersChannel); supabase.removeChannel(assistanceChannel); };
  }, [userProfile]);

    const getProjectsByClient = useCallback((clientUid: string) => projects.filter(p => p.clientuid === clientUid), [projects]);
    const getProjectById = useCallback((projectId: string) => projects.find(p => p.id === projectId), [projects]);

    const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'files'>, newPhotoFiles: File[] = []) => {
        const newPhotoInfos = await Promise.all(newPhotoFiles.map(file => uploadFile(file, `projects/${Date.now()}-${sanitizeFilename(file.name)}`, 'project-files')));
        const { error } = await supabase.from('projects').insert({ ...projectData, created_at: new Date().toISOString(), files: newPhotoInfos });
        if (error) throw error;
    };

    const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id' | 'files'>>, newPhotoFiles: File[] = []) => {
        const newPhotoInfos = await Promise.all(newPhotoFiles.map(file => uploadFile(file, `projects/${projectId}/${Date.now()}-${sanitizeFilename(file.name)}`, 'project-files')));
        const currentProject = projects.find(p => p.id === projectId);
        const updatedFiles = [...(currentProject?.files || []), ...newPhotoInfos];
        const { error } = await supabase.from('projects').update({ ...data, files: updatedFiles }).eq('id', projectId);
        if (error) throw error;
    };

    const deleteProject = async (projectId: string) => {
       if (!window.confirm('Tem certeza que deseja excluir este projeto? Esta ação é irreversível.')) return;
        const projectToDelete = projects.find(p => p.id === projectId);
        if (projectToDelete?.files && projectToDelete.files.length > 0) {
          const filePaths = projectToDelete.files.map(file => file.id);
          await supabase.storage.from('project-files').remove(filePaths);
        }
        const { error: arError } = await supabase.from('assistanceRequests').delete().eq('projectId', projectId);
        if(arError) throw arError;
        const { error: projectError } = await supabase.from('projects').delete().eq('id', projectId);
        if(projectError) throw projectError;
    };
  
    const addUserToDb = async (user: User) => { const { error } = await supabase.from("clientes").insert(user as any); if (error) throw error; };

    const deleteFileFromProject = async (projectId: string, file: FileInfo) => {
        if (!window.confirm('Tem certeza que deseja excluir este arquivo?')) return;
        const { error: storageError } = await supabase.storage.from('project-files').remove([file.id]);
        if (storageError) throw storageError;
        const currentProject = projects.find(p => p.id === projectId);
        const updatedFiles = currentProject?.files.filter(f => f.id !== file.id) || [];
        const { error: dbError } = await supabase.from('projects').update({ files: updatedFiles }).eq('id', projectId);
        if (dbError) throw dbError;
    };
    
    // CORRIGIDO: Esta função está mais robusta agora.
    const updateUserInDb = async (uid: string, data: Partial<User>) => {
        const { error } = await supabase.from('clientes').update(data).eq('id', uid);
        if (error) throw error;
        // Atualiza o estado local para refletir a mudança imediatamente
        setClients(prev => prev.map(c => c.id === uid ? { ...c, ...data } : c));
    };

    // CORRIGIDO: Agora usa a nova 'uploadFile' com o nome do bucket.
    const addContractToClient = async (clientUid: string, file: File) => {
        const newContract = await uploadFile(file, `contracts/${clientUid}/${sanitizeFilename(file.name)}`, 'contracts');
        await updateUserInDb(clientUid, { contract: newContract });
    };

    const addAssistanceRequest = async (requestData: Omit<AssistanceRequest, 'id' | 'created_at' | 'status' | 'clientName'| 'clientUid' | 'response' | 'photos'>, photos: File[] = []) => {
        if (!userProfile) throw new Error("User not authenticated");
        const photoInfos = await Promise.all(photos.map(photo => uploadFile(photo, `assistance/${userProfile.id}/${Date.now()}-${sanitizeFilename(photo.name)}`, 'project-files')));
        const newRequest = { ...requestData, clientUid: userProfile.id, clientName: userProfile.name, created_at: new Date().toISOString(), status: AssistanceStatus.Open, photos: photoInfos, response: '' };
        const { error } = await supabase.from('assistanceRequests').insert(newRequest);
        if(error) throw error;
    };

    const updateAssistanceRequest = async (requestId: string, data: { status: AssistanceStatus, response: string }) => { const { error } = await supabase.from('assistanceRequests').update(data).eq('id', requestId); if(error) throw error; };

    const deleteUser = async (userId: string) => {
      if (!window.confirm("Tem certeza que deseja excluir este cliente? Esta ação é irreversível.")) return;
      try {
          // A exclusão do 'auth.user' precisa ser feita no backend (Edge Function)
          const { error } = await supabase.from('clientes').delete().eq('id', userId);
          if (error) throw error;
          setClients(prevClients => prevClients.filter(client => client.id !== userId));
      } catch (error: any) {
          console.error("Erro ao deletar cliente:", error);
          alert(`Não foi possível excluir o cliente: ${error.message}`);
      }
    };
  

    const value: DataContextType = {
        // ... (resto das propriedades)
        authUser, userProfile, clients, admins, projects, assistanceRequests, loading,
        getProjectsByClient, getProjectById, addProject, updateProject, deleteProject,
        deleteFileFromProject, addUserToDb, updateUserInDb, addContractToClient,
        addAssistanceRequest, updateAssistanceRequest, deleteUser
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};