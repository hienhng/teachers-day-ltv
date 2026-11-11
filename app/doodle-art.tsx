type DoodleKind = 'flower' | 'sun' | 'plane' | 'sparkles';

/** Small pen drawings, kept decorative so they never interrupt the reading order. */
export function DoodleArt({kind, className = ''}: {kind: DoodleKind; className?: string}) {
  return <svg className={`doodle-art doodle-${kind} ${className}`} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === 'flower' && <>
      <path d="M59 111c4-22 6-40 1-58M62 91c-19 0-28-13-26-20 13-1 23 7 26 20ZM63 79c18-1 25-12 23-19-12 1-21 8-23 19Z" fill="#c5d5b0"/>
      <path d="M48 33C25 17 28 55 44 53 24 65 57 82 60 60 64 83 91 60 75 51 99 49 85 20 70 34 75 10 44 10 48 33Z" fill="#f6cf74"/>
      <path d="M50 45c0-12 19-13 20-1 2 14-19 15-20 1Z" fill="#fff9ec"/>
      <path d="m23 25-7-5m12-6-2-8m67 77 8 2m-6-11 5-4"/>
    </>}
    {kind === 'sun' && <>
      <path d="M34 58c-3-35 50-43 53-7 7 38-51 43-53 7Z" fill="#f8d579"/>
      <path d="m57 13 1-9m24 16 7-9m8 29 11-4M99 63l12 2M89 85l7 8m-27 1 1 13m-27-18-7 10m-11-25-12 4m10-27-12-2m21-20-8-9M49 54l1 3m20-5 1 3m-20 12c6 7 15 5 19-2"/>
    </>}
    {kind === 'plane' && <>
      <path d="M8 105c22 0 33-13 25-23-11-11-25 5-11 12 18 9 39-6 42-29" strokeDasharray="4 6"/>
      <path d="m35 36 72-23-26 67-15-28-31-16Z" fill="#f5c3b5"/>
      <path d="m66 52 41-39-52 32 1 20 10-13Z" fill="#fff9ec"/>
      <path d="m56 65 25 15M93 8l-2-5m20 24 6 1"/>
    </>}
    {kind === 'sparkles' && <>
      <path d="m42 12 7 25 22 7-23 8-8 26-6-26-23-8 23-7 8-25Z" fill="#f6cf74"/>
      <path d="m91 62 4 13 14 5-15 5-4 16-4-16-13-5 13-5 5-13Z" fill="#edb8b2"/>
      <path d="m85 19 1 8m-5-4 9-1m-69 72 8 5m-10 7 7-1"/>
    </>}
  </svg>;
}
