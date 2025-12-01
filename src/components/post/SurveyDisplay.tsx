import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface SurveyQuestion {
  text: string;
  type: 'text' | 'rating' | 'multiple_choice';
  choices?: string[];
}

interface SurveyDisplayProps {
  questions: SurveyQuestion[];
}

export default function SurveyDisplay({ questions: initialQuestions }: SurveyDisplayProps) {
  // Safely parse questions if it's a string
  const parsedQuestions = typeof initialQuestions === 'string' 
    ? JSON.parse(initialQuestions) 
    : Array.isArray(initialQuestions) 
    ? initialQuestions 
    : [];
  const questions = parsedQuestions;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const handleSubmit = () => {
    // Check if all questions are answered
    const allAnswered = questions.every((_, index) => answers[index]);
    
    if (!allAnswered) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitted(true);
    toast.success('Survey submitted!');
  };

  if (submitted) {
    return (
      <Card className="bg-muted/20 p-6 text-center">
        <p className="text-lg font-semibold text-foreground mb-2">Thank you for completing the survey!</p>
        <p className="text-sm text-muted-foreground">Your responses have been recorded.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/20 p-4 space-y-4">
      {questions.map((question, index) => (
        <div key={index} className="space-y-2">
          <Label className="text-base font-semibold text-foreground">
            {index + 1}. {question.text}
          </Label>

          {question.type === 'text' && (
            <Textarea
              placeholder="Your answer..."
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="bg-background"
            />
          )}

          {question.type === 'rating' && (
            <RadioGroup
              value={answers[index]}
              onValueChange={(value) => handleAnswerChange(index, value)}
            >
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={rating.toString()} id={`q${index}-r${rating}`} />
                    <Label htmlFor={`q${index}-r${rating}`}>{rating}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {question.type === 'multiple_choice' && question.choices && (
            <RadioGroup
              value={answers[index]}
              onValueChange={(value) => handleAnswerChange(index, value)}
            >
              <div className="space-y-2">
                {question.choices.map((choice, choiceIndex) => (
                  <div key={choiceIndex} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={choice} 
                      id={`q${index}-c${choiceIndex}`} 
                    />
                    <Label 
                      htmlFor={`q${index}-c${choiceIndex}`}
                      className="font-normal cursor-pointer"
                    >
                      {choice}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>
      ))}

      <Button 
        onClick={handleSubmit}
        className="w-full"
        disabled={questions.some((_, index) => !answers[index])}
      >
        Submit Survey
      </Button>
    </Card>
  );
}
