/**
 * LocalStorage-based authentication for direct processing mode
 * When backend is not connected, use this for user management
 */

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  password?: string; // Hashed in real implementation
  role?: string;
  expertise?: string[];
  createdAt: string;
}

const USERS_STORAGE_KEY = 'videowise_local_users';
const CURRENT_USER_KEY = 'videowise_current_user';

export const localStorageAuth = {
  /**
   * Check if user exists
   */
  userExists(email: string): boolean {
    const users = this.getAllUsers();
    return users.some(u => u.email === email);
  },

  /**
   * Get all users
   */
  getAllUsers(): LocalUser[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  /**
   * Save user
   */
  saveUser(user: LocalUser): void {
    const users = this.getAllUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  /**
   * Get user by email
   */
  getUserByEmail(email: string): LocalUser | null {
    const users = this.getAllUsers();
    return users.find(u => u.email === email) || null;
  },

  /**
   * Verify password (simple check - in production, use proper hashing)
   */
  verifyPassword(email: string, password: string): boolean {
    const user = this.getUserByEmail(email);
    if (!user) return false;
    // Simple check - in production, use bcrypt or similar
    return user.password === password; // This is just for demo
  },

  /**
   * Set current user
   */
  setCurrentUser(user: LocalUser): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  /**
   * Get current user
   */
  getCurrentUser(): LocalUser | null {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  /**
   * Clear current user
   */
  clearCurrentUser(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  /**
   * Create user account
   */
  createAccount(name: string, email: string, password: string, role?: string, expertise?: string[]): LocalUser {
    if (this.userExists(email)) {
      throw new Error('User already exists');
    }

    const user: LocalUser = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password, // In production, hash this
      role: role || 'user',
      expertise: expertise || [],
      createdAt: new Date().toISOString(),
    };

    this.saveUser(user);
    return user;
  },

  /**
   * Login user
   */
  login(email: string, password: string): LocalUser {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (!this.verifyPassword(email, password)) {
      throw new Error('Invalid password');
    }

    this.setCurrentUser(user);
    return user;
  },
};




