import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface UniversityCourse {
  id: string;
  course_name: string;
  duration_years: number;
  total_semesters: number;
}

interface MajorStepProps {
  value: string;
  onChange: (value: string) => void;
  courseId?: string | null;
  onCourseChange?: (courseId: string | null, course: UniversityCourse | null) => void;
  university?: string | null;
}

// Fallback majors when no courses are configured for the university
const fallbackMajorOptions = [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Medicine',
  'Law',
  'Arts & Humanities',
  'Natural Sciences',
  'Social Sciences',
  'Mathematics',
  'Architecture',
  'Education',
  'Other'
];

export const MajorStep = ({ value, onChange, courseId, onCourseChange, university }: MajorStepProps) => {
  const [courses, setCourses] = useState<UniversityCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      
      if (!university) {
        setUseFallback(true);
        setLoading(false);
        return;
      }

      try {
        // First get university id by name or abbreviation
        const { data: universityData } = await supabase
          .from('universities')
          .select('id')
          .or(`abbreviation.eq.${university},name.eq.${university}`)
          .maybeSingle();

        if (!universityData) {
          setUseFallback(true);
          setLoading(false);
          return;
        }

        // Fetch courses for this university
        const { data: coursesData, error } = await supabase
          .from('university_courses')
          .select('id, course_name, duration_years, total_semesters')
          .eq('university_id', universityData.id)
          .order('course_name');

        if (error) throw error;

        if (coursesData && coursesData.length > 0) {
          setCourses(coursesData);
          setUseFallback(false);
        } else {
          setUseFallback(true);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setUseFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [university]);

  const handleCourseSelect = (course: UniversityCourse) => {
    onChange(course.course_name);
    onCourseChange?.(course.id, course);
  };

  const handleFallbackSelect = (major: string) => {
    onChange(major);
    onCourseChange?.(null, null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">What's your major?</h2>
          <p className="text-muted-foreground">Help us understand your field of study</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What's your major?</h2>
        <p className="text-muted-foreground">
          {useFallback 
            ? 'Help us understand your field of study' 
            : 'Select your course to set up your academic timeline'}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
        {useFallback ? (
          // Fallback to static majors
          fallbackMajorOptions.map((major) => (
            <Card
              key={major}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary",
                value === major && "border-primary bg-primary/5"
              )}
              onClick={() => handleFallbackSelect(major)}
            >
              <div className="text-center">
                <p className="font-medium">{major}</p>
              </div>
            </Card>
          ))
        ) : (
          // Dynamic courses from database
          courses.map((course) => (
            <Card
              key={course.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary",
                (courseId === course.id || value === course.course_name) && "border-primary bg-primary/5"
              )}
              onClick={() => handleCourseSelect(course)}
            >
              <div className="text-center space-y-1">
                <p className="font-medium">{course.course_name}</p>
                <p className="text-xs text-muted-foreground">
                  {course.duration_years} years • {course.total_semesters} semesters
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      {!useFallback && courses.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">
            📚 Course duration will automatically set your expected graduation year
          </p>
        </div>
      )}
    </div>
  );
};
