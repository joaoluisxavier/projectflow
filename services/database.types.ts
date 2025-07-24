export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: "client" | "admin";
          email: string;
          name: string;
          phone: string | null;
          contract: Json | null;
        };
        Insert: {
          id: string;
          role: "client" | "admin";
          email: string;
          name: string;
          phone?: string | null;
          contract?: Json | null;
        };
        Update: Partial<{
          id: string;
          role: "client" | "admin";
          email: string;
          name: string;
          phone: string | null;
          contract: Json | null;
        }>;
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          clientUid: string;
          status: string;
          createdAt: string;
          price: number;
          paymentCondition: string;
          files: Json;
          deliveryDate: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          clientUid: string;
          status: string;
          createdAt: string;
          price: number;
          paymentCondition: string;
          files: Json;
          deliveryDate?: string | null;
        };
        Update: Partial<{
          name: string;
          description: string;
          clientUid: string;
          status: string;
          price: number;
          paymentCondition: string;
          files: Json;
          deliveryDate: string | null;
        }>;
      };
      assistanceRequests: {
        Row: {
          id: string;
          projectId: string;
          clientUid: string;
          clientName: string;
          issue: string;
          createdAt: string;
          status: string;
          response: string | null;
          photos: Json | null;
        };
        Insert: {
          id?: string;
          projectId: string;
          clientUid: string;
          clientName: string;
          issue: string;
          createdAt: string;
          status: string;
          response?: string | null;
          photos?: Json | null;
        };
        Update: Partial<{
          status: string;
          response: string | null;
        }>;
      };
    };
    Views: {
      [key: string]: never;
    };
    Functions: {
      [key: string]: never;
    };
  };
}
