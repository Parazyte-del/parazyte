// ui/data-store.js — Centralized data storage for portfolio, testimonials, and pricing
// Compatible with miniappsAI.storage and localStorage fallback
import { getItem, setItem } from './storage.js';
import { t } from './i18n.js';

const STORAGE_KEY = 'parazyte_data';

function defaultData() {
  return {
    portfolio: [
      { id: 1, cat: 'tiktok', title: t('portfolio.item1_title'), desc: t('portfolio.item1_desc'), icon: '💃', views: 12500, thumb: '' },
      { id: 2, cat: 'tiktok', title: t('portfolio.item2_title'), desc: t('portfolio.item2_desc'), icon: '✨', views: 8300, thumb: '' },
      { id: 3, cat: 'youtube', title: t('portfolio.item3_title'), desc: t('portfolio.item3_desc'), icon: '🎥', views: 45000, thumb: '' },
      { id: 4, cat: 'youtube', title: t('portfolio.item4_title'), desc: t('portfolio.item4_desc'), icon: '🎮', views: 32000, thumb: '' },
      { id: 5, cat: 'shorts', title: t('portfolio.item5_title'), desc: t('portfolio.item5_desc'), icon: '😂', views: 67000, thumb: '' },
      { id: 6, cat: 'shorts', title: t('portfolio.item6_title'), desc: t('portfolio.item6_desc'), icon: '👗', views: 21000, thumb: '' },
    ],
    testimonials: [
      { name: t('testimonials.t1_name'), role: t('testimonials.t1_role'), text: t('testimonials.t1_text'), initials: 'AM' },
      { name: t('testimonials.t2_name'), role: t('testimonials.t2_role'), text: t('testimonials.t2_text'), initials: 'SL' },
      { name: t('testimonials.t3_name'), role: t('testimonials.t3_role'), text: t('testimonials.t3_text'), initials: 'MD' },
    ],
    pricing: {
      tiktokStandard: 10,
      tiktokPremium: 20,
      youtubeNote: t('pricing.youtube_desc'),
    },
  };
}

let _data = null;

async function load() {
  if (_data) return _data;
  try {
    const raw = await getItem(STORAGE_KEY);
    _data = raw ? JSON.parse(raw) : defaultData();
  } catch {
    _data = defaultData();
  }
  return _data;
}

async function persist() {
  try { await setItem(STORAGE_KEY, JSON.stringify(_data)); } catch {}
}

export async function getPortfolio() {
  return (await load()).portfolio;
}

export async function saveVideo(video) {
  const d = await load();
  const i = d.portfolio.findIndex(v => v.id === video.id);
  if (i >= 0) d.portfolio[i] = { ...d.portfolio[i], ...video };
  else { video.id = Date.now(); d.portfolio.push(video); }
  await persist();
  return [...d.portfolio];
}

export async function deleteVideo(id) {
  const d = await load();
  d.portfolio = d.portfolio.filter(v => v.id !== id);
  await persist();
  return [...d.portfolio];
}

export async function moveVideo(id, dir) {
  const d = await load();
  const i = d.portfolio.findIndex(v => v.id === id);
  if (i < 0) return [...d.portfolio];
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= d.portfolio.length) return [...d.portfolio];
  [d.portfolio[i], d.portfolio[j]] = [d.portfolio[j], d.portfolio[i]];
  await persist();
  return [...d.portfolio];
}

export async function getTestimonials() {
  return (await load()).testimonials;
}

export async function saveTestimonial(idx, item) {
  const d = await load();
  if (idx >= 0 && idx < d.testimonials.length) d.testimonials[idx] = item;
  else d.testimonials.push(item);
  await persist();
  return [...d.testimonials];
}

export async function deleteTestimonial(idx) {
  const d = await load();
  d.testimonials.splice(idx, 1);
  await persist();
  return [...d.testimonials];
}

export async function getPricing() {
  return (await load()).pricing;
}

export async function savePricing(p) {
  const d = await load();
  d.pricing = { ...d.pricing, ...p };
  await persist();
  return { ...d.pricing };
}

export async function getStats() {
  const d = await load();
  return {
    videos: d.portfolio.length,
    views: d.portfolio.reduce((sum, v) => sum + (v.views || 0), 0),
    testimonials: d.testimonials.length,
    lastAdded: d.portfolio.length ? d.portfolio[d.portfolio.length - 1].title : '—',
  };
}
