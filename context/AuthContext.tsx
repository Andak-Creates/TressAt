"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type UserRole = "customer" | "provider" | null;

interface AuthContextType {
  user: any;
  role: UserRole;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    fullName?: string,
    phone?: string,
    location?: { lat: number; lng: number }
  ) => Promise<string | null>;
  logIn: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<string | null>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔹 Check session when app launches
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (data?.role) {
          setRole(data.role);

          // Redirect to correct home
          if (data.role === "customer") {
            router.replace("/"); // customer flow
          } else if (data.role === "provider") {
            router.replace("/"); // provider flow
          }
        }
      }

      setLoading(false);
    };

    initAuth();

    // 🔹 Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data } = await supabase
            .from("profiles")
            .select("role, location")
            .eq("id", currentUser.id)
            .single();

          if (data?.role) {
            setRole(data.role);

            if (data.role === "customer") {
              router.replace("/"); //change route to home
            } else if (data.role === "provider") {
              router.replace("/"); //change route to dashboard
            }
          }
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 🔹 Sign Up
  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    fullName?: string,
    phone?: string,
    location?: { lat: number; lng: number }
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      await supabase.from("profiles").insert([
        {
          id: data.user.id,
          role,
          full_name: fullName || "",
          phone: phone || "",
          location: location ? `POINT(${location.lng} ${location.lat})` : null,
        },
      ]);
      setRole(role);
      return data.user.id;
    }
    return null;
  };

  // 🔹 Login
  const logIn = async (email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const user = data.user;
    if (!user) throw new Error("User not found");

    // Check roles from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // Compare profile
    if (profile?.role !== role) {
      // sign out so session is persisted
      await supabase.auth.signOut();
      throw new Error(
        `This account is registered
         as a ${profile?.role}. Please log in 
         through the ${profile?.role} flow.`
      );
    }

    //If roles match, proceed || success
    return user.id;
  };

  // 🔹 Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.replace("/"); // back to splash
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, signUp, logIn, logout, setRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
