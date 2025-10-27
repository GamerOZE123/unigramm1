import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useClubOnboarding, ClubOnboardingData } from '@/hooks/useClubOnboarding';
import ClubInfoStep from './onboarding/club/ClubInfoStep';
import ClubDescriptionStep from './onboarding/club/ClubDescriptionStep';
import ClubLogoStep from './onboarding/club/ClubLogoStep';
import ClubContactStep from './onboarding/club/ClubContactStep';

export default function ClubOnboardingFlow() {
  const navigate = useNavigate();
  const { saveClubProfile, loading } = useClubOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ClubOnboardingData>>({});

  const totalSteps = 4;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepData = (data: Partial<ClubOnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleComplete = async () => {
    const success = await saveClubProfile({
      club_name: formData.club_name || '',
      club_description: formData.club_description || '',
      logo_url: formData.logo_url,
      category: formData.category,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,
      website_url: formData.website_url
    });

    if (success) {
      navigate('/home');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ClubInfoStep
            onNext={handleNext}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 2:
        return (
          <ClubDescriptionStep
            onNext={handleNext}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 3:
        return (
          <ClubLogoStep
            onNext={handleNext}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 4:
        return (
          <ClubContactStep
            onNext={handleComplete}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {renderStep()}

        {loading && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}
