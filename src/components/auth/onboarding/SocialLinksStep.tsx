import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Linkedin, Instagram, Twitter, Globe } from 'lucide-react';

interface SocialLinksStepProps {
  linkedin: string;
  instagram: string;
  twitter: string;
  website: string;
  onChange: (field: string, value: string) => void;
}

export const SocialLinksStep = ({ linkedin, instagram, twitter, website, onChange }: SocialLinksStepProps) => {
  const formatInstagramHandle = (value: string) => {
    const cleaned = value.replace('@', '');
    return cleaned ? `@${cleaned}` : '';
  };

  const formatTwitterHandle = (value: string) => {
    const cleaned = value.replace('@', '');
    return cleaned ? `@${cleaned}` : '';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Connect your social profiles</h2>
        <p className="text-muted-foreground">Optional - Skip if you prefer</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-blue-600" />
            LinkedIn Profile
          </Label>
          <Input
            id="linkedin"
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={linkedin}
            onChange={(e) => onChange('linkedin_url', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-pink-600" />
            Instagram Handle
          </Label>
          <Input
            id="instagram"
            placeholder="@yourhandle"
            value={instagram}
            onChange={(e) => onChange('instagram_url', formatInstagramHandle(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4 text-sky-500" />
            Twitter Handle
          </Label>
          <Input
            id="twitter"
            placeholder="@yourhandle"
            value={twitter}
            onChange={(e) => onChange('twitter_url', formatTwitterHandle(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Personal Website
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://yourwebsite.com"
            value={website}
            onChange={(e) => onChange('website_url', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
