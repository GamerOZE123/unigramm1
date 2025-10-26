import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyInfoStep from './onboarding/company/CompanyInfoStep';
import CompanyDescriptionStep from './onboarding/company/CompanyDescriptionStep';
import CompanyLogoStep from './onboarding/company/CompanyLogoStep';
import CompanyContactStep from './onboarding/company/CompanyContactStep';
import SubscriptionSelectionStep from './onboarding/company/SubscriptionSelectionStep';
import { useCompanyOnboarding, CompanyOnboardingData } from '@/hooks/useCompanyOnboarding';
import { Progress } from '@/components/ui/progress';

const TOTAL_STEPS = 5;

export default function CompanyOnboardingFlow() {
  const navigate = useNavigate();
  const { saveCompanyProfile, loading } = useCompanyOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CompanyOnboardingData>>({});

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

  const handleStepData = (stepData: Partial<CompanyOnboardingData>) => {
    setFormData({ ...formData, ...stepData });
  };

  const handleComplete = async (finalStepData: Partial<CompanyOnboardingData>) => {
    const completeData = { ...formData, ...finalStepData } as CompanyOnboardingData;
    const success = await saveCompanyProfile(completeData);
    if (success) {
      navigate('/advertising');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanyInfoStep
            onNext={handleNext}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 2:
        return (
          <CompanyDescriptionStep
            onNext={handleNext}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 3:
        return (
          <CompanyLogoStep
            onNext={handleNext}
            onBack={handleBack}
            onData={handleStepData}
            initialData={formData}
          />
        );
      case 4:
        return (
          <CompanyContactStep
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
          <h1 className="text-3xl font-bold text-center mb-2">Complete Your Company Profile</h1>
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
