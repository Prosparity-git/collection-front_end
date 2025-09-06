import { API_BASE_URL } from '../client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
  user_name: string;
  user_role: string;
}

export interface User {
  id: number;
  name: string;
  user_name: string;
  email: string;
  role: string;
  status: string;
}

export class AuthService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.email); // Backend expects 'username' field but we send email
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    const authData: AuthResponse = await response.json();
    
    // Store token and user info
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('user_id', authData.user_id.toString());
    localStorage.setItem('user_name', authData.user_name);
    localStorage.setItem('user_role', authData.user_role);
    localStorage.setItem('token_expires_at', (Date.now() + authData.expires_in * 1000).toString());

    return authData;
  }

  static async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_role');
      localStorage.removeItem('token_expires_at');
    }
  }

  static async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const userData = await response.json();
    
    // Map backend response to frontend User interface
    // Backend returns: {id, name, email, role} (no user_name field)
    const user: User = {
      id: userData.id,
      name: userData.name || '',
      user_name: userData.name || 'User', // Use 'name' as 'user_name' since backend doesn't provide it
      email: userData.email || '',
      role: userData.role || '',
      status: userData.status || 'active'
    };

    return user;
  }

  static isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > parseInt(expiresAt)) {
      this.logout();
      return false;
    }

    return true;
  }

  static getCurrentUserRole(): string | null {
    return localStorage.getItem('user_role');
  }

  static getCurrentUserName(): string | null {
    return localStorage.getItem('user_name');
  }

  static getCurrentUserId(): number | null {
    const id = localStorage.getItem('user_id');
    return id ? parseInt(id) : null;
  }

  static isAdmin(): boolean {
    const role = this.getCurrentUserRole();
    return role === 'admin';
  }

  static isRM(): boolean {
    const role = this.getCurrentUserRole();
    return role === 'RM';
  }

  static isTL(): boolean {
    const role = this.getCurrentUserRole();
    return role === 'TL';
  }

  static canViewPendingApprovals(): boolean {
    return this.isAdmin();
  }
}
