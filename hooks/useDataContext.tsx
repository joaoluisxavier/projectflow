// ----- INÍCIO DO CÓDIGO PARA useDataContext.tsx -----
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Client, Project, AssistanceRequest, Admin, AssistanceStatus, User, FileInfo } from '../types';
import { AuthUser } from '@supabase/supabase-js';

const sanitizeFilename = (filename: string): string => filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s.-]/g, '').trim().replace(/\s+/g, '-');
const uploadFile = async (file: File, path: string, bucket: string): Promise<FileInfo> => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true }); if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path); const fileType = file.type.startsWith('image/') ? 'photo' : (file.type === 'application/pdf' ? 'contract' : 'report');
    return { id: data.path, name: file.name, url: publicUrl, type: fileType as 'photo' | 'contract' | 'report', uploadedAt: new Date().toISOString() };
};

interface DataContextType {
  userProfile: User | null; clients: Client[]; admins: Admin[]; projects: Project[]; assistanceRequests: AssistanceRequest[]; loading: boolean;
  getProjectsByClient: (clientUid: string) => Project[]; getProjectById: (projectId: string) => Project | undefined; addProject: (projectData: Omit<Project, 'id' | 'created_at' | 'files'>, newPhotoFiles?: File[]) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Omit<Project, 'id' | 'files'>>, newPhotoFiles?: File[]) => Promise<void>; deleteProject: (projectId: string) => Promise<void>; deleteFileFromProject: (projectId: string, file: FileInfo) => Promise<void>;
  updateUserInDb: (uid: string, data: Partial<User>) => Promise<void>; addContractToClient: (clientUid: string, file: File) => Promise<void>;
  addAssistanceRequest: (request: Omit<AssistanceRequest, 'id' | 'created_at' | 'status' | 'clientName' | 'clientUid' | 'response' | 'photos'>, photos: File[]) => Promise<void>; updateAssistanceRequest: (requestId: string, data: { status: AssistanceStatus, response: string }) => Promise<void>;
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

  const fetchUserAndData = async (user: AuthUser | null) => {
    setLoading(true);
    if (user) {
        try {
            const { data: profile, error } = await supabase.from('clientes').select('*').eq('id', user.id).single(); 
            if (error) throw error;
            setUserProfile(profile as User);
            if (profile.role === 'admin') {
                const [{ data: pD }, { data: uD }, { data: aD }] = await Promise.all([supabase.from('projects').select('*'), supabase.from('clientes').select('*'), supabase.from('assistanceRequests').select('*')]);
                setProjects(pD || []); setClients((uD || []).filter(u => u.role === 'client') as Client[]); setAdmins((uD || []).filter(u => u.role === 'admin') as Admin[]); setAssistanceRequests(aD || []);
            } else {
                const [{ data: pD }, { data: aD }] = await Promise.all([supabase.from('projects').select('*').eq('clientuid', user.id), supabase.from('assistanceRequests').select('*').eq('clientUid', user.id)]);
                setProjects(pD || []); setAssistanceRequests(aD || []);
            }
        } catch (error) { console.error("Erro ao buscar dados do usuário, forçando logout.", error); await supabase.auth.signOut(); setUserProfile(null); }
    } else { setUserProfile(null); setProjects([]); setClients([]); setAdmins([]); setAssistanceRequests([]); }
    setLoading(false);
  };

  useEffect(() => { const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { fetchUserAndData(session?.user ?? null); }); return () => { subscription.unsubscribe(); }; }, []);
  const getProjectsByClient = useCallback((clientUid: string) => projects.filter(p => p.clientuid === clientUid), [projects]);
  const getProjectById = useCallback((projectId: string) => projects.find(p => p.id === projectId), [projects]);
  const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'files'>, newPhotoFiles: File[] = []) => { const newPhotos = await Promise.all(newPhotoFiles.map(f => uploadFile(f, `projects/${Date.now()}-${sanitizeFilename(f.name)}`, 'project-files'))); await supabase.from('projects').insert({ ...projectData, created_at: new Date().toISOString(), files: newPhotos }); };
  const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id' | 'files'>>, newPhotoFiles: File[] = []) => { const newPhotos = await Promise.all(newPhotoFiles.map(f => uploadFile(f, `projects/${projectId}/${Date.now()}-${sanitizeFilename(f.name)}`, 'project-files'))); const currentProject = projects.find(p => p.id === projectId); const updatedFiles = [...(currentProject?.files || []), ...newPhotos]; await supabase.from('projects').update({ ...data, files: updatedFiles }).eq('id', projectId); };
  const deleteFileFromProject = async (projectId: string, file: FileInfo) => { await supabase.storage.from('project-files').remove([file.id]); const p = projects.find(pr => pr.id === projectId); const updatedFiles = p?.files.filter(f => f.id !== file.id) || []; await supabase.from('projects').update({ files: updatedFiles }).eq('id', projectId); };
  const deleteProject = async (projectId: string) => { const p = projects.find(pr => pr.id === projectId); if (p?.files?.length) { await supabase.storage.from('project-files').remove(p.files.map(f => f.id)); } await supabase.from('assistanceRequests').delete().eq('projectId', projectId); await supabase.from('projects').delete().eq('id', projectId); };
  const updateUserInDb = async (uid: string, data: Partial<User>) => await supabase.from('clientes').update(data).eq('id', uid);
  const addContractToClient = async (clientUid: string, file: File) => { const newContract = await uploadFile(file, `contracts/${clientUid}/${sanitizeFilename(file.name)}`, 'contracts'); await updateUserInDb(clientUid, { contract: newContract }); };
  const addAssistanceRequest = async (requestData: Omit<AssistanceRequest, 'id' | 'created_at' | 'status' | 'clientName'| 'clientUid' | 'response' | 'photos'>, photos: File[] = []) => { if (!userProfile) return; const photoInfos = await Promise.all(photos.map(p => uploadFile(p, `assistance/${userProfile.id}/${Date.now()}-${sanitizeFilename(p.name)}`, 'project-files'))); await supabase.from('assistanceRequests').insert({ ...requestData, clientUid: userProfile.id, clientName: userProfile.name, created_at: new Date().toISOString(), status: AssistanceStatus.Open, photos: photoInfos, response: '' }); };
  const updateAssistanceRequest = async (requestId: string, data: { status: AssistanceStatus, response: string }) => await supabase.from('assistanceRequests').update(data).eq('id', requestId);
  const deleteUser = async (userId: string) => await supabase.from('clientes').delete().eq('id', userId);
  const value = {userProfile, clients, admins, projects, assistanceRequests, loading, getProjectsByClient, getProjectById, addProject, updateProject, deleteProject, deleteFileFromProject, updateUserInDb, addContractToClient, addAssistanceRequest, updateAssistanceRequest, deleteUser};
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
export const useData = (): DataContextType => { const context = useContext(DataContext); if (!context) throw new Error('useData must be used within a DataProvider'); return context; };
// ----- FIM DO CÓDIGO PARA useDataContext.tsx -----