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
    <div className="space-y-5">
      {clubs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Clubs
          </h3>
          <div className="space-y-2">
            {clubs.map((club) => (
              <Link
                key={club.id}
                to={`/clubs/${club.id}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/30 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{club.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{club.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {startups.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-accent" />
            Startups
          </h3>
          <div className="space-y-2">
            {startups.map((startup) => (
              <Link
                key={startup.id}
                to={`/startups/${startup.id}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-accent/30 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {startup.logo_url ? (
                    <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover" />
                  ) : (
                    <Rocket className="w-5 h-5 text-accent" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{startup.name}</p>
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
