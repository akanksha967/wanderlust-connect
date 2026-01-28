import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore, type UserProfile } from "@/store/useAppStore";

type MatchRow = {
  id: string;
  profile1_id: string;
  profile2_id: string;
  created_at: string;
};

export const useMatches = () => {
  const { profileId } = useAuth();
  const setMatches = useAppStore((s) => s.setMatches);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!profileId) {
      setMatches([]);
      return;
    }

    setLoading(true);
    try {
      const { data: matchRows, error: matchesError } = await supabase
        .from("matches")
        .select("id, profile1_id, profile2_id, created_at")
        .or(`profile1_id.eq.${profileId},profile2_id.eq.${profileId}`)
        .order("created_at", { ascending: false });

      if (matchesError) throw matchesError;
      const matches = (matchRows ?? []) as MatchRow[];
      if (matches.length === 0) {
        setMatches([]);
        return;
      }

      // Determine the "other" profile for each match, keeping ordering.
      const otherIdsInOrder = matches
        .map((m) => (m.profile1_id === profileId ? m.profile2_id : m.profile1_id))
        .filter(Boolean);

      const uniqueOtherIds = Array.from(new Set(otherIdsInOrder));

      // Filter out blocked relationships (either direction)
      const { data: blocksData } = await supabase
        .from("blocks")
        .select("blocked_id, blocker_id")
        .or(`blocker_id.eq.${profileId},blocked_id.eq.${profileId}`);

      const blockedIds = new Set(
        (blocksData ?? []).flatMap((b: any) => [b.blocked_id, b.blocker_id])
      );

      const visibleIds = uniqueOtherIds.filter((id) => !blockedIds.has(id));
      if (visibleIds.length === 0) {
        setMatches([]);
        return;
      }

      const [{ data: profilesData, error: profilesError }, { data: photosData }, { data: vibesData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, name, age, bio")
            .in("id", visibleIds),
          supabase
            .from("photos")
            .select("profile_id, url, is_primary")
            .in("profile_id", visibleIds),
          supabase
            .from("travel_vibes")
            .select("profile_id, vibe")
            .in("profile_id", visibleIds),
        ]);

      if (profilesError) throw profilesError;

      const photosByProfile = new Map<string, { url: string; is_primary: boolean | null }[]>();
      (photosData ?? []).forEach((p: any) => {
        const list = photosByProfile.get(p.profile_id) ?? [];
        list.push({ url: p.url, is_primary: p.is_primary });
        photosByProfile.set(p.profile_id, list);
      });

      const vibesByProfile = new Map<string, string[]>();
      (vibesData ?? []).forEach((v: any) => {
        const list = vibesByProfile.get(v.profile_id) ?? [];
        list.push(v.vibe);
        vibesByProfile.set(v.profile_id, list);
      });

      const profileById = new Map<string, any>();
      (profilesData ?? []).forEach((p: any) => profileById.set(p.id, p));

      const orderedVisibleIds = otherIdsInOrder.filter((id) => visibleIds.includes(id));

      const hydrated: UserProfile[] = orderedVisibleIds
        .map((id) => {
          const p = profileById.get(id);
          if (!p) return null;

          const photos = (photosByProfile.get(id) ?? [])
            .slice()
            .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
            .map((x) => x.url)
            .filter(Boolean);

          return {
            id: p.id,
            name: p.name,
            age: p.age ?? 0,
            bio: p.bio ?? "",
            photos: photos.length ? photos : ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop"],
            travelVibes: vibesByProfile.get(id) ?? [],
          } as UserProfile;
        })
        .filter(Boolean) as UserProfile[];

      setMatches(hydrated);
    } finally {
      setLoading(false);
    }
  }, [profileId, setMatches]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, refresh };
};
