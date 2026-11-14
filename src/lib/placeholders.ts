/** Hand-drawn placeholder room photos (before / after) until real job photos exist. */
export function roomSvg(tidy: boolean, label = "") {
  const clutter = tidy
    ? ""
    : `<g fill="#c9a66b" stroke="#0e1a17" stroke-width="2"><rect x="60" y="220" width="70" height="40" rx="6" transform="rotate(-8 95 240)"/><rect x="150" y="240" width="90" height="30" rx="6" transform="rotate(6 195 255)"/><path d="M260 230 q30 -40 60 0 q-10 30 -60 0z" fill="#8eb69b"/><circle cx="330" cy="250" r="16" fill="#e8c48a"/></g><path d="M80 120 q10 -30 30 -10 t30 5 t25 20" fill="none" stroke="#a63a24" stroke-width="3"/>`;
  const tidyBits = tidy ? `<g stroke="#0e1a17" stroke-width="2" fill="#8eb69b"><rect x="60" y="200" width="60" height="60" rx="4"/><rect x="130" y="200" width="60" height="60" rx="4" fill="#e8c48a"/><rect x="200" y="200" width="60" height="60" rx="4"/></g>` : "";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='${tidy ? "#f4f1e6" : "#ddd5bd"}'/><rect y='262' width='400' height='38' fill='${tidy ? "#c7dbc9" : "#b9ae93"}'/><rect x='30' y='40' width='120' height='130' fill='#daf1de' stroke='#0e1a17' stroke-width='3'/><path d='M30 105 H150 M90 40 V170' stroke='#0e1a17' stroke-width='2'/>${clutter}${tidyBits}<text x='16' y='290' font-family='monospace' font-size='13' fill='#0e1a17'>${label}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
