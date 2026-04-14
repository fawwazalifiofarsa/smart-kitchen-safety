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
export type LoginRequestBody = {
  email: string;
  password: string;
};

export type LoginResponseData = {
  access_token: string;
  refresh_token: string;
  user: string;
};