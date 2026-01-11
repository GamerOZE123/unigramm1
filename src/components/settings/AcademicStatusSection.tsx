import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Award, AlertCircle, Sparkles, MessageSquare, CheckCircle, Clock, FileCheck, Leaf, Flower2, History, Lock } from 'lucide-react';
import { useGraduationEligibility } from '@/hooks/useGraduationEligibility';
import { useYearEligibility } from '@/hooks/useYearEligibility';
import { useSemesterProgress } from '@/hooks/useSemesterProgress';
import { AccountBadge } from '@/components/alumni/AccountBadge';
import GraduationWrappedModal from '@/components/alumni/GraduationWrappedModal';
import YearWrappedModal from '@/components/alumni/YearWrappedModal';
import SemesterWrappedModal from '@/components/alumni/SemesterWrappedModal';
import AlumniVerificationModal from '@/components/alumni/AlumniVerificationModal';
import UniversityReviewModal from '@/components/alumni/UniversityReviewModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

const semesterLabels = {
  fall: { label: 'Fall Semester Done 🍂', icon: Leaf, gradient: 'from-orange-500 to-amber-500' },
  spring: { label: 'Spring Semester Done 🌸', icon: Flower2, gradient: 'from-pink-500 to-rose-500' },
};

interface VerificationStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  verificationType?: string;
  submittedAt?: string;
}

export const AcademicStatusSection = () => {
  const { user } = useAuth();
  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const [showYearWrappedModal, setShowYearWrappedModal] = useState(false);
  const [showSemesterWrappedModal, setShowSemesterWrappedModal] = useState(false);
  const [showPastSemesterModal, setShowPastSemesterModal] = useState(false);
  const [pastSemesterToView, setPastSemesterToView] = useState<{ semesterNumber: number; semesterType: 'fall' | 'spring' } | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({ status: 'none' });
  const [hasReviewed, setHasReviewed] = useState(false);
  
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
    forceEnableGraduation: yearForceGraduation,
    loading: yearLoading
  } = useYearEligibility();

  const {
    currentSemester,
    semesterNumber,
    completeSemester,
    completedSemesters,
    cooldownActive,
    cooldownEndsAt,
    lastCompletedSemester,
    hasMissedSemester,
    canCompleteSemester,
    semesterStartDate,
    forceEnableGraduation: semesterForceGraduation,
    loading: semesterLoading
  } = useSemesterProgress();

  // If any hook returns forceEnableGraduation, we show only graduation
  const forceEnableGraduation = yearForceGraduation || semesterForceGraduation;

  const loading = graduationLoading || yearLoading || semesterLoading;

  // Fetch verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('alumni_verifications')
        .select('status, verification_type, submitted_at')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setVerificationStatus({
          status: data.status as 'pending' | 'approved' | 'rejected',
          verificationType: data.verification_type,
          submittedAt: data.submitted_at,
        });
      }
    };

    // Check if user has left a review
    const checkReview = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();

      if (profile?.university) {
        const { data, error } = await supabase
          .from('university_reviews')
          .select('id')
          .eq('user_id', user.id)
          .eq('university', profile.university)
          .maybeSingle();

        if (!error && data) {
          setHasReviewed(true);
        }
      }
    };

    fetchVerificationStatus();
    checkReview();
  }, [user]);

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
  const semesterInfo = currentSemester ? semesterLabels[currentSemester] : null;

  const handleYearComplete = () => {
    if (isGraduationYear) {
      setShowWrappedModal(true);
    } else {
      setShowYearWrappedModal(true);
    }
  };

  const handleSemesterComplete = () => {
    setShowSemesterWrappedModal(true);
  };

  const handleSemesterCompleted = () => {
    if (semesterNumber && currentSemester) {
      completeSemester(semesterNumber, currentSemester);
    }
  };

  const handleViewPastSemester = (semNum: number, semType: 'fall' | 'spring') => {
    setPastSemesterToView({ semesterNumber: semNum, semesterType: semType });
    setShowPastSemesterModal(true);
  };

  const formatCooldownDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilCooldownEnds = (): number => {
    if (!cooldownEndsAt) return 0;
    const now = new Date();
    const diff = cooldownEndsAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const renderVerificationStatus = () => {
    switch (verificationStatus.status) {
      case 'pending':
        return (
          <div className="flex items-center justify-between p-4 border rounded-lg border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-600 dark:text-amber-400">Verification Pending</p>
                <p className="text-sm text-muted-foreground">
                  We're reviewing your {verificationStatus.verificationType} submission
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500/50 text-amber-600">
              In Review
            </Badge>
          </div>
        );
      case 'approved':
        return null; // Will show verified alumni status instead
      case 'rejected':
        return (
          <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Verification Not Approved</p>
                <p className="text-sm text-muted-foreground">
                  Please try again with different documents
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowVerificationModal(true)}>
              Retry
            </Button>
          </div>
        );
      default:
        return null;
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

          {/* Semester Completion - Only for students, hidden when forceEnableGraduation is true */}
          {!isAlumni && !forceEnableGraduation && currentSemester && semesterInfo && (
            <div className="pt-4 border-t">
              <div className="space-y-4">
                {/* Past Semesters Button */}
                {completedSemesters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {completedSemesters.map((completed) => (
                      <Button
                        key={completed.semesterNumber}
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPastSemester(completed.semesterNumber, completed.semesterType)}
                        className="text-xs"
                      >
                        <History className="h-3 w-3 mr-1" />
                        View {completed.semesterType === 'fall' ? 'Fall' : 'Spring'} #{Math.ceil(completed.semesterNumber / 2)} Wrap
                      </Button>
                    ))}
                  </div>
                )}

                {/* Cooldown State */}
                {cooldownActive ? (
                  <div className="bg-muted/50 border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Semester Wrapped Locked</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Available in {getDaysUntilCooldownEnds()} days ({formatCooldownDate(cooldownEndsAt)})
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Complete your next semester to unlock your wrapped experience!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : !canCompleteSemester ? (
                  <>
                    <div className="bg-muted/50 border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Semester Not Started Yet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your {currentSemester === 'fall' ? 'Fall' : 'Spring'} semester starts{' '}
                            {semesterStartDate ? semesterStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'soon'}.
                            Check back then!
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      disabled
                      className={`w-full bg-gradient-to-r ${semesterInfo.gradient} opacity-50 cursor-not-allowed`}
                      size="lg"
                    >
                      <semesterInfo.icon className="h-5 w-5 mr-2" />
                      {semesterInfo.label}
                    </Button>
                  </>
                ) : hasMissedSemester ? (
                  <>
                    <div className="bg-muted/50 border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Complete Your Previous Semester First</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            You need to complete your {currentSemester === 'fall' ? 'Fall' : 'Spring'} semester before moving on. 
                            Click below when you're ready!
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSemesterComplete}
                      className={`w-full bg-gradient-to-r ${semesterInfo.gradient} hover:opacity-90`}
                      size="lg"
                    >
                      <semesterInfo.icon className="h-5 w-5 mr-2" />
                      {semesterInfo.label}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className={`bg-gradient-to-r ${semesterInfo.gradient}/10 border border-${currentSemester === 'fall' ? 'orange' : 'pink'}-500/20 rounded-lg p-4`}>
                      <div className="flex items-start gap-3">
                        <semesterInfo.icon className={`h-5 w-5 ${currentSemester === 'fall' ? 'text-orange-500' : 'text-pink-500'} mt-0.5`} />
                        <div>
                          <p className={`font-medium ${currentSemester === 'fall' ? 'text-orange-600 dark:text-orange-400' : 'text-pink-600 dark:text-pink-400'}`}>
                            {currentSemester === 'fall' ? 'Fall' : 'Spring'} Semester
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Complete your {currentSemester === 'fall' ? 'fall' : 'spring'} semester and view your Semester Wrapped!
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSemesterComplete}
                      className={`w-full bg-gradient-to-r ${semesterInfo.gradient} hover:opacity-90`}
                      size="lg"
                    >
                      <semesterInfo.icon className="h-5 w-5 mr-2" />
                      {semesterInfo.label}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Force Graduation Button - For courses with force_enable_graduation flag */}
          {!isAlumni && forceEnableGraduation && canGraduate && (
            <div className="pt-4 border-t">
              <div className="space-y-4">
                <div className="bg-primary/10 border-primary/20 border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-primary">Ready to Graduate!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your course allows direct graduation. Click below to start your graduation process and transition to Alumni status.
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowWrappedModal(true)}
                  size="lg"
                  className="w-full"
                >
                  <GraduationCap className="h-5 w-5 mr-2" />
                  I Graduated 🎓
                </Button>
              </div>
            </div>
          )}

          {/* Year Completion / Graduation Button - Only for eligible students who can complete semesters (not for forceEnableGraduation) */}
          {!isAlumni && !forceEnableGraduation && canCompleteSemester && (
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
              {/* Show verification status if exists */}
              {renderVerificationStatus()}

              {/* Show verification CTA if not pending */}
              {verificationStatus.status !== 'pending' && (
                <>
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
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowVerificationModal(true)}
                  >
                    <FileCheck className="h-5 w-5 mr-2" />
                    Start Verification
                  </Button>
                </>
              )}

              {/* University Review CTA */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">
                      {hasReviewed ? 'Update Your Review' : 'Share Your Experience'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasReviewed 
                        ? 'Edit your university review to help future students.'
                        : 'Help prospective students by sharing your university experience.'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowReviewModal(true)}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                {hasReviewed ? 'Edit My Review' : 'Write a Review'}
              </Button>
            </div>
          )}

          {/* Verified Alumni status */}
          {accountStatus === 'verified_alumni' && (
            <div className="pt-4 border-t space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">Verified Alumni ✓</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your alumni status has been verified. Thank you for being a trusted member of our community!
                    </p>
                  </div>
                </div>
              </div>

              {/* University Review CTA for verified alumni */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">
                      {hasReviewed ? 'Update Your Review' : 'Share Your Experience'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasReviewed 
                        ? 'Edit your university review to help future students.'
                        : 'Help prospective students by sharing your university experience.'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowReviewModal(true)}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                {hasReviewed ? 'Edit My Review' : 'Write a Review'}
              </Button>
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

      {/* Semester Wrapped Modal */}
      {yearNumber && yearLabel && currentSemester && semesterNumber && (
        <SemesterWrappedModal
          open={showSemesterWrappedModal}
          onClose={() => setShowSemesterWrappedModal(false)}
          semesterType={currentSemester}
          semesterNumber={semesterNumber}
          yearLabel={yearLabel}
          yearNumber={yearNumber}
          onSemesterComplete={handleSemesterCompleted}
        />
      )}

      {/* Past Semester Wrapped Modal */}
      {pastSemesterToView && yearNumber && yearLabel && (
        <SemesterWrappedModal
          open={showPastSemesterModal}
          onClose={() => {
            setShowPastSemesterModal(false);
            setPastSemesterToView(null);
          }}
          semesterType={pastSemesterToView.semesterType}
          semesterNumber={pastSemesterToView.semesterNumber}
          yearLabel={yearLabel}
          yearNumber={yearNumber}
          viewOnly={true}
        />
      )}

      {/* Alumni Verification Modal */}
      <AlumniVerificationModal
        open={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={() => {
          setVerificationStatus({ status: 'pending' });
        }}
      />

      {/* University Review Modal */}
      <UniversityReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => setHasReviewed(true)}
      />
    </>
  );
};

export default AcademicStatusSection;
