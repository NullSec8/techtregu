const TECH_KEYWORDS = [
  'laptop', 'notebook', 'macbook',
  'rtx', 'gtx', 'nvidia', 'amd', 'radeon', 'intel', 'apple', 'm1', 'm2', 'm3',
  'cpu', 'processor', 'gpu', 'graphics card', 'vga', 'video card', 'kartë grafike',
  'ram', 'memory', 'ddr4', 'ddr5', 'storage', 'ssd', 'nvme', 'hdd', 'disk',
  'motherboard', 'mobo', 'mainboard', 'pllakë amë', 'psu', 'power supply', 'furnizim me energji',
  'cpu cooler', 'cooling', 'aio cooler', 'freskues', 'monitor', 'display', 'screen', 'lcd', 'oled', '144hz', '240hz', 'gaming monitor',
  'keyboard', 'mouse', 'headset', 'audio', 'speaker', 'microphone', 'mikrofon', 'webcam', 'kamera',
  'printer', 'scanner', 'router', 'network', 'rrjet', 'tablet', 'ipad', 'android', 'ios',
  'cable', 'adapter', 'charger', 'usb', 'hdmi', 'dp', 'displayport', 'kabllo', 'karikues',
  'pc', 'computer', 'kompjuter', 'desktop', 'workstation', 'server',
  'ryzen', 'core i3', 'core i5', 'core i7', 'core i9', 'pentium', 'celeron', 'xeon', 'threadripper', 'procesor', 'bajt',
  'vr', 'virtual reality', 'oculus', 'quest', 'realitet virtual',
  'datacenter', 'cloud storage', 'AWS', 'Azure', 'google cloud',
  'Linux', 'Windows', 'macOS', 'firewall', 'vpn', 'antivirus', 'malware', 'ransomware',
  'webcam', 'ethernet', 'wifi', 'router', 'switch', 'nas', 'raid',
];

const SCAM_KEYWORDS = [
  'whatsapp', 'viber', 'telegram', 'dm', 'direct message', 'mesazh direkt', 'cash', 'cashapp', 'venmo', 'paypal gift',
  'gift card', 'itunes', 'google play', 'amazon gift', 'bitcoin', 'btc', 'crypto', 'ethereum', 'dogecoin',
  'urgent', 'fast deal', 'limited time', 'act now', 'verify account', 'confirm identity', 'id verification', 'verifikim identiteti',
  'irs', 'tax', 'government', 'police', 'court', 'inheritance', 'lottery', 'winner', 'prize', 'fitues',
  'boyfriend', 'girlfriend', 'dating', 'relationship', 'investment', 'profit', 'return', 'make money', 'investim',
  'mlm', 'pyramid', 'matrix', 'network marketing', 'scheme', 'pyramid scheme', 'program', 'bonus', 'bonus falas',
  'refund', 'claim', 'free money', 'fundraising', 'donation', 'paypal scam', 'money laundering', 'blackmail', 'defraud',
  'scam', 'scammer', 'fake', 'fraud', 'investment fraud', 'phishing', 'clickbait', 'data theft', 'identity theft',
  'account hack', 'fake website', 'suspicious link', 'phishing link', 'wrong number', 'cash advance', 'quick loan',
  'ponzi', 'money transfer', 'western union', 'wire transfer', 'social engineering', 'nigerian prince', 'romance scam',
  'lotto winner', 'fake job offer', 'unrealistic returns', 'fake job', 'work from home scam', 'contract scam', 'paypal phishing',
  'online survey scam', 'fake charity', 'government grant scam', 'fake employment', 'unclaimed prize',
];



function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function analyzeContent(title, description) {
  const text = `${title} ${description}`;
  
  const techScore = TECH_KEYWORDS.filter(k => new RegExp(`\\b${escapeRegex(k)}\\b`, 'i').test(text)).length;
  const scamScore = SCAM_KEYWORDS.filter(k => new RegExp(`\\b${escapeRegex(k)}\\b`, 'i').test(text)).length;
  
  const result = {
    isTech: techScore >= 1,
    techScore,
    scamScore,
    isSuspicious: scamScore >= 2,
    warnings: [],
  };
  
  if (scamScore >= 1) {
    result.warnings.push('This listing may contain suspicious keywords');
  }
  if (scamScore >= 2) {
    result.warnings.push('This listing has been flagged for review');
  }
  if (techScore === 0) {
    result.warnings.push('This may not be a tech product');
  }
  
  return result;
}

module.exports = { analyzeContent, TECH_KEYWORDS, SCAM_KEYWORDS };