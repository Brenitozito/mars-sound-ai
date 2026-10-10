import svgPaths from "../../../imports/svg-1rskmayuh7";

interface IconProps {
  size?: number;
}

function PathIcon({ size = 20, path, viewBox = "0 0 33 33" }: IconProps & { path: string; viewBox?: string }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export const ShuffleIcon = (props: IconProps) => <PathIcon {...props} path={svgPaths.p5cd5200} />;
export const PreviousIcon = (props: IconProps) => <PathIcon {...props} path={svgPaths.p9da1b80} />;
export const NextIcon = (props: IconProps) => <PathIcon {...props} path={svgPaths.p251da300} />;
export const RepeatIcon = (props: IconProps) => <PathIcon {...props} path={svgPaths.pf5e8780} />;
export const VolumeIcon = (props: IconProps) => <PathIcon {...props} path={svgPaths.p2abb5600} viewBox="0 0 24 24" />;

export function PlayIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="8,5 19,12 8,19" />
    </svg>
  );
}

export function PauseIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="3" width="4" height="18" rx="1" />
      <rect x="15" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

export function VolumeMutedIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
