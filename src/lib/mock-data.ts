
export const MOCK_COMPANY = {
  id: 'comp_1',
  name: 'DP Studios Global',
  subscription_plan: 'Enterprise',
  enabled_modules: ['projects', 'talent', 'crm', 'finance', 'research'],
  logo_url: 'https://picsum.photos/seed/dp-logo/100/100',
  admin: {
    name: 'Shakir!',
    role: 'Sr. Visual Designer',
    avatar: 'https://picsum.photos/seed/shakir/100/100'
  }
};

export const MOCK_TASKS = [
  {
    id: 't1',
    title: 'Uber',
    desc: 'App Design and Upgrades with new features - In Progress 16 days',
    icon: 'https://picsum.photos/seed/uber/40/40',
    color: 'bg-rose-500',
    group: 'Today',
    members: ['1', '2', '3']
  },
  {
    id: 't2',
    title: 'Facebook Ads',
    desc: 'Facebook Ads Design for CreativeCloud - Last worked 5 days ago',
    icon: 'https://picsum.photos/seed/fb/40/40',
    color: 'bg-blue-600',
    group: 'Today',
    members: ['4', '5']
  },
  {
    id: 't3',
    title: 'Payoneer',
    desc: 'Payoneer Dashboard Design - Due in 3 days',
    icon: 'https://picsum.photos/seed/payo/40/40',
    color: 'bg-indigo-600',
    group: 'Today',
    members: ['2', '6']
  },
  {
    id: 't4',
    title: 'Upwork',
    desc: 'Development - Viewed Just Now - Assigned 10 min ago',
    icon: 'https://picsum.photos/seed/up/40/40',
    color: 'bg-emerald-500',
    group: 'Tomorrow',
    members: ['1', '7']
  }
];

export const MOCK_SCHEDULE = [
  {
    id: 's1',
    title: 'Project Discovery Call',
    time: '30 minute call with Client',
    duration: '28:35',
    active: true,
    members: ['1', '2', '3']
  }
];

export const PIPELINE_STAGES = [
  { id: 'lead', name: 'Lead', color: 'bg-slate-200' },
  { id: 'contacted', name: 'Contacted', color: 'bg-blue-200' },
  { id: 'meeting', name: 'Meeting', color: 'bg-cyan-200' },
  { id: 'proposal', name: 'Proposal Sent', color: 'bg-indigo-200' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-amber-200' },
  { id: 'won', name: 'Won', color: 'bg-emerald-200' },
];

export const MOCK_LEADS = [
  { id: 'lead_1', name: 'Nike Summer Campaign', company: 'Nike', value: 450000, stage: 'meeting' },
  { id: 'lead_2', name: 'RedBull Extreme Sports Doc', company: 'RedBull', value: 1250000, stage: 'proposal' },
  { id: 'lead_3', name: 'Apple Vision Pro Launch', company: 'Apple', value: 950000, stage: 'negotiation' },
  { id: 'lead_4', name: 'Zara Fall Collection', company: 'Inditex', value: 350000, stage: 'won' },
];

export const MOCK_PROJECTS = [
  { id: 'proj_1', name: 'R&D for New Mobile App', status: 'In Progress', progress: 35, color: 'card-pink' },
  { id: 'proj_2', name: 'Create Brand Identity', status: 'In Progress', progress: 65, color: 'card-purple' },
];

export const MOCK_TALENTS = [
  { id: 'tal_1', name: 'Sarah Jenkins', category: 'Actress', rate: '₹1,20,000/day', metrics: '450k Followers', image: 'https://picsum.photos/seed/talent1/300/400' },
  { id: 'tal_2', name: 'Michael Chen', category: 'Influencer', rate: '₹2,50,000/post', metrics: '1.2M Followers', image: 'https://picsum.photos/seed/talent2/300/400' },
];
