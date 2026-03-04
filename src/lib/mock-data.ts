export const MOCK_COMPANY = {
  id: 'comp_1',
  name: 'DP Studios Global',
  subscription_plan: 'Pro',
  enabled_modules: ['projects', 'talent', 'crm', 'finance', 'research'],
  logo_url: 'https://picsum.photos/seed/dp-logo/100/100',
};

export const MOCK_USER = {
  id: 'user_1',
  name: 'Alex Producer',
  email: 'alex@dpstudios.com',
  role: 'Admin',
  company_id: 'comp_1',
  avatar: 'https://picsum.photos/seed/user1/100/100',
};

export const PIPELINE_STAGES = [
  { id: 'lead', name: 'Lead', color: 'bg-slate-200' },
  { id: 'contacted', name: 'Contacted', color: 'bg-blue-200' },
  { id: 'meeting', name: 'Meeting', color: 'bg-cyan-200' },
  { id: 'proposal', name: 'Proposal Sent', color: 'bg-indigo-200' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-amber-200' },
  { id: 'won', name: 'Won', color: 'bg-emerald-200' },
];

export const MOCK_LEADS = [
  { id: 'lead_1', name: 'Nike Summer Campaign', company: 'Nike', value: 45000, stage: 'meeting' },
  { id: 'lead_2', name: 'RedBull Extreme Sports Doc', company: 'RedBull', value: 120000, stage: 'proposal' },
  { id: 'lead_3', name: 'Apple Vision Pro Launch', company: 'Apple', value: 85000, stage: 'negotiation' },
  { id: 'lead_4', name: 'Zara Fall Collection', company: 'Inditex', value: 30000, stage: 'won' },
];

export const MOCK_PROJECTS = [
  { id: 'proj_1', name: 'Nike Summer Campaign', status: 'Pre-Production', progress: 35, dueDate: '2024-06-15' },
  { id: 'proj_2', name: 'Zara Fall Collection', status: 'Production', progress: 65, dueDate: '2024-05-20' },
  { id: 'proj_3', name: 'Tech Documentary', status: 'Post-Production', progress: 90, dueDate: '2024-04-10' },
];

export const MOCK_TALENTS = [
  { id: 'tal_1', name: 'Sarah Jenkins', category: 'Actress', rate: '$1,200/day', metrics: '450k Followers', image: 'https://picsum.photos/seed/talent1/300/400' },
  { id: 'tal_2', name: 'Michael Chen', category: 'Influencer', rate: '$2,500/post', metrics: '1.2M Followers', image: 'https://picsum.photos/seed/talent2/300/400' },
  { id: 'tal_3', name: 'Emma Watson', category: 'Model', rate: '$1,800/day', metrics: '890k Followers', image: 'https://picsum.photos/seed/talent3/300/400' },
];