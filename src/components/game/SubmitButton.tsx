import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  isDisabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function SubmitButton({ isDisabled, isLoading, onClick }: SubmitButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isDisabled || isLoading}
      size="lg"
      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold shadow-lg hover:shadow-xl transition-all"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Submitting...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Submit Guess
        </>
      )}
    </Button>
  );
}
