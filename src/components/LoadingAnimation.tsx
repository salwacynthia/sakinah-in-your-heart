import { Leaf } from "lucide-react";

const LoadingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        {/* Pulsing glow circle */}
        <div className="w-20 h-20 rounded-full bg-glow/20 animate-pulse-glow" />
        {/* Leaf icon growing */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf className="text-primary animate-leaf-grow" size={32} />
        </div>
      </div>
      <p className="text-muted-foreground text-sm font-light tracking-wide animate-pulse">
        Seeking guidance for you...
      </p>
    </div>
  );
};

export default LoadingAnimation;
