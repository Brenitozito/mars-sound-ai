import { supabaseServices } from "./supabase";

export const { authService, userService, catalogService, libraryService } = supabaseServices;
export { getErrorMessage, ServiceError, type ServiceErrorCode } from "./serviceError";
export type {
  AuthChangeEvent,
  AuthService,
  CatalogService,
  EmailUpdateResult,
  LibraryService,
  PasswordChange,
  SignInCredentials,
  SignUpData,
  SignUpResult,
  TrackSearchParams,
  UploadProgressListener,
  UserService,
} from "./contracts";
