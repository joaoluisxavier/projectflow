export enum ProjectStatus {
  PaymentMade = 'Pagamento Feito',
  MeasurementDone = 'Medida Fina Feita',
  TechDrawingsApproved = 'Caderno Técnico Aprovado',
  ProductionStarted = 'Produção Iniciada',
  DeliveryScheduled = 'Entrega Agendada',
  DeliveryMade = 'Entrega Feita',
  AssemblyFinished = 'Montagem Finalizada',
  QualityControl = 'Controle de Qualidade',
  Completed = 'Concluído',
}

export interface FileInfo {
  id: string;
  name: string;
  url: string;
  type: 'contract' | 'report' | 'photo';
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientuid: string;
  status: ProjectStatus;
  created_at: string;
  price: number;
  payment_condition: string;
  files: FileInfo[];
  delivery_date?: string | null;
}

export interface User {
  id: string;
  role: 'client' | 'admin';
  email: string;
  name: string;
  phone?: string;
  contract?: FileInfo;
}

export type Client = User & { role: 'client'; phone: string };
export type Admin = User & { role: 'admin' };


export enum AssistanceStatus {
    Open = 'Aberto',
    InProgress = 'Em Andamento',
    Closed = 'Fechado',
}

// CORRIGIDO: Esta interface agora está 100% correta e alinhada
export interface AssistanceRequest {
  id: string;
  created_at: string;
  clientUid: string; // Já estava certo no BD, vamos manter
  projectId: string;
  clientName: string;
  description: string; // <-- Padronizado aqui
  status: AssistanceStatus;
  photos?: FileInfo[];
  response?: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
}