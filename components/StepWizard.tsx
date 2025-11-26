import React from 'react';
import { Step, Language } from '../types';

interface StepWizardProps {
  currentStep: Step;
  onStepClick: (step: Step) => void;
  lang: Language;
  maxReachedStep: Step;
}

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep, onStepClick, lang, maxReachedStep }) => {
  const steps = [
    { id: Step.INPUT_URL, label: lang === 'id' ? 'Link' : 'Link' },
    { id: Step.REVIEW_PRODUCT, label: lang === 'id' ? 'Analisis' : 'Analyze' },
    { id: Step.GENERATE_MODEL, label: lang === 'id' ? 'Model' : 'Model' },
    { id: Step.GENERATE_VIDEOS, label: lang === 'id' ? 'Produksi' : 'Produce' },
    { id: Step.FINAL_EDITOR, label: lang === 'id' ? 'Edit' : 'Edit' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div className="flex items-center justify-between relative bg-[#1C1D1F] rounded-lg p-1 border border-[#2E3033]">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isPassed = currentStep > step.id;
          const isClickable = step.id <= maxReachedStep;
          
          return (
            <button 
              key={step.id} 
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`
                flex-1 flex items-center justify-center py-2 px-3 rounded-md text-xs font-medium transition-all duration-200
                ${isActive ? 'bg-[#3E4044] text-white shadow-sm' : ''}
                ${isPassed ? 'text-gray-400 hover:text-gray-200' : ''}
                ${!isActive && !isPassed ? 'text-gray-600' : ''}
                ${!isClickable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
               {/* Dot Indicator */}
               <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isActive ? 'bg-indigo-500' : isPassed ? 'bg-gray-500' : 'bg-gray-700'}`}></div>
               {step.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};