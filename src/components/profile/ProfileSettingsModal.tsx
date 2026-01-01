import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Upload, User, Image, Link, Sparkles, Plus, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: () => void;
  initialTab?: string;
}

const INTEREST_OPTIONS = [
  "Technology", "Sports", "Music", "Art", "Science", "Business",
  "Gaming", "Photography", "Travel", "Cooking", "Fitness", "Reading",
  "Writing", "Movies", "Fashion", "Environment", "Politics", "History"
];

const SKILL_OPTIONS = [
  "JavaScript", "Python", "React", "TypeScript", "Node.js",
  "Java", "C++", "Data Analysis", "Machine Learning", "UI/UX Design",
  "Graphic Design", "Video Editing", "Content Writing", "Marketing",
  "Public Speaking", "Leadership", "Project Management", "Research"
];

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  onProfileUpdate,
  initialTab = "basic",
}: ProfileSettingsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Basic Info
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Media
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerPosition, setBannerPosition] = useState(50);

  // Social Links
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Interests & Skills
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && user) {
      fetchAllData();
    }
  }, [isOpen, user]);

  const fetchAllData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setUniversity(profile.university || "");
        setMajor(profile.major || "");
        setStatusMessage(profile.status_message || "");
        setAvatarUrl(profile.avatar_url || "");
        setBannerUrl(profile.banner_url || "");
        setBannerPosition(profile.banner_position || 50);
        setLinkedinUrl(profile.linkedin_url || "");
        setInstagramUrl(profile.instagram_url || "");
        setTwitterUrl(profile.twitter_url || "");
        setWebsiteUrl(profile.website_url || "");
        setInterests(profile.interests || []);
      }

      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("skills")
        .eq("user_id", user.id)
        .single();

      if (studentProfile) {
        setSkills(studentProfile.skills || []);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(publicUrlData?.publicUrl || "");
      toast.success("Avatar uploaded!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/banner_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("profile-banner").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from("profile-banner").getPublicUrl(fileName);
      setBannerUrl(publicUrlData?.publicUrl || "");
      toast.success("Banner uploaded!");
    } catch (error) {
      console.error("Banner upload error:", error);
      toast.error("Failed to upload banner");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else if (interests.length < 10) {
      setInterests([...interests, interest]);
    }
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed) && interests.length < 10) {
      setInterests([...interests, trimmed]);
      setCustomInterest("");
    }
  };

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else if (skills.length < 10) {
      setSkills([...skills, skill]);
    }
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 10) {
      setSkills([...skills, trimmed]);
      setCustomSkill("");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
          bio,
          university,
          major,
          status_message: statusMessage,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          banner_position: bannerPosition,
          linkedin_url: linkedinUrl,
          instagram_url: instagramUrl,
          twitter_url: twitterUrl,
          website_url: websiteUrl,
          interests,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update or insert student_profiles
      const { data: existingStudent } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingStudent) {
        await supabase
          .from("student_profiles")
          .update({ skills })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("student_profiles")
          .insert({ user_id: user.id, skills });
      }

      toast.success("Profile updated successfully");
      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basic" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="interests" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Interests</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Your university"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Your major"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Message</Label>
              <Input
                id="status"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={100}
              />
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6 mt-4">
            {/* Avatar */}
            <div className="space-y-3">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-xl">
                      {fullName?.charAt(0) || username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Upload a profile picture</p>
                  <p className="text-xs">JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="space-y-3">
              <Label>Banner Image</Label>
              {bannerUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border" style={{ aspectRatio: "3/1" }}>
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `center ${bannerPosition}%` }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-7 h-7"
                      onClick={() => setBannerUrl("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Position:</Label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={bannerPosition}
                      onChange={(e) => setBannerPosition(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground min-w-[40px]">{bannerPosition}%</span>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload banner</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              )}
            </div>
          </TabsContent>

          {/* Social Links Tab */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input
                id="instagram"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X URL</Label>
              <Input
                id="twitter"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Personal Website</Label>
              <Input
                id="website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </TabsContent>

          {/* Interests & Skills Tab */}
          <TabsContent value="interests" className="space-y-6 mt-4">
            {/* Interests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Interests</Label>
                <span className="text-xs text-muted-foreground">{interests.length}/10</span>
              </div>

              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="default" className="flex items-center gap-1">
                      {interest}
                      <button onClick={() => toggleInterest(interest)} className="hover:bg-primary-foreground/20 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomInterest())}
                  placeholder="Add custom interest..."
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addCustomInterest} disabled={interests.length >= 10}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.filter((i) => !interests.includes(i)).slice(0, 8).map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className={`cursor-pointer hover:bg-primary hover:text-primary-foreground ${interests.length >= 10 ? "opacity-50" : ""}`}
                    onClick={() => interests.length < 10 && toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Skills</Label>
                <span className="text-xs text-muted-foreground">{skills.length}/10</span>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button onClick={() => toggleSkill(skill)} className="hover:bg-muted rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                  placeholder="Add custom skill..."
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addCustomSkill} disabled={skills.length >= 10}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.filter((s) => !skills.includes(s)).slice(0, 8).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className={`cursor-pointer hover:bg-secondary ${skills.length >= 10 ? "opacity-50" : ""}`}
                    onClick={() => skills.length < 10 && toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
