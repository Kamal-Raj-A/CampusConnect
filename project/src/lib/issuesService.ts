import { supabase } from './supabase';
import type { IssueCategory, IssueWithCategory } from './database.types';
import { DEFAULT_CATEGORIES } from '../data/categories';

const LOCAL_STORAGE_ISSUES_KEY = 'campus_connect_local_issues_v1';

export const INITIAL_SAMPLE_ISSUES: IssueWithCategory[] = [
  {
    id: 'sample-issue-1',
    title: 'Water Leakage near Restroom',
    description: 'Pipe leaking heavily on the 2nd floor near the library entrance.',
    category_id: 'cat-maintenance',
    status: 'pending',
    priority: 'high',
    location_lat: 13.028628,
    location_lng: 80.019452,
    location_name: 'Library – 2nd Floor',
    image_url: null,
    reporter_name: 'Campus Student',
    reporter_contact: 'student@saveetha.com',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    resolved_at: null,
    category: DEFAULT_CATEGORIES[0],
  },
  {
    id: 'sample-issue-2',
    title: 'Pathway Light Not Working',
    description: 'Pathway lighting between SEC Main Gate and Car Parking is dark at night.',
    category_id: 'cat-lighting',
    status: 'in_progress',
    priority: 'medium',
    location_lat: 13.02825,
    location_lng: 80.0218,
    location_name: 'SEC Main Gate to Car Parking Pathway',
    image_url: null,
    reporter_name: 'Security Guard',
    reporter_contact: 'security@saveetha.com',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    resolved_at: null,
    category: DEFAULT_CATEGORIES[5],
  },
  {
    id: 'sample-issue-3',
    title: 'Damaged Bench near Tree Canteen',
    description: 'Wooden bench is cracked and needs carpentry repair.',
    category_id: 'cat-infrastructure',
    status: 'resolved',
    priority: 'low',
    location_lat: 13.029453,
    location_lng: 80.018491,
    location_name: 'Tree Canteen',
    image_url: null,
    reporter_name: 'Faculty Member',
    reporter_contact: 'faculty@saveetha.com',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolved_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    category: DEFAULT_CATEGORIES[3],
  }
];

function getStoredLocalIssues(): IssueWithCategory[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ISSUES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_ISSUES_KEY, JSON.stringify(INITIAL_SAMPLE_ISSUES));
      return INITIAL_SAMPLE_ISSUES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_ISSUES;
  }
}

function saveStoredLocalIssues(issues: IssueWithCategory[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ISSUES_KEY, JSON.stringify(issues));
    window.dispatchEvent(new Event('campus_issues_updated'));
  } catch (err) {
    console.error('Failed to save issues to localStorage', err);
  }
}

export async function fetchAllCategories(): Promise<IssueCategory[]> {
  try {
    const { data, error } = await supabase
      .from('issue_categories')
      .select('*')
      .order('name');

    if (!error && data && data.length > 0) {
      return data as IssueCategory[];
    }
  } catch (err) {
    console.warn('Supabase categories fetch failed, using default categories:', err);
  }

  return DEFAULT_CATEGORIES;
}

export async function fetchAllIssues(): Promise<IssueWithCategory[]> {
  const localIssues = getStoredLocalIssues();
  let remoteIssues: IssueWithCategory[] = [];

  try {
    const { data, error } = await supabase
      .from('issues')
      .select(`*, category:issue_categories(*)`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      remoteIssues = data as any;
    }
  } catch (err) {
    console.warn('Supabase issues fetch failed, using local/sample data:', err);
  }

  // Merge unique by ID
  const issueMap = new Map<string, IssueWithCategory>();
  for (const issue of remoteIssues) {
    issueMap.set(issue.id, issue);
  }
  for (const issue of localIssues) {
    if (!issueMap.has(issue.id)) {
      issueMap.set(issue.id, issue);
    }
  }

  const all = Array.from(issueMap.values());
  // Sort descending by created_at
  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return all;
}

export interface CreateIssueInput {
  title: string;
  description: string;
  category_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location_lat: number | null;
  location_lng: number | null;
  location_name: string;
  reporter_name?: string;
  reporter_contact?: string;
  imageFile?: File | null;
}

export async function createNewIssue(input: CreateIssueInput): Promise<{ success: boolean; issue?: IssueWithCategory; error?: any }> {
  let imageUrl: string | null = null;

  // 1. Try uploading image to Supabase storage or convert to data URL
  if (input.imageFile) {
    try {
      const fileExt = input.imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `issue-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, input.imageFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      }
    } catch {
      // If storage fails, convert to data URL for local storage
      imageUrl = await fileToDataUrl(input.imageFile).catch(() => null);
    }
  }

  const newId = 'issue-' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const categories = await fetchAllCategories();
  const matchedCategory = categories.find(c => c.id === input.category_id) || categories[0] || null;

  const newIssue: IssueWithCategory = {
    id: newId,
    title: input.title,
    description: input.description,
    category_id: input.category_id,
    priority: input.priority,
    status: 'pending',
    location_lat: input.location_lat,
    location_lng: input.location_lng,
    location_name: input.location_name,
    image_url: imageUrl,
    reporter_name: input.reporter_name || '',
    reporter_contact: input.reporter_contact || '',
    created_at: now,
    updated_at: now,
    resolved_at: null,
    category: matchedCategory,
  };

  // 2. Try inserting into Supabase
  try {
    const { data, error } = await (supabase.from('issues') as any).insert([{
      title: input.title,
      description: input.description,
      category_id: input.category_id,
      priority: input.priority,
      status: 'pending',
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      location_name: input.location_name,
      image_url: imageUrl,
      reporter_name: input.reporter_name || '',
      reporter_contact: input.reporter_contact || '',
    }]).select(`*, category:issue_categories(*)`);

    if (!error && data && data.length > 0) {
      newIssue.id = data[0].id;
      if (data[0].category) newIssue.category = data[0].category;
    }
  } catch (err) {
    console.warn('Supabase insert failed, saving locally:', err);
  }

  // 3. Always store locally so it shows immediately
  const localIssues = getStoredLocalIssues();
  saveStoredLocalIssues([newIssue, ...localIssues]);

  return { success: true, issue: newIssue };
}

export async function updateIssueStatus(issueId: string, updates: { title?: string; status?: 'pending' | 'in_progress' | 'resolved' | 'closed'; priority?: 'low' | 'medium' | 'high' | 'critical' }): Promise<boolean> {
  const now = new Date().toISOString();
  
  // Try Supabase update
  try {
    await (supabase.from('issues') as any)
      .update({
        ...updates,
        updated_at: now,
        ...(updates.status === 'resolved' ? { resolved_at: now } : {}),
      })
      .eq('id', issueId);
  } catch (err) {
    console.warn('Supabase update failed:', err);
  }

  // Update in local storage
  const localIssues = getStoredLocalIssues();
  const updated = localIssues.map(i => {
    if (i.id === issueId) {
      return {
        ...i,
        ...updates,
        updated_at: now,
        resolved_at: updates.status === 'resolved' ? now : i.resolved_at,
      };
    }
    return i;
  });
  saveStoredLocalIssues(updated);
  return true;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
