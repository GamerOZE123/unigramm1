import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft } from 'lucide-react';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { MajorStep } from './onboarding/MajorStep';
import { AcademicTimelineStep } from './onboarding/AcademicTimelineStep';
import { ProfilePictureStep } from './onboarding/ProfilePictureStep';
import { BannerStep } from './onboarding/BannerStep';
import { InterestsStep } from './onboarding/InterestsStep';
import { EventPreferencesStep } from './onboarding/EventPreferencesStep';
import { SocialLinksStep } from './onboarding/SocialLinksStep';
import { CampusGroupsStep } from './onboarding/CampusGroupsStep';
import { StatusMessageStep } from './onboarding/StatusMessageStep';
import { BioStep } from './onboarding/BioStep';
import { SkillsStep } from './onboarding/SkillsStep';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCompletionFlowProps {
  open: boolean;
  onComplete: () => void;
}

export const ProfileCompletionFlow = ({ open, onComplete }: ProfileCompletionFlowProps) => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState<string | null>(null);
  const {
    currentStep,
    formData,
    setFormData,
    saveStep,
    saveSkillsStep,
    completeOnboarding,
    nextStep,
    prevStep,
    skipStep,
    loading
  } = useProfileCompletion();

  // Fetch user's university on mount
  useEffect(() => {
    const fetchUniversity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('university')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.university) {
          setUniversity(profile.university);
        }
      }
    };
    fetchUniversity();
  }, []);

  const totalSteps = 11;
  const progress = (currentStep / totalSteps) * 100;

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.major !== '';
      case 2:
        return formData.academic_year !== '' && formData.expected_graduation_year !== null;
      case 5:
        return formData.interests.length >= 3;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    let stepData = {};
    
    switch (currentStep) {
      case 1:
        stepData = { 
          major: formData.major,
          course_id: formData.course_id
        };
        break;
      case 2:
        stepData = { 
          academic_year: formData.academic_year,
          start_year: formData.start_year,
          expected_graduation_year: formData.expected_graduation_year
        };
        break;
      case 3:
        stepData = { bio: formData.bio };
        break;
      case 4:
        stepData = { avatar_url: formData.avatar_url };
        break;
      case 5:
        stepData = { interests: formData.interests };
        break;
      case 6:
        await saveSkillsStep(formData.skills);
        nextStep();
        return;
      case 7:
        stepData = { preferred_event_types: formData.preferred_event_types };
        break;
      case 8:
        stepData = {
          linkedin_url: formData.linkedin_url,
          instagram_url: formData.instagram_url,
          twitter_url: formData.twitter_url,
          website_url: formData.website_url
        };
        break;
      case 9:
        stepData = { campus_groups: formData.campus_groups };
        break;
      case 10:
        stepData = { banner_url: formData.banner_url };
        break;
      case 11:
        stepData = { status_message: formData.status_message };
        break;
    }

    await saveStep(stepData);
    
    if (currentStep < totalSteps) {
      nextStep();
    }
  };

  const handleFinish = async () => {
    await saveStep({ status_message: formData.status_message });
    const success = await completeOnboarding();
    
    if (success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success('Welcome to Unigramm! Your profile is complete.');
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <MajorStep
            value={formData.major}
            onChange={(value) => setFormData({ ...formData, major: value })}
            courseId={formData.course_id}
            onCourseChange={(courseId, course) => {
              setFormData({ 
                ...formData, 
                course_id: courseId,
                course_duration_years: course?.duration_years || null,
                course_total_semesters: course?.total_semesters || null
              });
            }}
            university={university}
          />
        );
      case 2:
        return (
          <AcademicTimelineStep
            startYear={formData.start_year}
            expectedGraduationYear={formData.expected_graduation_year}
            academicYear={formData.academic_year}
            onStartYearChange={(year) => {
              // Auto-calculate expected graduation year if course duration is set
              const expectedGradYear = formData.course_duration_years 
                ? year + formData.course_duration_years 
                : formData.expected_graduation_year;
              setFormData({ 
                ...formData, 
                start_year: year,
                expected_graduation_year: expectedGradYear
              });
            }}
            onExpectedGraduationYearChange={(year) => setFormData({ ...formData, expected_graduation_year: year })}
            onAcademicYearChange={(year) => setFormData({ ...formData, academic_year: year })}
            courseDurationYears={formData.course_duration_years}
          />
        );
      case 3:
        return (
          <BioStep
            value={formData.bio}
            onChange={(value) => setFormData({ ...formData, bio: value })}
          />
        );
      case 4:
        return (
          <ProfilePictureStep
            value={formData.avatar_url}
            onChange={(value) => setFormData({ ...formData, avatar_url: value })}
          />
        );
      case 5:
        return (
          <InterestsStep
            value={formData.interests}
            onChange={(value) => setFormData({ ...formData, interests: value })}
          />
        );
      case 6:
        return (
          <SkillsStep
            value={formData.skills}
            onChange={(value) => setFormData({ ...formData, skills: value })}
          />
        );
      case 7:
        return (
          <EventPreferencesStep
            value={formData.preferred_event_types}
            onChange={(value) => setFormData({ ...formData, preferred_event_types: value })}
          />
        );
      case 8:
        return (
          <SocialLinksStep
            linkedin={formData.linkedin_url}
            instagram={formData.instagram_url}
            twitter={formData.twitter_url}
            website={formData.website_url}
            onChange={(field, value) => setFormData({ ...formData, [field]: value })}
          />
        );
      case 9:
        return (
          <CampusGroupsStep
            value={formData.campus_groups}
            onChange={(value) => setFormData({ ...formData, campus_groups: value })}
          />
        );
      case 10:
        return (
          <BannerStep
            value={formData.banner_url}
            onChange={(value) => setFormData({ ...formData, banner_url: value })}
          />
        );
      case 11:
        return (
          <StatusMessageStep
            value={formData.status_message}
            onChange={(value) => setFormData({ ...formData, status_message: value })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {renderStep()}

          <div className="flex flex-col gap-4 pt-4">
            <div className="flex justify-between gap-3">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep} disabled={loading}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              
              <div className="flex-1" />
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid() || loading}
                >
                  Next
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={loading}>
                  Finish
                </Button>
              )}
            </div>

            {currentStep !== 1 && currentStep !== 2 && currentStep !== 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={skipStep}
                className="text-muted-foreground text-sm"
                disabled={loading}
              >
                I'll do this later
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
