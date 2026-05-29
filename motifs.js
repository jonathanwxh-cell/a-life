const MOTIFS = {
  title: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <path d="M22 82.5 C35 80.5 48 81.8 60 82.2 C74 82.8 88 80.8 102 82.5" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 82 C59.5 70 60.8 58.5 60 47" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 68 C52 61 47 56 44 49" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 62 C68 57 74 51 78 44" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 55 C56 49 54 44 53 38" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M43 50 C37 42 39 31 48 27 C52 18 66 17 72 25 C82 25 88 35 84 44 C90 51 85 63 75 64 C69 72 55 72 49 64 C39 64 34 56 43 50 Z" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M31 75 A7 7 0 0 1 45 75" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="38" cy="75" r="1.2" fill="#e0a94b"/>
</svg>`,
  eulogy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <path d="M20 83 C34 81.8 48 82.7 61 82.5 C75 82.3 88 81.5 101 83" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 83 C60 73 59 64 61 54 C62 48 63 41 62 34" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M61 58 C53 52 48 45 45 36" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M54 52 C49 50 45 48 41 43" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M61 52 C69 47 75 40 79 31" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M67 47 C73 48 78 48 84 45" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M62 41 C58 36 55 31 54 25" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M92 79 A6 6 0 0 0 104 79" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="98" cy="79" r="0.9" fill="#e0a94b"/>
</svg>`,
  heir: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <path d="M23 84 C36 82.6 49 83.1 60 83.4 C74 83.7 88 82.8 101 84" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M58 84 C58 75 58.8 69 60 62" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M59 73 C54 70 51 67 49 62" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M59 70 C64 67 68 63 71 58" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M49 62 C54 58 58 58 60 63" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M70 58 C67 54 63 54 60 63" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M27 80 A9 9 0 0 1 45 80" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="36" cy="80" r="1.4" fill="#e0a94b"/>
  <path d="M82 31 L82 37 M79 34 L85 34" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
</svg>`,
  stage_child: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <path d="M24 84 C37 82.9 49 83.4 61 83.5 C73 83.7 86 83 100 84" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 84 C60 78 60.2 73 61 68" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60.8 70 C55 67 52 67.5 49 71" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M61 70 C66.5 66.5 70 67 73 71" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M27 80 A8 8 0 0 1 43 80" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="35" cy="80" r="1.2" fill="#e0a94b"/>
</svg>`,
  stage_youth: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <path d="M22 83 C36 81.8 49 82.7 61 83 C74 83.4 88 82 102 83" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 83 C60 73 61 65 61 55" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 70 C54 66 50 61 48 55" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 66 C66 62 70 56 73 50" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M48 55 C54 49 59 49 62 56" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M72 50 C68 44 62 46 61 56" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="38" cy="37" r="8" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="38" cy="37" r="1.4" fill="#e0a94b"/>
</svg>`,
  stage_adult: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <path d="M21 83 C34 81.5 48 82.8 60 83 C74 83.3 88 81.5 103 83" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 83 C59.5 71 60.6 58 60 47" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 68 C53 63 49 58 45 51" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 62 C67 58 72 53 76 46" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 55 C56 50 54 44 54 39" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M44 50 C39 42 42 33 50 30 C55 22 68 22 73 30 C82 31 87 39 83 47 C88 55 81 64 72 63 C66 70 55 70 49 63 C40 63 36 55 44 50 Z" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="60" cy="20" r="8" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="60" cy="20" r="1.4" fill="#e0a94b"/>
</svg>`,
  stage_midlife: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <path d="M21 83 C35 81.7 49 82.8 61 83.1 C75 83.4 88 81.7 102 83" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 83 C59.5 71.5 60.8 59 60 48" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 68 C53 63 49 58 45 51" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 62 C67 58 73 52 77 45" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 55 C56 49 54 44 54 38" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M44 51 C39 43 42 34 50 30 C55 22 69 22 74 31 C83 32 87 40 83 48 C87 55 82 64 73 64 C67 70 55 70 49 63 C40 63 36 56 44 51 Z" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M86 58 C89 56 92 57 93 60 C90 61 88 61 86 58 Z" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M80 70 C83 68 86 69 87 72 C84 73 82 73 80 70 Z" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M69 76 C71 74 74 75 75 78 C72 79 70 78.5 69 76 Z" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="88" cy="38" r="7.5" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="88" cy="38" r="1.3" fill="#e0a94b"/>
</svg>`,
  stage_elder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <path d="M20 83 C34 82 48 82.9 61 82.6 C75 82.3 88 81.8 101 83" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M60 83 C60 73 59.5 63 61 53 C61.8 47 63 40 62 33" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M61 59 C53 53 48 46 45 38" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M55 53 C49 51 44 48 40 43" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M61 52 C69 48 76 40 80 31" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M67 47 C73 48 79 47 84 44" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M62 42 C58 37 55 31 55 25" stroke="#ece1cf" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <path d="M91 79 A7 7 0 0 0 105 79" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <circle cx="98" cy="79" r="1.1" fill="#e0a94b"/>
  <path d="M86 27 L86 33 M83 30 L89 30" stroke="#e0a94b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
</svg>`
};

if (typeof window !== 'undefined') window.MOTIFS = MOTIFS;
