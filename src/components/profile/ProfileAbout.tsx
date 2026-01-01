import { Badge } from "@/components/ui/badge";
import { GraduationCap, Briefcase, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  start_year?: string;
  end_year?: string;
}

interface WorkExperience {
  company?: string;
  position?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

interface ProfileAboutProps {
  education?: Education[] | null;
  workExperience?: WorkExperience[] | null;
  campusGroups?: string[] | null;
  joinedAt?: string | null;
  location?: string | null;
  certificates?: string[] | null;
}

export default function ProfileAbout({
  education,
  workExperience,
  campusGroups,
  joinedAt,
  location,
  certificates,
}: ProfileAboutProps) {
  const hasEducation = education && education.length > 0;
  const hasWorkExperience = workExperience && workExperience.length > 0;
  const hasCampusGroups = campusGroups && campusGroups.length > 0;
  const hasCertificates = certificates && certificates.length > 0;

  return (
    <div className="space-y-6 py-4">
      {/* Quick Info */}
      <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
        {location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}
        {joinedAt && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Joined {format(new Date(joinedAt), "MMMM yyyy")}</span>
          </div>
        )}
      </div>

      {/* Education */}
      {hasEducation && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Education
          </h3>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index} className="border-l-2 border-primary/30 pl-3">
                <p className="font-medium text-foreground">{edu.institution}</p>
                <p className="text-sm text-muted-foreground">
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </p>
                {(edu.start_year || edu.end_year) && (
                  <p className="text-xs text-muted-foreground">
                    {edu.start_year} - {edu.end_year || "Present"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {hasWorkExperience && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-accent" />
            Experience
          </h3>
          <div className="space-y-3">
            {workExperience.map((exp, index) => (
              <div key={index} className="border-l-2 border-accent/30 pl-3">
                <p className="font-medium text-foreground">{exp.position}</p>
                <p className="text-sm text-muted-foreground">{exp.company}</p>
                {exp.description && <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {hasCertificates && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Certificates</h3>
          <div className="flex flex-wrap gap-2">
            {certificates.map((cert) => (
              <Badge key={cert} variant="outline" className="border-primary/30 text-primary">
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Campus Groups */}
      {hasCampusGroups && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Campus Groups
          </h3>
          <div className="flex flex-wrap gap-2">
            {campusGroups.map((group) => (
              <Badge key={group} variant="secondary" className="bg-muted text-muted-foreground">
                {group}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasEducation && !hasWorkExperience && !hasCampusGroups && !hasCertificates && !location && !joinedAt && (
        <div className="text-center py-8 text-muted-foreground">No additional information available</div>
      )}
    </div>
  );
}
