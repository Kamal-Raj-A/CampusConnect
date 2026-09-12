export const ADMIN_EMAIL = 'kamalraj3106@gmail.com';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department?: string;
  joinedAt: string;
}

const AUTH_STORAGE_KEY = 'campus_connect_active_user_v1';
const USERS_STORAGE_KEY = 'campus_connect_registered_users_v1';

export function isUserAdmin(user: AuthUser | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'admin';
}

function getRegisteredUsers(): Record<string, { name: string; password?: string }> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {
      [ADMIN_EMAIL.toLowerCase()]: { name: 'Kamal Raj (Admin)' },
      'student@saveetha.edu': { name: 'Student User' },
    };
  } catch {
    return {};
  }
}

function saveRegisteredUser(email: string, name: string) {
  try {
    const users = getRegisteredUsers();
    users[email.toLowerCase()] = { name };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save user', err);
  }
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const user: AuthUser = JSON.parse(raw);
    // Enforce role consistency with ADMIN_EMAIL
    if (user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.role = 'admin';
    }
    return user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null): void {
  try {
    if (user) {
      if (user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        user.role = 'admin';
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('campus_auth_state_changed', { detail: user }));
  } catch (err) {
    console.error('Failed to set current user', err);
  }
}

export async function loginUser(email: string, _password?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const registered = getRegisteredUsers();
  const existing = registered[normalizedEmail];
  const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();

  const user: AuthUser = {
    id: 'usr-' + Math.random().toString(36).substring(2, 9),
    name: existing?.name || (isAdmin ? 'Kamal Raj' : normalizedEmail.split('@')[0]),
    email: normalizedEmail,
    role: isAdmin ? 'admin' : 'user',
    joinedAt: new Date().toISOString(),
  };

  saveRegisteredUser(normalizedEmail, user.name);
  setCurrentUser(user);
  return { success: true, user };
}

export async function registerUser(name: string, email: string, _password?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!name.trim()) {
    return { success: false, error: 'Name is required' };
  }
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Valid email is required' };
  }

  const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
  const user: AuthUser = {
    id: 'usr-' + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    email: normalizedEmail,
    role: isAdmin ? 'admin' : 'user',
    joinedAt: new Date().toISOString(),
  };

  saveRegisteredUser(normalizedEmail, user.name);
  setCurrentUser(user);
  return { success: true, user };
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function quickLoginAdmin(): AuthUser {
  const adminUser: AuthUser = {
    id: 'admin-kamalraj',
    name: 'Kamal Raj',
    email: ADMIN_EMAIL,
    role: 'admin',
    department: 'Campus Administration',
    joinedAt: new Date().toISOString(),
  };
  saveRegisteredUser(ADMIN_EMAIL, adminUser.name);
  setCurrentUser(adminUser);
  return adminUser;
}

export function quickLoginStudent(): AuthUser {
  const studentUser: AuthUser = {
    id: 'student-demo',
    name: 'Saveetha Student',
    email: 'student@saveetha.edu',
    role: 'user',
    department: 'Computer Science & Engineering',
    joinedAt: new Date().toISOString(),
  };
  saveRegisteredUser('student@saveetha.edu', studentUser.name);
  setCurrentUser(studentUser);
  return studentUser;
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AuthUser | null>;
    callback(custom.detail ?? getCurrentUser());
  };

  window.addEventListener('campus_auth_state_changed', handler);
  return () => {
    window.removeEventListener('campus_auth_state_changed', handler);
  };
}
