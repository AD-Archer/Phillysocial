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
    icon: 'https://media.nbcphiladelphia.com/2021/09/NBC10-favicon.png',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: '6ABC Philadelphia',
    url: 'https://6abc.com/feed/',
    icon: 'https://cdn.abcotvs.com/dip/images/6ABC-favicon.png',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'WHYY',
    url: 'https://whyy.org/feed/',
    icon: 'https://whyy.org/wp-content/uploads/2022/04/cropped-WHYY-favicon-32x32.png',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'FOX 29 Philadelphia',
    url: 'https://www.fox29.com/latest.xml',
    icon: 'https://static.fox29.com/www.fox29.com/content/uploads/2020/06/fox29_favicon.png',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'Philly Voice',
    url: 'https://www.phillyvoice.com/feed/',
    icon: 'https://www.phillyvoice.com/static/favicon/favicon-32x32.png',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'Philadelphia Business Journal',
    url: 'http://feeds.bizjournals.com/bizj_philadelphia',
    icon: 'https://www.bizjournals.com/favicon-32x32.png',
    category: 'business',
    isPhillyNews: true
  },
  {
    name: 'Philadelphia Magazine',
    url: 'https://www.phillymag.com/news/feed/',
    icon: 'https://www.phillymag.com/wp-content/themes/philadelphia-magazine/favicon/favicon-32x32.png',
    category: 'lifestyle',
    isPhillyNews: true
  },
  {
    name: 'PHL17',
    url: 'https://phl17.com/feed/',
    icon: 'https://i.imgur.com/8KgVR5j.png',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'Philly Sports Nation',
    url: 'https://phlsportsnation.com/feed/',
    icon: 'https://i.imgur.com/JNMqBdH.png',
    category: 'sports',
    isPhillyNews: true
  },
  {
    name: 'Chalkbeat Philadelphia',
    url: 'https://www.chalkbeat.org/arc/outboundfeeds/rss/',
    icon: 'https://www.chalkbeat.org/favicon-32x32.png',
    category: 'education',
    isPhillyNews: true
  },
  {
    name: 'The Philadelphia Inquirer',
    url: 'https://www.inquirer.com/rss/',
    icon: 'https://www.inquirer.com/favicon-32x32.png',
    category: 'general',
    isPhillyNews: true
  },
  {
    name: 'KYW Newsradio',
    url: 'https://www.audacy.com/kywnewsradio/rss/content',
    icon: 'https://www.audacy.com/sites/g/files/exi671/f/favicon-32x32.png',
    category: 'general',
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
    icon: 'https://www.bbc.co.uk/favicon-32x32.png',
    category: 'general',
    isPhillyNews: false
  },
  {
    name: 'The New York Times',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    icon: 'https://www.nytimes.com/favicon.ico',
    category: 'general',
    isPhillyNews: false
  },
  {
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/',
    icon: 'https://www.reuters.com/pf/resources/images/reuters/favicon-32x32.png',
    category: 'general',
    isPhillyNews: false
  },
  {
    name: 'NPR',
    url: 'https://feeds.npr.org/1001/rss.xml',
    icon: 'https://media.npr.org/favicon.ico',
    category: 'general',
    isPhillyNews: false
  },
  {
    name: 'ESPN',
    url: 'https://www.espn.com/espn/rss/news',
    icon: 'https://a.espncdn.com/favicon.ico',
    category: 'sports',
    isPhillyNews: false
  },
  {
    name: 'Wall Street Journal',
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    icon: 'https://www.wsj.com/favicon-32x32.png',
    category: 'business',
    isPhillyNews: false
  }
]; 