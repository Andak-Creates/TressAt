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

  // ✅ Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", currentUser.id)
            .maybeSingle();

          // ✅ If no profile exists, sign out the orphaned user
          if (!profile) {
            console.warn("No profile found for user, signing out...");
            await supabase.auth.signOut();
            setUser(null);
            setRole(null);
            setFullName("");
          } else {
            setRole(profile.role as UserRole);
            setFullName(profile.full_name || "");
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (profile) {
            const userRole = profile.role as UserRole;
            setRole(userRole);
            setFullName(profile.full_name || "");

            if (event === "SIGNED_IN") {
              if (userRole === "customer")
                router.replace("/(customer-tabs)/Home");
              else router.replace("/");
            }
          }
        } else {
          setRole(null);
          setFullName("");
          if (event === "SIGNED_OUT") router.replace("/");
        }
      }
    );

    return () => authListener?.subscription.unsubscribe();
  }, []);

  // ✅ Sign up user
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
      console.log("🔵 Starting signup for:", email, "as", role);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
          },
        },
      });
      if (error) throw error;
      if (!data.user) return null;

      console.log("✅ Auth user created:", data.user.id);
      console.log("🔵 Attempting to insert profile...");
      console.log("🔵 Profile data:", {
        id: data.user.id,
        role,
        full_name: fullName || "",
        phone: phone || "",
        location: location ? `POINT(${location.lng} ${location.lat})` : null,
      });

      // Insert into profiles - this must succeed before session check
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: data.user.id,
            role,
            full_name: fullName || "",
            phone: phone || "",
            location: location
              ? `POINT(${location.lng} ${location.lat})`
              : null,
          },
        ])
        .select();

      console.log("🔵 Profile insert result:", { profileData, profileError });

      if (profileError) {
        console.error("❌ Profile insert error:", profileError);
        console.error("❌ Error code:", profileError.code);
        console.error("❌ Error message:", profileError.message);
        console.error("❌ Full error:", JSON.stringify(profileError, null, 2));
        // Clean up the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(data.user.id).catch(() => {});
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log("✅ Profile created successfully:", profileData);

      // Provider record will be auto-created by database trigger
      if (role === "provider") {
        console.log("✅ Provider record will be auto-created by trigger");

        // Wait a moment for trigger to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setRole(role);
      setFullName(fullName || "");

      if (role === "customer") {
        router.replace("/(customer-tabs)/Home");
      } else {
        router.replace("/");
      }

      return data.user.id;
    } catch (err) {
      console.error("Signup error:", err);
      throw err; // Re-throw so PaymentScreen can catch it
    } finally {
      setLoading(false);
    }
  };

  // ✅ Log in user
  const logIn = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const currentUser = data.user;
      if (!currentUser) throw new Error("Login failed");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!profile) throw new Error("No profile found");

      const dbRole = profile.role as UserRole;
      if (dbRole !== role) {
        await supabase.auth.signOut();
        throw new Error(`This account is a ${dbRole}. Please log in as that.`);
      }

      setRole(dbRole);
      setFullName(profile.full_name || "");

      return currentUser.id;
    } catch (err) {
      console.error("Login error:", err);
      throw err; // ✅ Re-throw the error so the caller can catch it
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setFullName("");
    router.replace("/");
  };

  const updateFullName = (name: string) => setFullName(name);

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
