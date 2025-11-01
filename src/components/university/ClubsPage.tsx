import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Globe, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import EditClubModal from "./EditClubModal";
import ClubUpcomingEvents from "./ClubUpcomingEvents";
import ClubMembersRightSidebar from "./ClubMembersRightSidebar";

interface ClubProfile {
  id: string;
  user_id: string;
  club_name: string;
  club_description: string;
  logo_url: string;
  category: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  university: string;
  member_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  } | null;
}

export default function ClubsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ownClub, setOwnClub] = useState<ClubProfile | null>(null);
  const [myClubs, setMyClubs] = useState<ClubProfile[]>([]);
  const [otherClubs, setOtherClubs] = useState<ClubProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isClubOwner, setIsClubOwner] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, [user]);

  const fetchClubs = async () => {
    if (!user) return;

    try {
      // Get logged-in user's university and user_type
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("university, user_type")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // Get clubs from the same university
      const { data: clubsData, error: clubsError } = await supabase
        .from("clubs_profiles")
        .select("*")
        .eq("university", profileData?.university || "")
        .order("created_at", { ascending: false });

      if (clubsError) throw clubsError;

      if (clubsData && clubsData.length > 0) {
        // Then get profiles for those clubs
        const userIds = clubsData.map((club) => club.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Map profiles to clubs
        const profilesMap = new Map();
        profilesData?.forEach((profile) => {
          profilesMap.set(profile.user_id, profile);
        });

        const clubsWithProfiles = clubsData.map((club) => ({
          ...club,
          profiles: profilesMap.get(club.user_id) || null,
        }));

        // If user is a club, separate their own club from others
        if (profileData?.user_type === "clubs") {
          const own = clubsWithProfiles.find((club) => club.user_id === user.id);
          const others = clubsWithProfiles.filter((club) => club.user_id !== user.id);
          setOwnClub(own || null);
          setOtherClubs(others);
          setIsClubOwner(true);
          setIsStudent(false);
        } else {
          // For students, separate joined clubs from others
          const { data: memberships } = await supabase
            .from("club_memberships")
            .select("club_id")
            .eq("user_id", user.id);

          const joinedClubIds = new Set(memberships?.map((m) => m.club_id) || []);
          const joined = clubsWithProfiles.filter((club) => joinedClubIds.has(club.id));
          const others = clubsWithProfiles.filter((club) => !joinedClubIds.has(club.id));

          setOwnClub(null);
          setMyClubs(joined);
          setOtherClubs(others);
          setIsClubOwner(false);
          setIsStudent(true);
        }
      }
    } catch (error) {
      console.error("Error fetching clubs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">University Clubs & Organizations</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading clubs...</div>
        ) : !ownClub && myClubs.length === 0 && otherClubs.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Users className="w-16 h-16 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No clubs found yet</p>
            <p className="text-sm text-muted-foreground">Club organizations can sign up to showcase their activities</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Own Club Section (for club users) */}
            {ownClub && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Your Club</h2>
                    <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Club
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card
                      className="hover:shadow-lg transition-shadow border-primary cursor-pointer"
                      onClick={() => navigate(`/clubs/${ownClub.id}`)}
                    >
                      <CardHeader>
                        {ownClub.logo_url && (
                          <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={ownClub.logo_url}
                              alt={ownClub.club_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardTitle>{ownClub.club_name}</CardTitle>
                        {ownClub.category && <CardDescription>{ownClub.category}</CardDescription>}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">{ownClub.club_description}</p>

                        <div className="space-y-2 pt-2">
                          {ownClub.contact_email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a href={`mailto:${ownClub.contact_email}`} className="text-primary hover:underline">
                                {ownClub.contact_email}
                              </a>
                            </div>
                          )}
                          {ownClub.contact_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{ownClub.contact_phone}</span>
                            </div>
                          )}
                          {ownClub.website_url && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={ownClub.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                          <Users className="w-4 h-4" />
                          <span>{ownClub.member_count} members</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Divider */}
                {otherClubs.length > 0 && (
                  <div className="border-t border-border pt-6">
                    <h2 className="text-xl font-semibold mb-4">Other Clubs</h2>
                  </div>
                )}
              </>
            )}

            {/* Student's Joined Clubs Section */}
            {isStudent && myClubs.length > 0 && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-4">My Clubs</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myClubs.map((club) => (
                      <Card
                        key={club.id}
                        className="hover:shadow-lg transition-shadow border-primary cursor-pointer"
                        onClick={() => navigate(`/clubs/${club.id}`)}
                      >
                        <CardHeader>
                          {club.logo_url && (
                            <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-muted">
                              <img src={club.logo_url} alt={club.club_name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <CardTitle>{club.club_name}</CardTitle>
                          {club.category && <CardDescription>{club.category}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-3">{club.club_description}</p>

                          <div className="space-y-2 pt-2">
                            {club.contact_email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <a href={`mailto:${club.contact_email}`} className="text-primary hover:underline">
                                  {club.contact_email}
                                </a>
                              </div>
                            )}
                            {club.contact_phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{club.contact_phone}</span>
                              </div>
                            )}
                            {club.website_url && (
                              <div className="flex items-center gap-2 text-sm">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <a
                                  href={club.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Visit Website
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                            <Users className="w-4 h-4" />
                            <span>{club.member_count} members</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                {otherClubs.length > 0 && (
                  <div className="border-t border-border pt-6">
                    <h2 className="text-xl font-semibold mb-4">Other Clubs</h2>
                  </div>
                )}
              </>
            )}

            {/* Other Clubs Section */}
            {otherClubs.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherClubs.map((club) => (
                  <Card
                    key={club.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/clubs/${club.id}`)}
                  >
                    <CardHeader>
                      {club.logo_url && (
                        <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-muted">
                          <img src={club.logo_url} alt={club.club_name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardTitle>{club.club_name}</CardTitle>
                      {club.category && <CardDescription>{club.category}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">{club.club_description}</p>

                      <div className="space-y-2 pt-2">
                        {club.contact_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${club.contact_email}`} className="text-primary hover:underline">
                              {club.contact_email}
                            </a>
                          </div>
                        )}
                        {club.contact_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{club.contact_phone}</span>
                          </div>
                        )}
                        {club.website_url && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <a
                              href={club.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Users className="w-4 h-4" />
                        <span>{club.member_count} members</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar - Always show upcoming events */}
      <div className="lg:sticky lg:top-4 lg:h-fit space-y-4">
        <ClubUpcomingEvents />
      </div>

      {/* Edit Modal */}
      {ownClub && (
        <EditClubModal open={editModalOpen} onOpenChange={setEditModalOpen} club={ownClub} onSuccess={fetchClubs} />
      )}
    </div>
  );
}
