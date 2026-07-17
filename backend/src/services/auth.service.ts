import { supabase } from '../lib/supabase';
import { AppError, ErrorCode } from '../utils/errors';

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Registers a new user email, password, and custom metadata in Supabase.
   */
  public static async signup(input: SignUpInput) {
    const { email, password, fullName } = input;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new AppError(
        error.message,
        error.status || 400,
        ErrorCode.BAD_REQUEST
      );
    }

    if (!data.user) {
      throw new AppError(
        'Registration failed. User profile could not be created.',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || '',
      },
      session: data.session ? {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      } : null,
    };
  }

  /**
   * Authenticates a user by validating their password.
   */
  public static async login(input: LoginInput) {
    const { email, password } = input;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(
        error.message,
        error.status || 401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (!data.user || !data.session) {
      throw new AppError(
        'Authentication failed. Active sessions not returned.',
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || '',
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    };
  }

  /**
   * Log out globally by invalidating active access token.
   */
  public static async logout(accessToken: string) {
    const { error } = await supabase.auth.admin.signOut(accessToken);

    if (error) {
      throw new AppError(
        error.message,
        error.status || 400,
        ErrorCode.BAD_REQUEST
      );
    }

    return { success: true };
  }

  /**
   * Decodes JWT token securely and checks validity on Supabase auth database.
   */
  public static async getCurrentUser(accessToken: string) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      throw new AppError(
        error.message,
        error.status || 401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (!user) {
      throw new AppError(
        'User session not valid.',
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || '',
    };
  }

  /**
   * Regenerates a new JWT access token using the refresh token parameter.
   */
  public static async refreshSession(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new AppError(
        error.message,
        error.status || 401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (!data.user || !data.session) {
      throw new AppError(
        'Active tokens could not be updated.',
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || '',
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    };
  }
}
