import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StudentProfile {
  skills: string[] | null;
  certificates: string[] | null;
  education: any | null;
  work_experience: any | null;
  github_url: string | null;
  portfolio_url: string | null;
}

interface ClubAffiliation {
  id: string;
  name: string;
  logo_url: string | null;
  role: string;
}

interface StartupAffiliation {
  id: string;
  name: string;
  logo_url: string | null;
  role: string;
}

interface ExtendedProfileData {
  interests: string[] | null;
  status_message: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  campus_groups: string[] | null;
  campus_year: string | null;
  created_at: string | null;
}

export function useProfileData(userId: string | null) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfileData | null>(null);
  const [clubs, setClubs] = useState<ClubAffiliation[]>([]);
  const [startups, setStartups] = useState<StartupAffiliation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch extended profile data
        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            "interests, status_message, linkedin_url, instagram_url, twitter_url, website_url, campus_groups, campus_year, created_at"
          )
          .eq("user_id", userId)
          .single();

        if (profileData) {
          setExtendedProfile(profileData);
        }

        // Fetch student profile
        const { data: studentData } = await supabase
          .from("student_profiles")
          .select("skills, certificates, education, work_experience, github_url, portfolio_url")
          .eq("user_id", userId)
          .single();

        if (studentData) {
          setStudentProfile({
            skills: studentData.skills,
            certificates: studentData.certificates,
            education: studentData.education,
            work_experience: studentData.work_experience,
            github_url: studentData.github_url,
            portfolio_url: studentData.portfolio_url,
          });
        }

        // Fetch club memberships
        const { data: clubMemberships } = await supabase
          .from("club_memberships")
          .select("role, club_id")
          .eq("user_id", userId);

        if (clubMemberships && clubMemberships.length > 0) {
          const clubIds = clubMemberships.map((m) => m.club_id);
          const { data: clubsData } = await supabase
            .from("clubs_profiles")
            .select("id, club_name, logo_url")
            .in("id", clubIds);

          if (clubsData) {
            const clubAffiliations: ClubAffiliation[] = clubsData.map((club) => {
              const membership = clubMemberships.find((m) => m.club_id === club.id);
              return {
                id: club.id,
                name: club.club_name,
                logo_url: club.logo_url,
                role: membership?.role || "member",
              };
            });
            setClubs(clubAffiliations);
          }
        }

        // Fetch startup contributions
        const { data: startupContributions } = await supabase
          .from("startup_contributors")
          .select("role, startup_id")
          .eq("user_id", userId);

        const startupAffiliations: StartupAffiliation[] = [];

        if (startupContributions && startupContributions.length > 0) {
          const startupIds = startupContributions.map((s) => s.startup_id);
          const { data: startupsData } = await supabase
            .from("student_startups")
            .select("id, title, logo_url")
            .in("id", startupIds);

          if (startupsData) {
            startupsData.forEach((startup) => {
              const contribution = startupContributions.find((c) => c.startup_id === startup.id);
              startupAffiliations.push({
                id: startup.id,
                name: startup.title,
                logo_url: startup.logo_url,
                role: contribution?.role || "contributor",
              });
            });
          }
        }

        // Also fetch startups where the user is the founder
        const { data: foundedStartups } = await supabase
          .from("student_startups")
          .select("id, title, logo_url")
          .eq("user_id", userId);

        if (foundedStartups) {
          const founderStartups: StartupAffiliation[] = foundedStartups.map((s) => ({
            id: s.id,
            name: s.title,
            logo_url: s.logo_url,
            role: "founder",
          }));

          // Merge with existing startups, avoiding duplicates
          const existingIds = new Set(startupAffiliations.map((s) => s.id));
          const newStartups = founderStartups.filter((s) => !existingIds.has(s.id));
          setStartups([...startupAffiliations, ...newStartups]);
        } else {
          setStartups(startupAffiliations);
        }
      } catch (error) {
        console.error("Error fetching extended profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return {
    studentProfile,
    extendedProfile,
    clubs,
    startups,
    loading,
  };
}
