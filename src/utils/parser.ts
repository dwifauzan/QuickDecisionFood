export interface ParsedDecision {
  name: string;
  reason: string;
  tags: string[];
  mapsQuery: string;
  healthySwitch?: string;
  instaVibe?: string;
  urgencyStatus?: string;
}

export function parseAIResponse(text: string, fallbackName: string): ParsedDecision {
  const cleanText = (t: string) => t.replace(/\*\*|\*|#|__|🏷️|🍃|📸|⏱️/g, '').replace(/\[|\]/g, '').trim();
  const lines = text.split('\n').filter(l => l.trim());
  
  let name = '', reason = '', tags: string[] = [], mapsQuery = '', healthySwitch = '', instaVibe = '', urgencyStatus = '';
  let currentSection = '';

  lines.forEach(line => {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    if (upper === '[TITLE]') { currentSection = 'title'; return; }
    if (upper === '[REASON]') { currentSection = 'reason'; return; }
    if (upper === '[DYNAMIC_TAGS]') { currentSection = 'tags'; return; }
    if (upper === '[HEALTHY_CARD]') { currentSection = 'healthy'; return; }
    if (upper === '[INSTA_VIBE_CARD]') { currentSection = 'insta'; return; }
    if (upper === '[URGENCY_STATUS]') { currentSection = 'urgency'; return; }
    if (upper === '[MAPS_LINK]') { currentSection = 'maps'; return; }

    if (currentSection === 'title') name = (name + ' ' + trimmed).trim();
    else if (currentSection === 'reason') reason = (reason + ' ' + trimmed).trim();
    else if (currentSection === 'tags') tags.push(...trimmed.split('|').map(p => cleanText(p)).filter(p => p));
    else if (currentSection === 'healthy') healthySwitch = (healthySwitch + ' ' + cleanText(trimmed)).trim();
    else if (currentSection === 'insta') instaVibe = (instaVibe + ' ' + cleanText(trimmed)).trim();
    else if (currentSection === 'urgency') urgencyStatus = (urgencyStatus + ' ' + cleanText(trimmed)).trim();
    else if (currentSection === 'maps') mapsQuery = (mapsQuery + ' ' + cleanText(trimmed)).trim();
  });

  return {
    name: cleanText(name) || fallbackName,
    reason: reason.replace(/^"|"$/g, ''),
    tags,
    mapsQuery: mapsQuery || fallbackName,
    healthySwitch: healthySwitch && healthySwitch.toLowerCase() !== 'n/a' ? healthySwitch : undefined,
    instaVibe: instaVibe && instaVibe.toLowerCase() !== 'n/a' ? instaVibe : undefined,
    urgencyStatus: urgencyStatus && urgencyStatus.toLowerCase() !== 'n/a' ? urgencyStatus : undefined
  };
}
