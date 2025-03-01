export interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  source: string;
  sourceIcon?: string;
  category?: string;
  author?: string;
  imageUrl?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  icon?: string;
  category?: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'phillyvoice',
    name: 'PhillyVoice',
    url: 'https://www.phillyvoice.com/feed/',
    icon: 'https://phillyvoice.com/static/global/images/feed-logo.png',
    category: 'general'
  },
  {
    id: 'nbc',
    name: 'NBC Philadelphia',
    url: 'https://www.nbcphiladelphia.com/?rss=y',
    category: 'general'
  },
  {
    id: 'bizjournals',
    name: 'Philadelphia Business Journal',
    url: 'http://feeds.bizjournals.com/bizj_philadelphia',
    category: 'business'
  },
  {
    id: '6abc',
    name: '6ABC Philadelphia',
    url: 'https://6abc.com/feed/',
    category: 'general'
  },
  {
    id: 'chalkbeat',
    name: 'Chalkbeat Philadelphia',
    url: 'https://www.chalkbeat.org/arc/outboundfeeds/rss/',
    category: 'education'
  },
  {
    id: 'phillymag',
    name: 'Philadelphia Magazine',
    url: 'https://www.phillymag.com/news/feed/',
    category: 'lifestyle'
  },
  {
    id: 'phl17',
    name: 'PHL17',
    url: 'https://phl17.com/feed/',
    category: 'general'
  },
  {
    id: 'fox29',
    name: 'FOX 29',
    url: 'https://www.fox29.com/latest.xml',
    category: 'general'
  },
  {
    id: 'whyy',
    name: 'WHYY',
    url: 'https://whyy.org/feed/',
    category: 'general'
  },
  {
    id: 'phlsports',
    name: 'PHL Sports Nation',
    url: 'https://phlsportsnation.com/feed/',
    category: 'sports'
  },
  {
    id: 'cbsphilly',
    name: 'CBS Philadelphia',
    url: 'https://philadelphia.cbslocal.com/feed/',
    category: 'general'
  }
]; 