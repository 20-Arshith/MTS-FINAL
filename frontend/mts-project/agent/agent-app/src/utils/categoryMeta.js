import {
  Briefcase,
  Droplets,
  Zap,
  Sparkles,
  Hammer,
  Paintbrush,
  Snowflake,
  CarFront,
  Truck,
  ShieldCheck,
} from 'lucide-react-native';

export const AGENT_CATEGORY_VISUALS = {
  general: { icon: Briefcase, color: '#2563eb', bg: '#dbeafe' },
  plumbing: { icon: Droplets, color: '#0284c7', bg: '#e0f2fe' },
  electrical: { icon: Zap, color: '#d97706', bg: '#ffedd5' },
  cleaning: { icon: Sparkles, color: '#7c3aed', bg: '#f3e8ff' },
  carpentry: { icon: Hammer, color: '#7c5c46', bg: '#efebe9' },
  painting: { icon: Paintbrush, color: '#db2777', bg: '#fce7f3' },
  cooling: { icon: Snowflake, color: '#0891b2', bg: '#cffafe' },
  automotive: { icon: CarFront, color: '#475569', bg: '#e2e8f0' },
  moving: { icon: Truck, color: '#15803d', bg: '#dcfce7' },
  security: { icon: ShieldCheck, color: '#0f766e', bg: '#d1fae5' },
};

export const getAgentCategoryMeta = (iconName, fallbackName = '') => {
  const normalizedIcon = String(iconName || '').toLowerCase();

  if (normalizedIcon && normalizedIcon !== 'general' && AGENT_CATEGORY_VISUALS[normalizedIcon]) {
    return AGENT_CATEGORY_VISUALS[normalizedIcon];
  }

  const normalizedName = String(fallbackName || '').toLowerCase();

  if (normalizedName.includes('plumb') || normalizedName.includes('pipe')) return AGENT_CATEGORY_VISUALS.plumbing;
  if (normalizedName.includes('elect') || normalizedName.includes('wir')) return AGENT_CATEGORY_VISUALS.electrical;
  if (normalizedName.includes('clean') || normalizedName.includes('sweep')) return AGENT_CATEGORY_VISUALS.cleaning;
  if (normalizedName.includes('paint') || normalizedName.includes('wall')) return AGENT_CATEGORY_VISUALS.painting;
  if (normalizedName.includes('ac') || normalizedName.includes('cool')) return AGENT_CATEGORY_VISUALS.cooling;
  if (normalizedName.includes('carp') || normalizedName.includes('wood')) return AGENT_CATEGORY_VISUALS.carpentry;
  if (normalizedName.includes('mech') || normalizedName.includes('car')) return AGENT_CATEGORY_VISUALS.automotive;
  if (normalizedName.includes('mov') || normalizedName.includes('pack')) return AGENT_CATEGORY_VISUALS.moving;
  if (normalizedName.includes('secure') || normalizedName.includes('cctv')) return AGENT_CATEGORY_VISUALS.security;

  return AGENT_CATEGORY_VISUALS.general;
};
