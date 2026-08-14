import { AuthUser } from "./auth-user.interface";

export interface LoginData {
  token: string;
  user: AuthUser;
}