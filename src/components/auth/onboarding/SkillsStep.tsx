import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface SkillsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const SUGGESTED_SKILLS = [
  "JavaScript", "Python", "React", "TypeScript", "Node.js",
  "Java", "C++", "Data Analysis", "Machine Learning", "UI/UX Design",
  "Graphic Design", "Video Editing", "Content Writing", "Marketing",
  "Public Speaking", "Leadership", "Project Management", "Research"
];

export const SkillsStep = ({ value, onChange }: SkillsStepProps) => {
  const [customSkill, setCustomSkill] = useState("");

  const toggleSkill = (skill: string) => {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
    } else if (value.length < 10) {
      onChange([...value, skill]);
    }
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !value.includes(trimmed) && value.length < 10) {
      onChange([...value, trimmed]);
      setCustomSkill("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomSkill();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          What are your skills?
        </h2>
        <p className="text-muted-foreground">
          Add skills that showcase what you can do (max 10)
        </p>
      </div>

      {/* Selected Skills */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Your skills:</p>
          <div className="flex flex-wrap gap-2">
            {value.map((skill) => (
              <Badge
                key={skill}
                variant="default"
                className="px-3 py-1.5 flex items-center gap-1.5"
              >
                {skill}
                <button
                  onClick={() => toggleSkill(skill)}
                  className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Custom Skill Input */}
      <div className="flex gap-2">
        <Input
          value={customSkill}
          onChange={(e) => setCustomSkill(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a custom skill..."
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={addCustomSkill}
          disabled={!customSkill.trim() || value.length >= 10}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggested Skills */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Suggested skills:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_SKILLS.filter((s) => !value.includes(s)).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className={`px-3 py-1.5 cursor-pointer transition-all hover:bg-primary hover:text-primary-foreground ${
                value.length >= 10 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => value.length < 10 && toggleSkill(skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {value.length}/10 skills selected
      </p>
    </div>
  );
};
