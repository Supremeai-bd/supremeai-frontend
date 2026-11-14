import { AppLanguage } from '../types';
import { useCustomerStore } from '../stores/useCustomerStore';

export const APP_LANGUAGE_OPTIONS: Array<{
  id: AppLanguage;
  label: string;
  nativeLabel: string;
  description: string;
  badge: string;
}> = [
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    description: 'Interface and AI chat/voice replies default to English.',
    badge: 'EN',
  },
  {
    id: 'bn',
    label: 'Bangla (Bengali)',
    nativeLabel: 'বাংলা',
    description: 'ইন্টারফেস এবং AI চ্যাট ও ভয়েস উত্তর ডিফল্টভাবে বাংলায় থাকবে।',
    badge: 'বাং',
  },
];

const EN_DICT = {
  appName: 'SupremeAI Studio',
  // Sidebar
  newChat: 'New chat',
  workspaceSection: 'Workspace',
  allConversations: 'All Conversations',
  planUsage: 'Plan & Usage',
  teamMembers: 'Team & Members',
  settings: 'Settings',
  knowledgeBase: 'Knowledge Base',
  knowledgeRag: 'Knowledge & RAG',
  developerTools: 'Developer Tools',
  myProjects: 'My Projects',
  apiKeysProviders: 'API Keys & Providers',
  pluginsTools: 'Plugins & Tools',
  pinnedChats: 'Pinned Chats',
  recentChats: 'Recent Chats',
  emptySidebarHint: 'Start a conversation and its sidebar title will be generated automatically.',
  monthlyCredits: 'Monthly Credits',
  usedSuffix: 'used',
  standardMode: 'Standard',
  developerMode: 'Developer',
  switchTheme: 'Switch',
  guestPreview: 'Guest Preview',
  guestHint: 'Chat & Voice unlocked · Sign in for Settings & tools',
  signInSignUp: 'Sign In / Sign Up',
  // Chat Empty State
  emptyGreetingPrefix: 'Where should we start,',
  // Chat Input
  askPlaceholder: 'Ask SupremeAI or type instructions...',
  voicePlaceholder: 'Type or speak — AI replies in voice...',
  attachmentPlaceholder: 'Add instructions for attached file...',
  voiceBtn: 'Voice',
  voiceOnBtn: 'Voice On',
  voiceSpeakingBtn: 'Speaking',
  // Chat Controls & Search
  pin: 'Pin',
  pinned: 'Pinned',
  branch: 'Branch',
  share: 'Share',
  exportBtn: 'Export',
  clear: 'Clear',
  workspaceDock: 'Workspace',
  closeDock: 'Close Dock',
  backToChat: 'Back to Chat',
  chatHome: 'Chat Home',
  overview: 'Overview',
  close: 'Close',
  chatSearchPlaceholder: 'Search messages, code blocks, or reasoning output...',
  filterAll: 'All',
  filterYou: 'You',
  filterAi: 'AI',
  foundSuffix: 'found',
  readAloud: 'Read aloud',
  // Live Voice Panel
  voiceStatusConnecting: 'Connecting voice...',
  voiceStatusListening: 'Listening · Bilingual (EN / বাংলা)',
  voiceStatusSpeaking: 'Speaking...',
  voiceStatusMuted: 'Mic muted · Type to reply',
  voiceStatusReady: '3D Voice Ready',
  readAgain: 'Read again',
  readAgainTooltip: 'Hear the previous AI response again',
  noPreviousResponse: 'No previous response yet',
  // History View
  historySubtitle: 'Search across titles, prompts, and assistant responses',
  historySearchPlaceholder: 'Search conversation titles, code snippets, or messages...',
  searchBtn: 'Search',
  filterPinned: 'Pinned',
  filterWithMessages: 'With Messages',
  openBtn: 'Open',
  clearSearch: 'Clear Search',
  startNewChat: 'Start New Chat',
  // Navbar
  navChat: 'Chat',
  navHistory: 'History',
  navPlanUsage: 'Plan & Usage',
  navTeam: 'Team',
  navProjects: 'Projects',
  navPlugins: 'Plugins',
  navSettings: 'Settings',
  // Settings
  settingsTitle: 'Account & Workspace Settings',
  settingsSubtitleUser: 'Manage your profile, appearance, language, 3D voice avatar, and security settings.',
  settingsSubtitleDev: 'Manage your profile, appearance, language, 3D voice avatar, and developer preferences.',
  tabGeneral: 'General',
  tabAppearance: 'Appearance',
  tabVoiceAvatar: 'Voice & Avatar',
  tabAccount: 'Account & Security',
  languageCardTitle: 'Language & Default AI Response',
  languageCardSubtitle: 'Changes the workspace interface language and the default language for AI chat and 3D voice replies.',
  savePreferences: 'Save Preferences',
  settingsSavedToast: 'Settings saved successfully!',
  preferencesLocalHint: 'Preferences saved locally and applied live.',
  renderingQuality: 'Rendering Quality',
  renderingQualityHint: 'Choose simplified shaders for speed or high-fidelity textures with bloom post-processing.',
  renderQualityPerformance: 'Performance (Simplified Shaders)',
  renderQualityUltra: 'Ultra (High-Fidelity & Post-Processing)',
  // Subview Titles
  subviewChatHistory: 'All Conversations',
  subviewProjects: 'My Projects',
  subviewApiKeys: 'API Keys & Providers',
  subviewKnowledge: 'Knowledge Base',
  subviewTeam: 'Team & Members',
  subviewBilling: 'Plan & Usage',
  subviewUsage: 'Usage Analytics',
  subviewPlugins: 'Plugins & Tools',
  subviewSettings: 'Account & Workspace Settings',
};

export type TranslationKeys = keyof typeof EN_DICT;

const BN_DICT: Record<TranslationKeys, string> = {
  appName: 'SupremeAI Studio',
  // Sidebar
  newChat: 'নতুন চ্যাট',
  workspaceSection: 'ওয়ার্কস্পেস',
  allConversations: 'সব কথোপকথন',
  planUsage: 'প্ল্যান ও ব্যবহার',
  teamMembers: 'টিম ও সদস্য',
  settings: 'সেটিংস',
  knowledgeBase: 'নলেজ বেস',
  knowledgeRag: 'নলেজ ও RAG',
  developerTools: 'ডেভেলপার টুলস',
  myProjects: 'আমার প্রজেক্টস',
  apiKeysProviders: 'API কী ও প্রোভাইডার',
  pluginsTools: 'প্লাগইন ও টুলস',
  pinnedChats: 'পিন করা চ্যাট',
  recentChats: 'সাম্প্রতিক চ্যাট',
  emptySidebarHint: 'কথোপকথন শুরু করলে সাইডবার শিরোনাম স্বয়ংক্রিয়ভাবে তৈরি হবে।',
  monthlyCredits: 'মাসিক ক্রেডিট',
  usedSuffix: 'ব্যবহৃত',
  standardMode: 'স্ট্যান্ডার্ড',
  developerMode: 'ডেভেলপার',
  switchTheme: 'পরিবর্তন',
  guestPreview: 'গেস্ট প্রিভিউ',
  guestHint: 'চ্যাট ও ভয়েস চালু আছে · সেটিংস ও টুলসের জন্য সাইন ইন করুন',
  signInSignUp: 'সাইন ইন / সাইন আপ',
  // Chat Empty State
  emptyGreetingPrefix: 'আজ কোথা থেকে শুরু করব,',
  // Chat Input
  askPlaceholder: 'SupremeAI-কে জিজ্ঞাসা করুন বা নির্দেশ লিখুন...',
  voicePlaceholder: 'লিখুন বা কথা বলুন — AI ভয়েসে উত্তর দেবে...',
  attachmentPlaceholder: 'সংযুক্ত ফাইলের জন্য নির্দেশনা লিখুন...',
  voiceBtn: 'ভয়েস',
  voiceOnBtn: 'ভয়েস চালু',
  voiceSpeakingBtn: 'বলছে',
  // Chat Controls & Search
  pin: 'পিন',
  pinned: 'পিন করা',
  branch: 'ব্রাঞ্চ',
  share: 'শেয়ার',
  exportBtn: 'এক্সপোর্ট',
  clear: 'মুছুন',
  workspaceDock: 'ওয়ার্কস্পেস',
  closeDock: 'ডক বন্ধ করুন',
  backToChat: 'চ্যাটে ফিরুন',
  chatHome: 'চ্যাট হোম',
  overview: 'ওভারভিউ',
  close: 'বন্ধ করুন',
  chatSearchPlaceholder: 'মেসেজ, কোড বা উত্তর খুঁজুন...',
  filterAll: 'সব',
  filterYou: 'আপনি',
  filterAi: 'AI',
  foundSuffix: 'টি পাওয়া গেছে',
  readAloud: 'জোরে পড়ুন',
  // Live Voice Panel
  voiceStatusConnecting: 'ভয়েস সংযুক্ত হচ্ছে...',
  voiceStatusListening: 'শুনছে · বাংলা ও ইংরেজি',
  voiceStatusSpeaking: 'কথা বলছে...',
  voiceStatusMuted: 'মাইক মিউট · লিখে উত্তর পান',
  voiceStatusReady: '৩ডি ভয়েস প্রস্তুত',
  readAgain: 'আবার পড়ুন',
  readAgainTooltip: 'আগের AI উত্তরটি আবার শুনুন',
  noPreviousResponse: 'এখনো কোনো পূর্ববর্তী উত্তর নেই',
  // History View
  historySubtitle: 'শিরোনাম, প্রশ্ন এবং উত্তরের মধ্যে খুঁজুন',
  historySearchPlaceholder: 'চ্যাটের শিরোনাম, কোড বা মেসেজ লিখুন...',
  searchBtn: 'খুঁজুন',
  filterPinned: 'পিন করা',
  filterWithMessages: 'মেসেজসহ',
  openBtn: 'খুলুন',
  clearSearch: 'খোঁজা মুছুন',
  startNewChat: 'নতুন চ্যাট শুরু করুন',
  // Navbar
  navChat: 'চ্যাট',
  navHistory: 'ইতিহাস',
  navPlanUsage: 'প্ল্যান ও ব্যবহার',
  navTeam: 'টিম',
  navProjects: 'প্রজেক্টস',
  navPlugins: 'প্লাগইন',
  navSettings: 'সেটিংস',
  // Settings
  settingsTitle: 'অ্যাকাউন্ট ও ওয়ার্কস্পেস সেটিংস',
  settingsSubtitleUser: 'আপনার প্রোফাইল, থিম, ভাষা, ৩ডি ভয়েস অবতার এবং নিরাপত্তা পরিচালনা করুন।',
  settingsSubtitleDev: 'আপনার প্রোফাইল, থিম, ভাষা, ৩ডি ভয়েস অবতার এবং ডেভেলপার সেটিংস পরিচালনা করুন।',
  tabGeneral: 'সাধারণ',
  tabAppearance: 'থিম ও দৃশ্যপট',
  tabVoiceAvatar: 'ভয়েস ও অবতার',
  tabAccount: 'অ্যাকাউন্ট ও নিরাপত্তা',
  languageCardTitle: 'ভাষা ও ডিফল্ট AI উত্তর',
  languageCardSubtitle: 'এটি ওয়ার্কস্পেসের ইন্টারফেস ভাষা এবং AI চ্যাট ও ৩ডি ভয়েস উত্তরের ডিফল্ট ভাষা পরিবর্তন করে।',
  savePreferences: 'সেটিংস সংরক্ষণ করুন',
  settingsSavedToast: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!',
  preferencesLocalHint: 'সেটিংস লোকালভাবে সংরক্ষিত ও লাইভ প্রয়োগ হয়েছে।',
  renderingQuality: 'রেন্ডারিং কোয়ালিটি',
  renderingQualityHint: 'গতির জন্য সহজ শেডার অথবা হাই-ফিডেলিটি টেক্সচার ও পোস্ট-প্রসেসিং বেছে নিন।',
  renderQualityPerformance: 'পারফরম্যান্স (সিম্পলিফায়েড শেডার)',
  renderQualityUltra: 'আল্ট্রা (হাই-ফিডেলিটি ও পোস্ট-প্রসেসিং)',
  // Subview Titles
  subviewChatHistory: 'সব কথোপকথন',
  subviewProjects: 'আমার প্রজেক্টস',
  subviewApiKeys: 'API কী ও প্রোভাইডার',
  subviewKnowledge: 'নলেজ বেস',
  subviewTeam: 'টিম ও সদস্য',
  subviewBilling: 'প্ল্যান ও ব্যবহার',
  subviewUsage: 'ব্যবহারের বিশ্লেষণ',
  subviewPlugins: 'প্লাগইন ও টুলস',
  subviewSettings: 'অ্যাকাউন্ট ও ওয়ার্কস্পেস সেটিংস',
};

export const TRANSLATIONS: Record<AppLanguage, Record<TranslationKeys, string>> = {
  en: EN_DICT,
  bn: BN_DICT,
};

export function getTranslation(lang?: AppLanguage): Record<TranslationKeys, string> {
  return TRANSLATIONS[lang === 'bn' ? 'bn' : 'en'];
}

export function useI18n() {
  const language = useCustomerStore((s) => s.userSettings.language || 'en');
  return {
    lang: language,
    t: getTranslation(language),
  };
}
