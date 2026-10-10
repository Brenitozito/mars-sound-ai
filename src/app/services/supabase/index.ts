import type { AppServices } from "../contracts";
import { supabaseAuthService } from "./supabaseAuthService";
import { supabaseCatalogService } from "./supabaseCatalogService";
import { supabaseLibraryService } from "./supabaseLibraryService";
import { supabaseUserService } from "./supabaseUserService";

export const supabaseServices: AppServices = {
  authService: supabaseAuthService,
  userService: supabaseUserService,
  catalogService: supabaseCatalogService,
  libraryService: supabaseLibraryService,
};
