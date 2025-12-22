import { ReactNode } from 'react';
interface MobileFrameProps {
  children: ReactNode;
}
const MobileFrame = ({
  children
}: MobileFrameProps) => {
  return <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="relative w-full max-w-[390px] h-[844px] bg-background rounded-[48px] shadow-float overflow-hidden border-[12px] border-foreground/90">
        {/* Notch */}
        
        
        {/* Screen content */}
        <div className="relative h-full overflow-hidden">
          {children}
        </div>
        
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-foreground/30 rounded-full" />
      </div>
    </div>;
};
export default MobileFrame;