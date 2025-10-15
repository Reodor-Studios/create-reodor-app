"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Query keys
const AUTH_KEYS = {
    session: ["auth", "session"] as const,
    profile: (userId: string) => ["auth", "profile", userId] as const,
};

// Fetch user profile
const fetchProfile = async (userId: string): Promise<Profile> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return data;
};

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    // Query for user profile
    const {
        data: profile,
        isLoading: profileLoading,
    } = useQuery({
        queryKey: user
            ? AUTH_KEYS.profile(user.id)
            : ["auth", "profile", "null"],
        queryFn: () => (user ? fetchProfile(user.id) : null),
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    useEffect(() => {
        const supabase = createClient();

        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Error getting session:", error);
                }
                const sessionUser = data.session?.user ?? null;
                setUser(sessionUser);
                setLoading(false);
            } catch (error) {
                console.error("Error getting initial session:", error);
                setLoading(false);
            }
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log("Auth state changed:", event, session?.user?.id);

                const sessionUser = session?.user ?? null;
                setUser(sessionUser);

                // Invalidate profile query when auth state changes
                if (sessionUser) {
                    queryClient.invalidateQueries({
                        queryKey: AUTH_KEYS.profile(sessionUser.id),
                    });
                } else {
                    // Clear profile data when user signs out
                    queryClient.removeQueries({
                        queryKey: ["auth", "profile"],
                    });
                }

                setLoading(false);
            },
        );

        return () => subscription.unsubscribe();
    }, [queryClient]);

    const signOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
    };

    return {
        user,
        profile: profile || null,
        loading: loading || profileLoading,
        signOut,
    };
};
