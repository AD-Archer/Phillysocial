export interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceIcon?: string;
  category?: string;
  author?: string;
  imageUrl?: string;
  isPhillyNews?: boolean;
}

export interface NewsSource {
  name: string;
  url: string;
  icon?: string;
  category: string;
  isPhillyNews: boolean;
}

// Add pagination types
export interface PaginatedNewsResponse {
  items: NewsItem[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'NBC Philadelphia',
    url: 'https://www.nbcphiladelphia.com/?rss=y',
    icon: 'https://yt3.googleusercontent.com/ytc/AIdro_kyHCixsf9zWqK4GwoRjvezucBSfB-qdR5CdOgZy9Qp8f76=s900-c-k-c0x00ffffff-no-rj',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: '6ABC Philadelphia',
    url: 'https://6abc.com/feed/',
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTf5buPNyVTRvSdoVDxI8GuX6JONSIljzcQww&s',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'WHYY',
    url: 'https://whyy.org/feed/',
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4RKTQbXhHOsG-SmYSPWR9anemVDAhR-R43A&s',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'FOX 29 Philadelphia',
    url: 'https://www.fox29.com/latest.xml',
    icon: 'https://yt3.googleusercontent.com/H2n4VibdEwH3_tR4E5SBAE3r4PtxTLjoEY88XUA6Sgo_dKfv_6y26HVJ1Qgar-rB67ghhocGnQ=s900-c-k-c0x00ffffff-no-rj',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'Philly Voice',
    url: 'https://www.phillyvoice.com/feed/',
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2OeXo5cDqIs4y07c0rQNdwS5m5k-dFR9Msg&s',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'Philadelphia Business Journal',
    url: 'http://feeds.bizjournals.com/bizj_philadelphia',
    icon: 'https://media.licdn.com/dms/image/v2/D4E0BAQEkx52atwcYMg/company-logo_200_200/company-logo_200_200/0/1715345484638/philadelphia_business_journal_logo?e=2147483647&v=beta&t=T4woOz9_gPunzVBtwoDiXC76Nzh0_vqwItH_bgpwzuE',
    category: 'business',
    isPhillyNews: true
  },
  {
    name: 'Philadelphia Magazine',
    url: 'https://www.phillymag.com/news/feed/',
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDBMMKuFAAKmeXC0WHrSx40jpHSnW1b3W5wQ&s',
    category: 'lifestyle',
    isPhillyNews: true
  },
  {
    name: 'PHL17',
    url: 'https://phl17.com/feed/',
    icon: 'https://phl17.com/wp-content/uploads/sites/25/2019/10/cropped-PHL17-FAVICON-1.png',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'Philly Sports Nation',
    url: 'https://phlsportsnation.com/feed/',
    icon: 'https://phlsportsnation.com/wp-content/uploads/2019/01/cropped-PSN-Logo-Square-32x32.png',
    category: 'sports',
    isPhillyNews: true
  },
  {
    name: 'Chalkbeat Philadelphia',
    url: 'https://www.chalkbeat.org/arc/outboundfeeds/rss/',
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8ZSYwnQz8dsD9w8vdwLiq2gGJGu6cCvP0-Q&s',
    category: 'education',
    isPhillyNews: true
  },
  // Non-Philly news sources
  {
    name: 'CNN',
    url: 'http://rss.cnn.com/rss/cnn_topstories.rss',
    icon: 'https://cdn.cnn.com/cnn/.e/img/3.0/global/misc/cnn-logo.png',
    category: 'general',
    isPhillyNews: false
  },
  {
    name: 'BBC News',
    url: 'http://feeds.bbci.co.uk/news/rss.xml',
    icon: 'https://m.files.bbci.co.uk/modules/bbc-morph-news-waf-page-meta/5.2.0/apple-touch-icon.png',
    category: 'general',
    isPhillyNews: false
  },
  {
    name: 'The New York Times',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    icon: 'https://www.nytimes.com/vi-assets/static-assets/apple-touch-icon-28865b72953380a40aa43318108876cb.png',
    category: 'general',
    isPhillyNews: false
  },
  {
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/',
    icon: 'https://www.reuters.com/pf/resources/images/reuters/logo-vertical-default.svg?d=116',
    category: 'general',
    isPhillyNews: false
  },
  {
    name: 'NPR',
    url: 'https://feeds.npr.org/1001/rss.xml',
    icon: 'https://media.npr.org/chrome/npr-logo.jpg',
    category: 'general',
    isPhillyNews: false
  }
]; 