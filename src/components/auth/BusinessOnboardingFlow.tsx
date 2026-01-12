import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessInfoStep from './onboarding/business/BusinessInfoStep';
import BusinessDescriptionStep from './onboarding/business/BusinessDescriptionStep';
import BusinessLogoStep from './onboarding/business/BusinessLogoStep';
import BusinessContactStep from './onboarding/business/BusinessContactStep';
import SubscriptionSelectionStep from './onboarding/business/SubscriptionSelectionStep';
import { useBusinessOnboarding, BusinessOnboardingData } from '@/hooks/useBusinessOnboarding';
import { Progress } from '@/components/ui/progress';

const TOTAL_STEPS = 5;

export default function BusinessOnboardingFlow() {
  const navigate = useNavigate();
  const { saveBusinessProfile, loading } = useBusinessOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<BusinessOnboardingData>>({});

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepData = (stepData: Partial<BusinessOnboardingData>) => {
    setFormData({ ...formData, ...stepData });
  };

  const handleComplete = async (finalStepData: Partial<BusinessOnboardingData>) => {
    const completeData = { ...formData, ...finalStepData } as BusinessOnboardingData;
    const success = await saveBusinessProfile(completeData);
    if (success) {
      navigate('/advertising');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessInfoStep
            onNext={handleNext}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 2:
        return (
          <BusinessDescriptionStep
            onNext={handleNext}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 3:
        return (
          <BusinessLogoStep
            onNext={handleNext}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 4:
        return (
          <BusinessContactStep
            onNext={handleNext}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 5:
        return (
          <SubscriptionSelectionStep
            onComplete={handleComplete}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Complete Your Business Profile</h1>
          <p className="text-center text-muted-foreground mb-4">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        {renderStep()}
      </div>
    </div>
  );
}
