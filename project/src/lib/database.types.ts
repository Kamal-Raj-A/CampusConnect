export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      issue_categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          icon?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          icon?: string;
          created_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          title: string;
          description: string;
          category_id: string | null;
          status: 'pending' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high' | 'critical';
          location_lat: number | null;
          location_lng: number | null;
          location_name: string | null;
          image_url: string | null;
          reporter_name: string | null;
          reporter_contact: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category_id?: string | null;
          status?: 'pending' | 'in_progress' | 'resolved' | 'closed';
          priority?: 'low' | 'medium' | 'high' | 'critical';
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          image_url?: string | null;
          reporter_name?: string | null;
          reporter_contact?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category_id?: string | null;
          status?: 'pending' | 'in_progress' | 'resolved' | 'closed';
          priority?: 'low' | 'medium' | 'high' | 'critical';
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          image_url?: string | null;
          reporter_name?: string | null;
          reporter_contact?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
    };
  };
}

export type IssueCategory = Database['public']['Tables']['issue_categories']['Row'];
export type Issue = Database['public']['Tables']['issues']['Row'];
export type IssueWithCategory = Issue & { category: IssueCategory | null };
