import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, BookOpen, GraduationCap } from "lucide-react";

interface CourseInfo {
  course_name: string;
  duration_years: number;
  total_semesters: number;
  force_enable_graduation: boolean;
  universities?: { name: string };
}

interface CourseInfoCardProps {
  userId: string;
  compact?: boolean;
}

export function CourseInfoCard({ userId, compact = false }: CourseInfoCardProps) {
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseInfo = async () => {
      try {
        // First get the user's course_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("course_id")
          .eq("user_id", userId)
          .single();

        if (profileError || !profile?.course_id) {
          setLoading(false);
          return;
        }

        // Then get the course details
        const { data: course, error: courseError } = await supabase
          .from("university_courses")
          .select(`
            course_name,
            duration_years,
            total_semesters,
            force_enable_graduation,
            universities (name)
          `)
          .eq("id", profile.course_id)
          .single();

        if (courseError) throw courseError;
        setCourseInfo(course);
      } catch (error) {
        console.error("Error fetching course info:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCourseInfo();
    }
  }, [userId]);

  if (loading) {
    return null;
  }

  if (!courseInfo) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{courseInfo.duration_years} years • {courseInfo.total_semesters} semesters</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Course Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Program</span>
          <span className="font-medium">{courseInfo.course_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{courseInfo.duration_years} years</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Semesters</span>
          <span className="font-medium">{courseInfo.total_semesters} total</span>
        </div>
        {courseInfo.force_enable_graduation && (
          <div className="pt-2">
            <Badge className="bg-green-500/10 text-green-600 gap-1">
              <GraduationCap className="h-3 w-3" />
              Graduation Enabled
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
