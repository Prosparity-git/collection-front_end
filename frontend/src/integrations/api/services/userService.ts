import { API_BASE_URL, getAuthHeaders } from '../client';

// Types for user data
export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role: string;
  branch?: string;
}

export interface UserOut {
  id: number;
  email: string;
  full_name: string;
  role: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// User Service
export class UserService {
  // POST /api/v1/users/ - Create a new user
  static async createUser(user: UserCreate): Promise<UserOut> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.status}`);
    }

    return await response.json();
  }

  // POST /api/v1/users/login - Login user
  static async loginUser(email: string, password: string): Promise<UserOut> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Failed to login: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/users/{user_id} - Get user by ID
  static async getUserById(userId: number): Promise<UserOut> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/users/ - Get all users
  static async getAllUsers(skip: number = 0, limit: number = 10): Promise<UserOut[]> {
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/users/?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    return await response.json();
  }

  // Helper method to authenticate user
  static async authenticateUser(email: string, password: string): Promise<UserOut | null> {
    try {
      return await this.loginUser(email, password);
    } catch (error) {
      return null;
    }
  }

  // Helper method to check if user exists
  static async userExists(email: string): Promise<boolean> {
    try {
      const users = await this.getAllUsers(0, 1000);
      return users.some(user => user.email === email);
    } catch (error) {
      return false;
    }
  }

  // Helper method to get users by role
  static async getUsersByRole(role: string): Promise<UserOut[]> {
    try {
      const users = await this.getAllUsers(0, 1000);
      return users.filter(user => user.role === role);
    } catch (error) {
      return [];
    }
  }

  // Helper method to get users by branch
  static async getUsersByBranch(branch: string): Promise<UserOut[]> {
    try {
      const users = await this.getAllUsers(0, 1000);
      return users.filter(user => user.branch === branch);
    } catch (error) {
      return [];
    }
  }
}
