import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UserRole = "customer" | "provider" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  fullName: string;
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
  updateFullName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth on app launch
  useEffect(() => {
    // 1. Check for existing session on app load
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (data?.role) {
            setRole(data.role);
            setFullName(data.full_name || "");
            // Don't navigate here - let NavigationGuard handle it
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for auth changes (sign in, sign out, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            const { data } = await supabase
              .from("profiles")
              .select("role, full_name, location")
              .eq("id", currentUser.id)
              .maybeSingle();

            if (data?.role) {
              setRole(data.role);
              setFullName(data.full_name || "");

              if (event === "SIGNED_IN") {
                if (data.role === "customer") {
                  router.replace("/(customer-tabs)/Home");
                } else if (data.role === "provider") {
                  router.replace("/");
                }
              }
            }
          } else {
            setRole(null);
            setFullName("");

            if (event === "SIGNED_OUT") {
              router.replace("/");
            }
          }
        } catch (err) {
          console.error("Auth state change error:", err);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    fullName?: string,
    phone?: string,
    location?: { lat: number; lng: number }
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        await supabase.from("profiles").insert([
          {
            id: data.user.id,
            role,
            full_name: fullName || "",
            phone: phone || "",
            location: location
              ? `POINT(${location.lng} ${location.lat})`
              : null,
          },
        ]);

        setRole(role);
        setFullName(fullName || "");

        if (role === "customer") {
          router.replace("/(customer-tabs)/Home");
        } else if (role === "provider") {
          router.replace("/");
        }

        return data.user.id;
      }

      return null;
    } catch (err) {
      console.error("Sign up error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("User not found");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile)
        throw new Error(
          "No profile found for this user. Please complete signup."
        );

      if (profile?.role !== role) {
        await supabase.auth.signOut();
        throw new Error(
          `This account is registered as a ${profile?.role}. Please log in through the ${profile?.role} flow.`
        );
      }

      setFullName(profile.full_name || "");

      return user.id;
    } catch (err) {
      console.error("Login error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
      setFullName("");
      router.replace("/"); // back to splash
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const updateFullName = (name: string) => {
    setFullName(name);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        fullName,
        loading,
        signUp,
        logIn,
        logout,
        setRole,
        updateFullName,
      }}
    >
      {loading ? (
        <SafeAreaView
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Loading...</Text>
        </SafeAreaView>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
