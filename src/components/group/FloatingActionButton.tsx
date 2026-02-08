import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <Button
      className="fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
      size="icon"
      onClick={onClick}
    >
      <Camera className="h-6 w-6" />
    </Button>
  );
};
