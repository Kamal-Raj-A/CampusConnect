import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  X,
  Save,
  CheckCircle2,
  Shield,
  Lock,
  LogIn,
  UserCheck,
} from 'lucide-react';
import type { IssueWithCategory, IssueCategory } from '../lib/database.types';
import { fetchAllIssues, fetchAllCategories, updateIssueStatus } from '../lib/issuesService';
import type { AuthUser } from '../lib/authService';
import { isUserAdmin, ADMIN_EMAIL } from '../lib/authService';

interface IssueDashboardProps {
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
}

export default function IssueDashboard({ currentUser, onOpenAuth }: IssueDashboardProps) {
  const [issues, setIssues] = useState<IssueWithCategory[]>([]);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<IssueWithCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my'>('all');
  const [loading, setLoading] = useState(true);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = isUserAdmin(currentUser);

  useEffect(() => {
    fetchData();

    const handleUpdate = () => {
      fetchData();
    };

    window.addEventListener('campus_issues_updated', handleUpdate);
    return () => {
      window.removeEventListener('campus_issues_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, searchTerm, statusFilter, categoryFilter, scopeFilter, currentUser]);

  const fetchData = async () => {
    setLoading(true);
    const [fetchedIssues, fetchedCategories] = await Promise.all([
      fetchAllIssues(),
      fetchAllCategories(),
    ]);

    setIssues(fetchedIssues);
    setCategories(fetchedCategories);
    setLoading(false);
  };

  const isUserOwner = (issue: IssueWithCategory): boolean => {
    if (!currentUser) return false;
    const userEmail = currentUser.email.toLowerCase();
    const userName = currentUser.name.toLowerCase();
    return Boolean(
      (issue.reporter_contact && issue.reporter_contact.toLowerCase() === userEmail) ||
      (issue.reporter_name && issue.reporter_name.toLowerCase() === userName)
    );
  };

  const canEditIssue = (issue: IssueWithCategory): boolean => {
    if (isAdmin) return true;
    return isUserOwner(issue);
  };

  const filterIssues = () => {
    let filtered = [...issues];

    // Filter by Scope: All vs My Reported Issues
    if (scopeFilter === 'my') {
      if (currentUser) {
        filtered = filtered.filter((i) => isUserOwner(i));
      } else {
        filtered = [];
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.category_id === categoryFilter);
    }

    setFilteredIssues(filtered);
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      pending: 'bg-red-100 text-red-800 border-red-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return classes[status as keyof typeof classes] || classes.pending;
  };

  const getPriorityBadgeClass = (priority: string) => {
    const classes = {
      low: 'bg-blue-50 text-blue-700 border-blue-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200',
    };
    return classes[priority as keyof typeof classes] || classes.medium;
  };

  const handleEditIssue = (issue: IssueWithCategory) => {
    setEditingIssueId(issue.id);
    setEditingTitle(issue.title);
  };

  const handleStatusChange = async (issueId: string, newStatus: any) => {
    if (!isAdmin) {
      alert('Access Denied: Only the administrator (kamalraj3106@gmail.com) has permission to change or resolve issue status.');
      return;
    }

    setUpdatingId(issueId);
    try {
      await updateIssueStatus(issueId, { status: newStatus });
      await fetchData();
    } catch (err) {
      console.error('Failed to change status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!editingIssueId || !editingTitle.trim()) return;

    setUpdatingId(editingIssueId);
    try {
      await updateIssueStatus(editingIssueId, { title: editingTitle.trim() });
      setEditingIssueId(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIssueId(null);
    setEditingTitle('');
  };

  const myIssuesCount = currentUser
    ? issues.filter((i) => isUserOwner(i)).length
    : 0;

  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === 'pending').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* ROLE / STATUS BANNER */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        {isAdmin ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-sm font-extrabold text-purple-900 flex items-center gap-2">
                <span>Administrator Mode</span>
                <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-mono">
                  {ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-purple-700">
                You have full authority to update status (Resolved / In Progress), edit any report, and manage campus health.
              </p>
            </div>
          </div>
        ) : currentUser ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>Signed in as <strong>{currentUser.name}</strong></span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  User Role
                </span>
              </div>
              <p className="text-xs text-gray-500">
                You can view all campus issues and update only the issues you reported. Issue resolution is managed by Admin.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Lock size={15} className="text-gray-400" />
              <span>Viewing in Guest Mode. Sign in to manage your reported issues or access Admin tools.</span>
            </div>
            <button
              onClick={onOpenAuth}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Issues</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl">
              🔴
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">In Progress</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
              🟡
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Resolved</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.resolved}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & LIST CARD */}
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
        {/* VIEW SCOPE TABS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                scopeFilter === 'all'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Campus Issues ({issues.length})
            </button>

            <button
              onClick={() => {
                if (!currentUser && onOpenAuth) {
                  onOpenAuth();
                } else {
                  setScopeFilter('my');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'my'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>My Reported Issues</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full">
                {myIssuesCount}
              </span>
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Showing <strong>{filteredIssues.length}</strong> of <strong>{issues.length}</strong> reports
          </div>
        </div>

        {/* SEARCH AND DROPDOWN FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by title, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-700 font-medium outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-700 font-medium outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-500">Loading issues...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-base font-semibold text-gray-700">
              {scopeFilter === 'my' ? "You haven't reported any issues yet." : 'No issues found'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {scopeFilter === 'my'
                ? 'Switch to "All Campus Issues" or click "Report Issue" to submit your first report.'
                : 'Try adjusting your search terms or filter selection.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredIssues.map((issue) => {
              const isOwner = isUserOwner(issue);
              const editable = canEditIssue(issue);

              return (
                <div
                  key={issue.id}
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    editingIssueId === issue.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-md'
                      : isOwner
                      ? 'border-blue-200 bg-blue-50/20 hover:border-blue-300 hover:shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                  }`}
                >
                  <div>
                    {editingIssueId === issue.id ? (
                      <div className="mb-3">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Edit Title</label>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-gray-900 leading-snug break-words">
                            {issue.title}
                          </h3>
                          {isOwner && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.2 rounded-full">
                              My Report
                            </span>
                          )}
                        </div>

                        {editable && (
                          <button
                            onClick={() => handleEditIssue(issue)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-2 py-1 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                      {issue.description}
                    </p>

                    {/* BADGES & STATUS SWITCHER */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {issue.category && (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${issue.category.color}15`,
                            color: issue.category.color,
                            border: `1px solid ${issue.category.color}40`,
                          }}
                        >
                          {issue.category.name}
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
                          issue.priority
                        )}`}
                      >
                        {issue.priority.toUpperCase()}
                      </span>

                      {/* Status Dropdown (ADMIN ONLY) vs Read-only (USERS) */}
                      <div className="ml-auto">
                        {isAdmin ? (
                          <select
                            value={issue.status}
                            disabled={updatingId === issue.id}
                            onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                            title="Admin: Change issue resolution status"
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none shadow-xs ${getStatusBadgeClass(
                              issue.status
                            )}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        ) : (
                          <div
                            className="flex items-center gap-1 cursor-default"
                            title="Resolution status can only be updated by Admin"
                          >
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(
                                issue.status
                              )}`}
                            >
                              {issue.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <Lock size={12} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {issue.image_url && (
                      <img
                        src={issue.image_url}
                        alt="Issue Photo"
                        className="w-full h-44 object-cover rounded-xl mb-3 border border-gray-100"
                      />
                    )}
                  </div>

                  <div>
                    {editingIssueId !== issue.id ? (
                      <div className="space-y-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                        {issue.location_name && (
                          <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                            <MapPin size={13} className="shrink-0" />
                            <span className="truncate">{issue.location_name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="shrink-0 text-gray-400" />
                          <span>
                            {new Date(issue.created_at).toLocaleDateString()} at{' '}
                            {new Date(issue.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {issue.reporter_name && (
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="shrink-0 text-gray-400" />
                            <span>
                              Reported by: <strong>{issue.reporter_name}</strong>
                              {issue.reporter_contact ? ` (${issue.reporter_contact})` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-blue-200">
                        <button
                          onClick={handleSaveChanges}
                          disabled={updatingId === issue.id}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
                        >
                          <Save size={14} />
                          {updatingId === issue.id ? 'Saving...' : 'Save Title'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={updatingId === issue.id}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
