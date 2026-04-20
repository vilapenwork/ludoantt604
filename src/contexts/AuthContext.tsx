import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });

      if (error) {
        throw error;
      }

      const admin = !!data;
      setIsAdmin(admin);
      return admin;
    } catch (error) {
      console.error("Không kiểm tra được quyền admin:", error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    let active = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await checkAdmin(nextSession.user.id);
      } else if (active) {
        setIsAdmin(false);
      }

      if (active) {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => syncSession(session))
      .catch((error) => {
        console.error("Không đọc được phiên đăng nhập:", error);
        if (active) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: error as Error };
      }

      if (!data.user) {
        await supabase.auth.signOut();
        return { error: new Error("Không tìm thấy thông tin tài khoản sau khi đăng nhập.") };
      }

      const admin = await checkAdmin(data.user.id);

      if (!admin) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        return { error: new Error("Tài khoản này không có quyền quản trị.") };
      }

      setUser(data.user);
      setSession(data.session ?? null);
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Không thể đăng nhập lúc này."),
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
