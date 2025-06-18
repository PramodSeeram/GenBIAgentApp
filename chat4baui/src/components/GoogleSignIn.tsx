import { Button } from '@/components/ui/button';

export const GoogleSignIn: React.FC = () => {
  const handleGoogleSignIn = () => {
    // Use the full backend URL
    window.location.href = 'http://localhost:8000/api/auth/google/login';
  };

  return (
    <div className="w-full">
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 bg-background hover:bg-accent border-border text-foreground"
        onClick={handleGoogleSignIn}
      >
        <img src="/logos/google.svg" alt="Google" className="h-5 w-5" />
        Sign in with Google
      </Button>
    </div>
  );
}; 