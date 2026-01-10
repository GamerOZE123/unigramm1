import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Award, AlertCircle } from 'lucide-react';
import { useGraduationEligibility } from '@/hooks/useGraduationEligibility';
import { AccountBadge } from '@/components/alumni/AccountBadge';
import GraduationWrappedModal from '@/components/alumni/GraduationWrappedModal';

export const AcademicStatusSection = () => {
  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const { 
    canGraduate, 
    isFinalYear, 
    graduationButtonEnabled, 
    accountStatus, 
    academicYear,
    expectedGraduationYear,
    loading 
  } = useGraduationEligibility();

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

          {/* Graduation Button - Only for eligible students */}
          {!isAlumni && (
            <div className="pt-4 border-t">
              {canGraduate ? (
                <div className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-primary">Ready to Graduate!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Congratulations on completing your academic journey. Click below to start your graduation process and transition to Alumni status.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowWrappedModal(true)}
                    className="w-full"
                    size="lg"
                  >
                    <GraduationCap className="h-5 w-5 mr-2" />
                    I Graduated 🎓
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Graduation Not Available Yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {!isFinalYear 
                            ? "The graduation option will be available once you reach your final year."
                            : !graduationButtonEnabled 
                              ? "Your university hasn't enabled graduations yet. Check back later!"
                              : "You're not yet eligible to graduate."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button disabled className="w-full" variant="outline">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    I Graduated
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

      {/* Graduation Wrapped Modal */}
      <GraduationWrappedModal 
        open={showWrappedModal} 
        onClose={() => setShowWrappedModal(false)} 
      />
    </>
  );
};

export default AcademicStatusSection;
