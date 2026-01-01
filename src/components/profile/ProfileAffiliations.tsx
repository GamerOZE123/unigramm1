import { Link } from "react-router-dom";
import { Users, Rocket } from "lucide-react";

interface Club {
  id: string;
  name: string;
  logo_url?: string | null;
  role: string;
}

interface Startup {
  id: string;
  name: string;
  logo_url?: string | null;
  role: string;
}

interface ProfileAffiliationsProps {
  clubs: Club[];
  startups: Startup[];
}

export default function ProfileAffiliations({ clubs, startups }: ProfileAffiliationsProps) {
  if (clubs.length === 0 && startups.length === 0) return null;

  return (
    <div className="space-y-4 mt-6">
      {clubs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clubs
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {clubs.map((club) => (
              <Link
                key={club.id}
                to={`/clubs/${club.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{club.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{club.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {startups.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Startups
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {startups.map((startup) => (
              <Link
                key={startup.id}
                to={`/startups/${startup.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-accent/50 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {startup.logo_url ? (
                    <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover" />
                  ) : (
                    <Rocket className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{startup.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{startup.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
