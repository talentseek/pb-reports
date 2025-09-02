import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (stepNumber: number) => void;
  clickableSteps?: number[]; // Array of step numbers that can be clicked
}

export function StepIndicator({ steps, currentStep, className, onStepClick, clickableSteps = [] }: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;
          const isClickable = clickableSteps.includes(stepNumber);

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(stepNumber)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-all duration-200",
                    isCompleted && "bg-green-600 border-green-600 text-white",
                    isCurrent && "bg-blue-600 border-blue-600 text-white",
                    isUpcoming && "bg-gray-100 border-gray-300 text-gray-500",
                    isClickable && "cursor-pointer hover:scale-110 hover:shadow-md",
                    !isClickable && "cursor-default"
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </button>
                
                {/* Step Info */}
                <div className="ml-3">
                  <button
                    onClick={() => isClickable && onStepClick?.(stepNumber)}
                    disabled={!isClickable}
                    className={cn(
                      "text-sm font-medium text-left transition-colors duration-200",
                      isCompleted && "text-green-600",
                      isCurrent && "text-blue-600",
                      isUpcoming && "text-gray-500",
                      isClickable && "cursor-pointer hover:underline",
                      !isClickable && "cursor-default"
                    )}
                  >
                    {step.title}
                  </button>
                  {step.description && (
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-4",
                  isCompleted ? "bg-green-600" : "bg-gray-300"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
