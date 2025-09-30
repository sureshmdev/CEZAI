export interface SubIndustry {
  id: string;
  name: string;
}

export interface Industry {
  id: string;
  name: string;
  subIndustries: string[];
}

export interface OnboardingFormValues {
  industry: string;
  subIndustry: string;
  experience: number;
  skills: string;
  bio: string;
}

export interface OnboardingFormProps {
  industries: Industry[];
}
