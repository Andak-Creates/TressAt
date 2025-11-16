import { supabase } from "@/lib/supabase";
import { create } from "zustand";

interface Customer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
}

interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  service: string;
  price: number;
  status: string;
  scheduled_at: string;
  created_at: string;
  customer: Customer;
}

interface Analytics {
  totalEarnings: number;
  earningsTrend: number;
  averageRating: number;
  ratingTrend: number;
}

interface Profile {
  full_name: string;
  avatar_url?: string | null;
  phone?: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  is_active: boolean;
}

interface ProviderState {
  // State
  currentProviderId: string | null;
  providerName: string;
  profile: Profile | null;
  portfolioImages: string[];
  services: Service[];
  bookings: Booking[];
  analytics: Analytics;
  loading: boolean;
  error: string | null;

  // Actions
  setProviderId: (id: string) => void;
  fetchProviderProfile: () => Promise<void>;
  fetchPortfolioImages: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchTodaysBookings: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  loadDashboardData: () => Promise<void>;
  loadProfileData: () => Promise<void>;
  subscribeToBookings: () => () => void;
  reset: () => void;
}

const initialAnalytics: Analytics = {
  totalEarnings: 0,
  earningsTrend: 0,
  averageRating: 0,
  ratingTrend: 0,
};

export const useProviderStore = create<ProviderState>((set, get) => ({
  // Initial state
  currentProviderId: null,
  providerName: "",
  profile: null,
  portfolioImages: [],
  services: [],
  bookings: [],
  analytics: initialAnalytics,
  loading: false,
  error: null,

  // Set provider ID
  setProviderId: (id: string) => set({ currentProviderId: id }),

  // Fetch provider profile
  fetchProviderProfile: async () => {
    const { currentProviderId } = get();
    if (!currentProviderId) return;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, phone")
        .eq("id", currentProviderId)
        .single();

      if (error) throw error;
      if (profile) {
        set({
          providerName: profile.full_name,
          profile: profile,
        });
      }
    } catch (error) {
      console.error("Error fetching provider profile:", error);
      set({ error: "Failed to load provider profile" });
    }
  },

  // Fetch portfolio images
  fetchPortfolioImages: async () => {
    const { currentProviderId } = get();
    if (!currentProviderId) return;

    try {
      const { data, error } = await supabase
        .from("portfolios")
        .select("image_url")
        .eq("provider_id", currentProviderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ portfolioImages: data?.map((item) => item.image_url) || [] });
    } catch (error) {
      console.error("Error fetching portfolio images:", error);
      set({ error: "Failed to load portfolio images" });
    }
  },

  // Fetch services
  fetchServices: async () => {
    const { currentProviderId } = get();
    if (!currentProviderId) return;

    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, price, duration, is_active")
        .eq("provider_id", currentProviderId)
        .order("name", { ascending: true });

      if (error) throw error;
      set({ services: data || [] });
    } catch (error) {
      console.error("Error fetching services:", error);
      set({ error: "Failed to load services" });
    }
  },

  // Fetch today's bookings
  fetchTodaysBookings: async () => {
    const { currentProviderId } = get();
    if (!currentProviderId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          customer:profiles!customer_id(
            id,
            full_name,
            avatar_url,
            phone
          )
        `
        )
        .eq("provider_id", currentProviderId)
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      set({ bookings: data || [] });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      set({ error: "Failed to load bookings" });
    }
  },

  // Fetch analytics
  fetchAnalytics: async () => {
    const { currentProviderId } = get();
    if (!currentProviderId) return;

    try {
      // Get total earnings from completed bookings
      const { data: completedBookings, error: earningsError } = await supabase
        .from("bookings")
        .select("price, total_price")
        .eq("provider_id", currentProviderId)
        .eq("status", "completed");

      if (earningsError) throw earningsError;

      const totalEarnings =
        completedBookings?.reduce(
          (sum, booking) =>
            sum + (Number(booking.total_price || booking.price) || 0),
          0
        ) || 0;

      // Get average rating from reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", currentProviderId);

      if (reviewsError) throw reviewsError;

      const averageRating = reviews?.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

      set({
        analytics: {
          totalEarnings,
          earningsTrend: 15,
          averageRating: Number(averageRating.toFixed(1)),
          ratingTrend: 5,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      set({ error: "Failed to load analytics" });
    }
  },

  // Load all dashboard data
  loadDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchProviderProfile(),
        get().fetchTodaysBookings(),
        get().fetchAnalytics(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      set({ loading: false });
    }
  },

  // Load all profile data
  loadProfileData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchProviderProfile(),
        get().fetchPortfolioImages(),
        get().fetchServices(),
        get().fetchAnalytics(),
      ]);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      set({ loading: false });
    }
  },

  // Subscribe to real-time booking changes
  subscribeToBookings: () => {
    const { currentProviderId } = get();
    if (!currentProviderId) return () => {};

    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `provider_id=eq.${currentProviderId}`,
        },
        () => {
          get().fetchTodaysBookings();
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Reset store
  reset: () =>
    set({
      currentProviderId: null,
      providerName: "",
      profile: null,
      portfolioImages: [],
      services: [],
      bookings: [],
      analytics: initialAnalytics,
      loading: false,
      error: null,
    }),
}));
