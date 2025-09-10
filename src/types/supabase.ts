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
          role: Database['public']['Enums']['roles'] | null;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          role?: Database['public']['Enums']['roles'] | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          role?: Database['public']['Enums']['roles'] | null;
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
          due_date: string | null; // ISO string
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
      roles: 'User' | 'Project manager' | 'Administrator';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ----------------------------------------------------
// Utility helpers for easier imports
// ----------------------------------------------------
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type Priority = Database['public']['Enums']['priorities'];
export type Status = Database['public']['Enums']['statuses'];
export type Role = Database['public']['Enums']['roles'];
