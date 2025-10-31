import type { SupabaseClient } from "@/db/supabase.client";

export interface SignUpData {
  email: string;
  password: string;
  nickname?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  role: "user" | "admin";
  canAddPhotos: boolean;
  createdAt: string;
}

/**
 * Auth Service
 * Handles user authentication and profile management
 */
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    const { email, password, nickname } = data;

    // Validate password
    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters long",
      };
    }

    // TODO: Add profanity filtering for nickname (PRD US-026, US-029)
    // If nickname is provided, validate it for profanity
    // Install: npm install bad-words
    // Implementation:
    // if (nickname) {
    //   import Filter from 'bad-words';
    //   const profanityFilter = new Filter();
    //   if (profanityFilter.isProfane(nickname)) {
    //     return {
    //       success: false,
    //       error: "Nickname contains inappropriate content",
    //     };
    //   }
    // }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Failed to create user",
      };
    }

    // Update nickname if provided
    if (nickname) {
      const { error: updateError } = await this.supabase.from("users").update({ nickname }).eq("id", authData.user.id);

      if (updateError) {
        console.error("Failed to set nickname:", updateError);
        // Don't fail the signup, just log the error
      }
    }

    return {
      success: true,
      userId: authData.user.id,
    };
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    const { email, password } = data;

    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Failed to sign in",
      };
    }

    return {
      success: true,
      userId: authData.user.id,
    };
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResult> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  }

  /**
   * Get current user profile with additional metadata
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data: user, error } = await this.supabase
      .from("users")
      .select("id, email, nickname, role, can_add_photos, created_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? "",
      nickname: user.nickname,
      role: user.role as "user" | "admin",
      canAddPhotos: user.can_add_photos ?? false,
      createdAt: user.created_at,
    };
  }

  /**
   * Update user nickname
   */
  async updateNickname(userId: string, nickname: string): Promise<AuthResult> {
    // Validate nickname
    if (nickname.length < 3 || nickname.length > 20) {
      return {
        success: false,
        error: "Nickname must be between 3 and 20 characters",
      };
    }

    // TODO: Add profanity filtering (PRD US-026, US-029)
    // Install: npm install bad-words
    // Implementation:
    // import Filter from 'bad-words';
    // const profanityFilter = new Filter();
    // if (profanityFilter.isProfane(nickname)) {
    //   return {
    //     success: false,
    //     error: "Nickname contains inappropriate content",
    //   };
    // }

    // Check if nickname is already taken
    const { data: existing } = await this.supabase
      .from("users")
      .select("id")
      .eq("nickname", nickname)
      .neq("id", userId)
      .single();

    if (existing) {
      return {
        success: false,
        error: "Nickname already taken",
      };
    }

    const { error } = await this.supabase.from("users").update({ nickname }).eq("id", userId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  }

  /**
   * Check if user has permission to add photos
   */
  async canAddPhotos(userId: string): Promise<boolean> {
    const { data: user } = await this.supabase.from("users").select("can_add_photos").eq("id", userId).single();

    return user?.can_add_photos ?? false;
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const { data: user } = await this.supabase.from("users").select("role").eq("id", userId).single();

    return user?.role === "admin";
  }
}
