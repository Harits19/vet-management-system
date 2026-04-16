export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
}

export interface AuthResponse {
  success: true;
  message: string;
  data: {
    user: AuthUser;
  };
}
