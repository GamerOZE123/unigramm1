import { Linkedin, Instagram, Twitter, Globe, Github, Briefcase } from "lucide-react";

interface ProfileSocialLinksProps {
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

export default function ProfileSocialLinks({
  linkedinUrl,
  instagramUrl,
  twitterUrl,
  websiteUrl,
  githubUrl,
  portfolioUrl,
}: ProfileSocialLinksProps) {
  const links = [
    { url: linkedinUrl, icon: Linkedin, label: "LinkedIn", color: "hover:text-[#0077b5]" },
    { url: instagramUrl, icon: Instagram, label: "Instagram", color: "hover:text-[#E4405F]" },
    { url: twitterUrl, icon: Twitter, label: "Twitter", color: "hover:text-[#1DA1F2]" },
    { url: websiteUrl, icon: Globe, label: "Website", color: "hover:text-primary" },
    { url: githubUrl, icon: Github, label: "GitHub", color: "hover:text-foreground" },
    { url: portfolioUrl, icon: Briefcase, label: "Portfolio", color: "hover:text-accent" },
  ].filter((link) => link.url);

  if (links.length === 0) return null;

  return (
    <div className="flex justify-center gap-4 mt-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url!}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2 rounded-full bg-muted/50 text-muted-foreground transition-all duration-200 ${link.color}`}
          aria-label={link.label}
        >
          <link.icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
}
