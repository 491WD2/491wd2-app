declare module "progressbar.js" {
  type StepFn = (
    state: { color?: string },
    bar: {
      path: SVGPathElement;
      setText: (text: string) => void;
      value: () => number;
    },
  ) => void;

  type CommonOptions = {
    color?: string;
    trailColor?: string;
    strokeWidth?: number;
    trailWidth?: number;
    easing?: string;
    duration?: number;
    from?: { color?: string };
    to?: { color?: string };
    step?: StepFn;
    text?: {
      autoStyleContainer?: boolean;
      style?: Record<string, string | number | null>;
    };
    svgStyle?: Record<string, string | number>;
  };

  type ProgressInstance = {
    animate: (value: number, options?: object) => void;
    set: (value: number) => void;
    destroy: () => void;
    value: () => number;
  };

  const ProgressBar: {
    Circle: new (container: HTMLElement, options?: CommonOptions) => ProgressInstance;
    Line: new (container: HTMLElement, options?: CommonOptions) => ProgressInstance;
  };

  export default ProgressBar;
}
