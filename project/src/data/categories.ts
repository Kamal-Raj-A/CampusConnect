import type { IssueCategory } from '../lib/database.types';

export const DEFAULT_CATEGORIES: IssueCategory[] = [
  {
    id: 'cat-maintenance',
    name: 'Maintenance',
    color: '#EF4444',
    icon: 'wrench',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'cat-safety',
    name: 'Safety',
    color: '#F59E0B',
    icon: 'alert-triangle',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'cat-cleanliness',
    name: 'Cleanliness',
    color: '#10B981',
    icon: 'trash-2',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'cat-infrastructure',
    name: 'Infrastructure',
    color: '#3B82F6',
    icon: 'building',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'cat-technology',
    name: 'Technology',
    color: '#8B5CF6',
    icon: 'laptop',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'cat-lighting',
    name: 'Lighting',
    color: '#F97316',
    icon: 'lightbulb',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'cat-other',
    name: 'Other',
    color: '#6B7280',
    icon: 'help-circle',
    created_at: '2025-01-01T00:00:00Z',
  },
];
