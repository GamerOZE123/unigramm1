import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, FileText } from 'lucide-react';

interface SurveyQuestion {
  question: string;
  type: 'text' | 'rating' | 'multiple_choice';
  options?: string[];
}

interface SurveyCreatorProps {
  onSurveyCreate: (survey: { questions: SurveyQuestion[] }) => void;
  onCancel: () => void;
}

export default function SurveyCreator({ onSurveyCreate, onCancel }: SurveyCreatorProps) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { question: '', type: 'text' }
  ]);

  const addQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, { question: '', type: 'text' }]);
    }
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleCreate = () => {
    const validQuestions = questions.filter(q => q.question.trim());
    if (validQuestions.length === 0) return;

    onSurveyCreate({ questions: validQuestions });
  };

  return (
    <Card className="p-4 border-2 border-primary/20 max-h-[500px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Create Survey</h3>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder={`Question ${index + 1}`}
                  value={q.question}
                  onChange={(e) => updateQuestion(index, { question: e.target.value })}
                />
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(index, { type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                >
                  <option value="text">Short Answer</option>
                  <option value="rating">Rating (1-5)</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>
              {questions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {q.type === 'multiple_choice' && (
              <div className="pl-4 space-y-1">
                {(q.options || ['', '']).map((opt, optIndex) => (
                  <Input
                    key={optIndex}
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(q.options || ['', ''])];
                      newOptions[optIndex] = e.target.value;
                      updateQuestion(index, { options: newOptions });
                    }}
                    className="text-sm"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.length < 10 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuestion}
          className="w-full mt-3"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCreate}
          className="flex-1"
          disabled={questions.filter(q => q.question.trim()).length === 0}
        >
          Create Survey
        </Button>
      </div>
    </Card>
  );
}