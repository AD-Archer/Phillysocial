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
}

export interface NewsSource {
  name: string;
  url: string;
  icon?: string;
  category: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'NBC Philadelphia',
    url: 'https://feeds.nbcphiladelphia.com/news/local',
    icon: 'https://media.nbcphiladelphia.com/2019/09/NBC10_WCAU_Philadelphia.png',
    category: 'general'
  },
  {
    name: 'CBS Philadelphia',
    url: 'https://www.cbsnews.com/philadelphia/feed/rss/local/',
    icon: 'https://philadelphia.cbslocal.com/wp-content/uploads/sites/15116066/2022/01/CBS3_LOGO.png',
    category: 'general'
  },
  {
    name: 'Philadelphia Inquirer',
    url: 'https://www.inquirer.com/rss',
    icon: 'https://www.inquirer.com/favicon-32x32.png',
    category: 'general'
  },
  {
    name: 'KYW Newsradio',
    url: 'https://www.audacy.com/kywnewsradio/rss/news',
    icon: 'https://www.audacy.com/kywnewsradio/favicon.ico',
    category: 'general'
  },
  {
    name: 'Billy Penn',
    url: 'https://billypenn.com/feed/',
    icon: 'https://billypenn.com/wp-content/uploads/2018/06/cropped-bp-favicon-1-192x192.png',
    category: 'lifestyle'
  },
  {
    name: 'Philadelphia Tribune',
    url: 'https://www.phillytrib.com/search/?f=rss',
    icon: 'https://www.phillytrib.com/favicon.ico',
    category: 'general'
  }
]; 