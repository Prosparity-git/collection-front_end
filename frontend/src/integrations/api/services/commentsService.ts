import { API_BASE_URL, getAuthHeaders } from '../client';

// Types for comments data - Updated to match backend API
export interface CommentCreate {
  repayment_id: string;
  comment: string; // Changed from comment_text to comment
  user_id?: number; // Made optional since backend will override
  comment_type: number; // Changed from enum to number
}

export interface CommentResponse {
  id: number; // Changed from string to number
  repayment_id: string;
  comment: string; // Changed from comment_text to comment
  user_id: number; // Changed from string to number
  comment_type: number; // Changed from enum to number
  commented_at: string; // Changed from created_at to commented_at
  user_name: string; // Add user name from backend
}

export interface CommentListResponse {
  total: number;
  results: CommentResponse[];
}

// Comment type constants to match backend
export const COMMENT_TYPES = {
  APPLICATION_DETAILS: 1,
  PAID_PENDING: 2
} as const;

// Comments Service
export class CommentsService {
  // POST /api/v1/comments/ - Create a new comment
  static async createComment(comment: CommentCreate): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(comment),
    });

    if (!response.ok) {
      throw new Error(`Failed to create comment: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/comments/repayment/{repayment_id} - Get all comments for a repayment
  static async getCommentsByRepayment(
    repaymentId: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<CommentListResponse> {
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/comments/repayment/${repaymentId}?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/comments/repayment/{repayment_id}/type/{comment_type} - Get comments by type
  static async getCommentsByRepaymentAndType(
    repaymentId: string,
    commentType: number, // Changed from enum to number
    skip: number = 0,
    limit: number = 100
  ): Promise<CommentListResponse> {
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/comments/repayment/${repaymentId}/type/${commentType}?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch comments by type: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/comments/repayment/{repayment_id}/count - Get comment count for a repayment
  static async getRepaymentCommentsCount(repaymentId: string): Promise<{ repayment_id: string; comment_count: number }> {
    const response = await fetch(`${API_BASE_URL}/comments/repayment/${repaymentId}/count`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comment count: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/comments/repayment/{repayment_id}/type/{comment_type}/count - Get comment count by type
  static async getRepaymentCommentsCountByType(
    repaymentId: string,
    commentType: number // Changed from enum to number
  ): Promise<{ repayment_id: string; comment_type: number; comment_count: number }> {
    const response = await fetch(
      `${API_BASE_URL}/comments/repayment/${repaymentId}/type/${commentType}/count`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch comment count by type: ${response.status}`);
    }

    return await response.json();
  }
}
