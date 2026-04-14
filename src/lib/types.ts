export type ApiFieldError = {
  field: string;
  message: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: ApiFieldError[];
};

export type UserRole = "admin" | "member" | "viewer" | string;
export type UserStatus = "active" | "inactive" | string;

export type DashboardUser = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  telegram_chat_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login_at: string | null;
};

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type AuthenticatedUser = Pick<
  DashboardUser,
  "uid" | "name" | "email" | "role" | "status" | "telegram_chat_id"
>;

export type RegisterRequestBody = {
  name: string;
  email: string;
  password: string;
};

export type LoginResponseData = {
  access_token: string;
  refresh_token: string;
  user: Pick<DashboardUser, "uid" | "name" | "email" | "role" | "status">;
};

export type CreateUserRequestBody = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  telegram_chat_id?: string | null;
};

export type CreateUserProfilePayload = {
  uid: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
};
