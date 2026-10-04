import { supabase } from "../lib/supabase";

export const authService = {
  /**
   * Logs in a user using username or email and password
   */
  async login(usernameOrEmail: string, password: string) {
    let email = usernameOrEmail.trim();
    if (!email.includes("@")) {
      email = `${email.toLowerCase()}@fazagifthouse.com`;
    }
    
    // Try Supabase Auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data?.user) {
        localStorage.removeItem("faza_local_session");
        return data.user;
      }
      if (error) throw error;
    } catch (supabaseError: any) {
      console.warn("Supabase login failed, checking fallback:", supabaseError);
      
      // Fallback: local session if credentials match Faza/123 or development admin
      const isFazaAdmin = 
        (usernameOrEmail.toLowerCase() === "faza" || email === "faza@fazagifthouse.com" || usernameOrEmail.toLowerCase() === "admin") && 
        (password === "123" || password === "admin123");

      if (isFazaAdmin) {
        const mockUser = { 
          id: "local-admin", 
          email: "faza@fazagifthouse.com", 
          role: "authenticated",
          user_metadata: { name: "Faza Admin" }
        };
        localStorage.setItem("faza_local_session", JSON.stringify(mockUser));
        return mockUser;
      }
      throw supabaseError;
    }
  },

  /**
   * Logs out the current user session
   */
  async logout() {
    localStorage.removeItem("faza_local_session");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase logout warning:", e);
    }
  },

  /**
   * Retrieves the current logged-in user profile, if session exists
   */
  async getCurrentUser() {
    // 1. Check local session first
    const localSession = localStorage.getItem("faza_local_session");
    if (localSession) {
      try {
        return JSON.parse(localSession);
      } catch (e) {
        localStorage.removeItem("faza_local_session");
      }
    }

    // 2. Query Supabase with a safety timeout so it never hangs indefinitely
    try {
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<{ data: { user: null }, error: null }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null }, error: null }), 1800)
      );

      const res = await Promise.race([userPromise, timeoutPromise]);
      if (res?.data?.user) {
        return res.data.user;
      }
    } catch (e) {
      console.warn("Supabase session retrieval failed:", e);
    }

    return null;
  },

  /**
   * Subscribes to changes in authentication state
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  }
};
