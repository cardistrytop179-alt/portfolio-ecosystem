/**
 * GradientBg — animated aurora/floating-gradient background.
 * Pure CSS; zero external deps, works in Telegram Mini App.
 */
export default function GradientBg() {
  return (
    <div className="gb-root" aria-hidden="true">
      <div className="gb-orb gb-orb-1" />
      <div className="gb-orb gb-orb-2" />
      <div className="gb-orb gb-orb-3" />
      <div className="gb-orb gb-orb-4" />
    </div>
  )
}
