// src/types/supabase.ts
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
      profiles: {
        Row: {
          id: string; // uuid
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          role: string | null;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          role?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      projects: {
        Row: {
          id: number; // bigint
          created_at: string;
          title: string | null;
          description: string | null;
          created_by: string | null; // uuid
        };
        Insert: {
          id?: number;
          created_at?: string;
          title?: string | null;
          description?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          title?: string | null;
          description?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      tasks: {
        Row: {
          id: number; // bigint
          created_at: string;
          created_by: string | null; // uuid
          project_id: number | null; // bigint
          title: string | null;
          description: string | null;
          due_date: string | null; // date as ISO string
          priority: Database['public']['Enums']['priorities'] | null;
          status: Database['public']['Enums']['statuses'] | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          created_by?: string | null;
          project_id?: number | null;
          title?: string | null;
          description?: string | null;
          due_date?: string | null;
          priority?: Database['public']['Enums']['priorities'] | null;
          status?: Database['public']['Enums']['statuses'] | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          created_by?: string | null;
          project_id?: number | null;
          title?: string | null;
          description?: string | null;
          due_date?: string | null;
          priority?: Database['public']['Enums']['priorities'] | null;
          status?: Database['public']['Enums']['statuses'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      priorities: 'LOW' | 'MEDIUM' | 'HIGH';
      statuses: 'TO DO' | 'IN PROGRESS' | 'DONE';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
