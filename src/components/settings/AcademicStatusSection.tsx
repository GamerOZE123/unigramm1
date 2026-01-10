import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Award, AlertCircle, Sparkles } from 'lucide-react';
import { useGraduationEligibility } from '@/hooks/useGraduationEligibility';
import { useYearEligibility } from '@/hooks/useYearEligibility';
import { AccountBadge } from '@/components/alumni/AccountBadge';
import GraduationWrappedModal from '@/components/alumni/GraduationWrappedModal';
import YearWrappedModal from '@/components/alumni/YearWrappedModal';

const yearButtonLabels: Record<string, string> = {
  '1st Year': '1st Year Complete ✨',
  '2nd Year': '2nd Year Complete 🚀',
  '3rd Year': '3rd Year Complete ⚡',
  '4th Year': 'I Graduated 🎓',
  '4nd Year': 'I Graduated 🎓',
  '5th Year': 'I Graduated 🎓',
  'Graduate': 'I Graduated 🎓',
  'PhD': 'I Graduated 🎓',
  'Final Year': 'I Graduated 🎓',
};

export const AcademicStatusSection = () => {
  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const [showYearWrappedModal, setShowYearWrappedModal] = useState(false);
  
  const { 
    canGraduate, 
    isFinalYear, 
    graduationButtonEnabled, 
    accountStatus, 
    academicYear,
    expectedGraduationYear,
    loading: graduationLoading 
  } = useGraduationEligibility();

  const {
    canCompleteYear,
    yearNumber,
    yearLabel,
    isGraduationYear,
    loading: yearLoading
  } = useYearEligibility();

  const loading = graduationLoading || yearLoading;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAlumni = accountStatus === 'alumni' || accountStatus === 'verified_alumni';
  const buttonLabel = academicYear ? yearButtonLabels[academicYear] || `${yearLabel} Complete ✨` : 'Year Complete ✨';

  const handleYearComplete = () => {
    if (isGraduationYear) {
      setShowWrappedModal(true);
    } else {
      setShowYearWrappedModal(true);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Academic Status
          </CardTitle>
          <CardDescription>
            Your academic journey and graduation status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">Current Status</p>
                <p className="text-sm text-muted-foreground">Your account type</p>
              </div>
            </div>
            <AccountBadge accountStatus={accountStatus} size="md" />
          </div>

          {/* Academic Year (for students) */}
          {!isAlumni && academicYear && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Academic Year</p>
                  <p className="text-sm text-muted-foreground">Your current year</p>
                </div>
              </div>
              <Badge variant="secondary">{academicYear}</Badge>
            </div>
          )}

          {/* Expected Graduation (for students) */}
          {!isAlumni && expectedGraduationYear && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Expected Graduation</p>
                  <p className="text-sm text-muted-foreground">Your expected graduation year</p>
                </div>
              </div>
              <Badge variant="outline">Class of {expectedGraduationYear}</Badge>
            </div>
          )}

          {/* Year Completion / Graduation Button - Only for eligible students */}
          {!isAlumni && (
            <div className="pt-4 border-t">
              {canCompleteYear || canGraduate ? (
                <div className="space-y-4">
                  <div className={`${isGraduationYear ? 'bg-primary/10 border-primary/20' : 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-500/20'} border rounded-lg p-4`}>
                    <div className="flex items-start gap-3">
                      {isGraduationYear ? (
                        <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-violet-500 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-medium ${isGraduationYear ? 'text-primary' : 'text-violet-600 dark:text-violet-400'}`}>
                          {isGraduationYear ? 'Ready to Graduate!' : `${yearLabel} Almost Done!`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isGraduationYear 
                            ? 'Congratulations on completing your academic journey. Click below to start your graduation process and transition to Alumni status.'
                            : `Celebrate your ${yearLabel?.toLowerCase()} journey! View your Year Wrapped and see all your achievements.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleYearComplete}
                    className={`w-full ${!isGraduationYear ? 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600' : ''}`}
                    size="lg"
                  >
                    {isGraduationYear ? (
                      <GraduationCap className="h-5 w-5 mr-2" />
                    ) : (
                      <Sparkles className="h-5 w-5 mr-2" />
                    )}
                    {buttonLabel}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Year Wrapped Not Available</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {!graduationButtonEnabled 
                            ? "Your university hasn't enabled Year Wrapped yet. Check back later!"
                            : "Complete your academic year to unlock Year Wrapped."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button disabled className="w-full" variant="outline">
                    <Sparkles className="h-5 w-5 mr-2" />
                    {buttonLabel}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Alumni Verification (for alumni) */}
          {isAlumni && accountStatus === 'alumni' && (
            <div className="pt-4 border-t space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">Become a Verified Alumni</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload your degree certificate or connect LinkedIn to get verified and unlock exclusive benefits.
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Award className="h-5 w-5 mr-2" />
                Start Verification
              </Button>
            </div>
          )}

          {/* Verified Alumni status */}
          {accountStatus === 'verified_alumni' && (
            <div className="pt-4 border-t">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">Verified Alumni ✓</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your alumni status has been verified. Thank you for being a trusted member of our community!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graduation Wrapped Modal (for final year students) */}
      <GraduationWrappedModal 
        open={showWrappedModal} 
        onClose={() => setShowWrappedModal(false)} 
      />

      {/* Year Wrapped Modal (for non-final year students) */}
      {yearNumber && yearLabel && (
        <YearWrappedModal 
          open={showYearWrappedModal} 
          onClose={() => setShowYearWrappedModal(false)}
          yearNumber={yearNumber}
          yearLabel={yearLabel}
          isGraduationYear={isGraduationYear}
        />
      )}
    </>
  );
};

export default AcademicStatusSection;
