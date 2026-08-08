export default function NycSkyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 120"
      preserveAspectRatio="none"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="0" y="70" width="40" height="50" />
      <rect x="45" y="40" width="30" height="80" />
      <rect x="80" y="80" width="50" height="40" />
      <polygon points="147,0 155,20 140,20" />
      <rect x="135" y="20" width="25" height="100" />
      <rect x="165" y="60" width="35" height="60" />
      <rect x="205" y="45" width="45" height="75" />
      <rect x="255" y="75" width="30" height="45" />
      <rect x="290" y="45" width="60" height="20" />
      <rect x="305" y="30" width="30" height="90" />
      <rect x="355" y="65" width="40" height="55" />
      <rect x="400" y="50" width="50" height="70" />
      <rect x="455" y="80" width="30" height="40" />
      <rect x="490" y="35" width="45" height="85" />
      <rect x="540" y="70" width="35" height="50" />
      <polygon points="605,4 610,18 600,18" />
      <rect x="580" y="18" width="55" height="102" />
      <rect x="640" y="75" width="30" height="45" />
      <rect x="675" y="45" width="50" height="75" />
      <rect x="730" y="65" width="40" height="55" />
      <rect x="775" y="85" width="25" height="35" />
    </svg>
  );
}
