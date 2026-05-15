// Translation system for Michelin Guide China

export type Locale = "zh" | "en";

interface Translations {
  [key: string]: string;
}

const zh: Translations = {
  // Navigation
  "nav.discover": "探索",
  "nav.map": "地图",
  "nav.city": "城市",
  "nav.favorites": "收藏",
  "nav.aiAdvisor": "AI顾问",
  "nav.login": "登录",
  "nav.logout": "退出",

  // Home
  "home.hero.title": "发现卓越",
  "home.hero.subtitle": "探索中国顶级米其林星级餐厅与必比登推介",
  "home.hero.placeholder": "搜索城市、餐厅或菜系...",
  "home.cities.title": "探索城市",
  "home.featured.title": "精选推荐",
  "home.featured.viewAll": "查看全部",
  "home.about.title": "关于米其林指南",
  "home.about.desc": "米其林指南诞生于1900年的法国，是全球最具权威性的餐厅评价体系之一。米其林评审员以匿名身份造访餐厅，从食材品质、烹饪技艺、味道融合、厨师个性、性价比五个维度进行评价。在中国大陆、香港、澳门和台湾地区，米其林指南已覆盖北京、上海、广州、成都、杭州、深圳等多个城市，为美食爱好者提供最权威的餐饮推荐。",
  "home.about.cta": "开始探索",

  // Discovery
  "discover.filter": "筛选",
  "discover.clearAll": "清除全部",
  "discover.sort.name": "名称",
  "discover.sort.rating": "评分",
  "discover.sort.priceAsc": "价格升序",
  "discover.sort.priceDesc": "价格降序",
  "discover.award.label": "奖项类型",
  "discover.sort.label": "排序",
  "discover.total": "共 {count} 家餐厅",
  "discover.prev": "上一页",
  "discover.next": "下一页",

  // Map
  "map.nearbyTitle": "附近餐厅",
  "map.locating": "正在定位当前城市",
  "map.cityDetected": "已定位到 {city}",
  "map.locationFallback": "未获取定位，显示 {city}",
  "map.count": "{city} 附近 {count} 家餐厅",
  "map.relocate": "重新定位",
  "map.yourLocation": "你的位置",
  "map.empty": "附近暂无可显示的餐厅",

  // City View
  "city.back": "返回",
  "city.stats": "共 {total} 家餐厅{stars}",

  // Restaurant Detail
  "detail.address": "地址",
  "detail.hours": "营业时间",
  "detail.phone": "电话",
  "detail.website": "网站",
  "detail.about": "关于餐厅",
  "detail.tips": "小贴士",
  "detail.navigate": "导航前往",
  "detail.share": "分享",
  "detail.favorite": "收藏",
  "detail.favorited": "已收藏",
  "detail.notFound": "餐厅未找到",
  "detail.backHome": "返回首页",
  "detail.viewDetails": "查看详情",
  "detail.selectNav": "选择导航",
  "detail.amap": "高德地图",
  "detail.baidu": "百度地图",

  // Awards
  "award.3-star": "米其林三星",
  "award.2-star": "米其林二星",
  "award.1-star": "米其林一星",
  "award.bib-gourmand": "必比登推介",
  "award.selected": "米其林入选",

  // Favorites
  "fav.empty.title": "暂无收藏",
  "fav.empty.desc": "点击任意餐厅上的心形图标，即可在这里找到它",
  "fav.empty.cta": "探索餐厅",
  "fav.login.title": "请先登录",
  "fav.login.desc": "登录后即可收藏您喜爱的餐厅",
  "fav.login.cta": "前往登录",
  "fav.count": "共 {count} 家餐厅",

  // AI Advisor
  "ai.title": "米其林AI顾问",
  "ai.subtitle": "智能美食推荐助手",
  "ai.placeholder": "输入您的问题，如：推荐一家上海粤菜餐厅...",
  "ai.greeting": "您好！我是米其林AI美食顾问。我可以帮您推荐餐厅、解答美食相关问题。请问有什么可以帮您的？",
  "ai.panel.title": "米其林AI顾问",
  "ai.panel.subtitle": "智能美食推荐",
  "ai.quickPrompt1": "推荐一家粤菜餐厅",
  "ai.quickPrompt2": "有哪些三星餐厅",
  "ai.quickPrompt3": "附近的必比登推介",
  "ai.quickPrompt4": "最好吃的川菜",
  "ai.quickPrompt5": "适合约会的餐厅",
  "ai.quickPrompt6": "素食餐厅推荐",

  // Login
  "login.title": "MICHELIN GUIDE",
  "login.loginDesc": "登录您的账户",
  "login.registerDesc": "创建新账户",
  "login.username": "用户名",
  "login.usernamePlaceholder": "请输入用户名",
  "login.email": "邮箱（可选）",
  "login.emailPlaceholder": "请输入邮箱",
  "login.password": "密码",
  "login.passwordPlaceholder": "请输入密码",
  "login.registerPassword": "至少6位",
  "login.error.fill": "请填写用户名和密码",
  "login.error.short": "密码至少6位",
  "login.loginBtn": "登录",
  "login.registerBtn": "注册",
  "login.switchRegister": "没有账户？立即注册",
  "login.switchLogin": "已有账户？立即登录",
  "login.or": "或",
  "login.kimi": "使用 Kimi 账号登录",

  // Cuisines
  "cuisine.cantonese": "粤菜",
  "cuisine.sichuan": "川菜",
  "cuisine.hunan": "湘菜",
  "cuisine.jiangsu": "苏菜",
  "cuisine.shanghainese": "上海菜",
  "cuisine.french": "法国菜",
  "cuisine.italian": "意大利菜",
  "cuisine.japanese": "日本料理",
  "cuisine.thai": "泰国菜",
  "cuisine.korean": "韩国料理",
  "cuisine.indian": "印度菜",
  "cuisine.spanish": "西班牙菜",
  "cuisine.creative": "创意菜",
  "cuisine.fusion": "融合料理",
  "cuisine.vegetarian": "素食",
  "cuisine.seafood": "海鲜",
  "cuisine.dimsum": "点心",
  "cuisine.hotpot": "火锅",
  "cuisine.noodles": "面食",
  "cuisine.steak": "牛排",
  "cuisine.hangzhou": "杭帮菜",
  "cuisine.fujian": "闽菜",
  "cuisine.hakka": "客家菜",
  "cuisine.teochew": "潮州菜",
  "cuisine.taiwanese": "台湾菜",
  "cuisine.beijing": "北京菜",

  // Common
  "common.loading": "加载中...",
  "common.mapLoading": "加载地图中...",
  "common.mapError": "地图加载失败",
  "common.networkError": "请检查网络连接",
  "common.search": "搜索",
};

const en: Translations = {
  "nav.discover": "Discover",
  "nav.map": "Map",
  "nav.city": "Cities",
  "nav.favorites": "Favorites",
  "nav.aiAdvisor": "AI Advisor",
  "nav.login": "Login",
  "nav.logout": "Logout",

  "home.hero.title": "Discover Excellence",
  "home.hero.subtitle": "Explore top MICHELIN-starred & Bib Gourmand restaurants in China",
  "home.hero.placeholder": "Search city, restaurant or cuisine...",
  "home.cities.title": "Explore Cities",
  "home.featured.title": "Featured",
  "home.featured.viewAll": "View All",
  "home.about.title": "About MICHELIN Guide",
  "home.about.desc": "Born in France in 1900, the MICHELIN Guide is one of the world's most authoritative restaurant rating systems. Inspectors visit anonymously, evaluating ingredients, cooking techniques, flavor harmony, chef personality, and value. Across mainland China, Hong Kong, Macau and Taiwan, the Guide covers Beijing, Shanghai, Guangzhou, Chengdu, Hangzhou, Shenzhen and more.",
  "home.about.cta": "Start Exploring",

  "discover.filter": "Filters",
  "discover.clearAll": "Clear All",
  "discover.sort.name": "Name",
  "discover.sort.rating": "Rating",
  "discover.sort.priceAsc": "Price Low",
  "discover.sort.priceDesc": "Price High",
  "discover.award.label": "Award Type",
  "discover.sort.label": "Sort",
  "discover.total": "{count} restaurants",
  "discover.prev": "Previous",
  "discover.next": "Next",

  "map.nearbyTitle": "Nearby Restaurants",
  "map.locating": "Locating current city",
  "map.cityDetected": "Located in {city}",
  "map.locationFallback": "Location unavailable, showing {city}",
  "map.count": "{count} restaurants near {city}",
  "map.relocate": "Relocate",
  "map.yourLocation": "Your location",
  "map.empty": "No nearby restaurants to show",

  "city.back": "Back",
  "city.stats": "{total} restaurants{stars}",

  "detail.address": "Address",
  "detail.hours": "Opening Hours",
  "detail.phone": "Phone",
  "detail.website": "Website",
  "detail.about": "About",
  "detail.tips": "Tips",
  "detail.navigate": "Navigate",
  "detail.share": "Share",
  "detail.favorite": "Save",
  "detail.favorited": "Saved",
  "detail.notFound": "Restaurant not found",
  "detail.backHome": "Back to Home",
  "detail.viewDetails": "View Details",
  "detail.selectNav": "Select Navigation",
  "detail.amap": "Amap",
  "detail.baidu": "Baidu Map",

  "award.3-star": "3 MICHELIN Stars",
  "award.2-star": "2 MICHELIN Stars",
  "award.1-star": "1 MICHELIN Star",
  "award.bib-gourmand": "Bib Gourmand",
  "award.selected": "Selected",

  "fav.empty.title": "No Favorites",
  "fav.empty.desc": "Tap the heart icon on any restaurant to save it here",
  "fav.empty.cta": "Explore Restaurants",
  "fav.login.title": "Please Log In",
  "fav.login.desc": "Log in to save your favorite restaurants",
  "fav.login.cta": "Go to Login",
  "fav.count": "{count} restaurants",

  "ai.title": "MICHELIN AI Advisor",
  "ai.subtitle": "Intelligent Dining Recommendations",
  "ai.placeholder": "Ask me anything, e.g., recommend a Cantonese restaurant...",
  "ai.greeting": "Hello! I'm your MICHELIN AI dining advisor. I can recommend restaurants and answer food-related questions. How can I help?",
  "ai.panel.title": "MICHELIN AI Advisor",
  "ai.panel.subtitle": "Smart Dining Guide",
  "ai.quickPrompt1": "Recommend a Cantonese restaurant",
  "ai.quickPrompt2": "Show 3-star restaurants",
  "ai.quickPrompt3": "Nearby Bib Gourmand picks",
  "ai.quickPrompt4": "Best Sichuan cuisine",
  "ai.quickPrompt5": "Date night restaurants",
  "ai.quickPrompt6": "Vegetarian options",

  "login.title": "MICHELIN GUIDE",
  "login.loginDesc": "Sign in to your account",
  "login.registerDesc": "Create a new account",
  "login.username": "Username",
  "login.usernamePlaceholder": "Enter username",
  "login.email": "Email (optional)",
  "login.emailPlaceholder": "Enter email",
  "login.password": "Password",
  "login.passwordPlaceholder": "Enter password",
  "login.registerPassword": "Min 6 characters",
  "login.error.fill": "Please fill in username and password",
  "login.error.short": "Password must be at least 6 characters",
  "login.loginBtn": "Sign In",
  "login.registerBtn": "Sign Up",
  "login.switchRegister": "No account? Register",
  "login.switchLogin": "Have an account? Sign In",
  "login.or": "or",
  "login.kimi": "Sign in with Kimi",

  "cuisine.cantonese": "Cantonese",
  "cuisine.sichuan": "Sichuan",
  "cuisine.hunan": "Hunan",
  "cuisine.jiangsu": "Jiangsu",
  "cuisine.shanghainese": "Shanghainese",
  "cuisine.french": "French",
  "cuisine.italian": "Italian",
  "cuisine.japanese": "Japanese",
  "cuisine.thai": "Thai",
  "cuisine.korean": "Korean",
  "cuisine.indian": "Indian",
  "cuisine.spanish": "Spanish",
  "cuisine.creative": "Creative",
  "cuisine.fusion": "Fusion",
  "cuisine.vegetarian": "Vegetarian",
  "cuisine.seafood": "Seafood",
  "cuisine.dimsum": "Dim Sum",
  "cuisine.hotpot": "Hot Pot",
  "cuisine.noodles": "Noodles",
  "cuisine.steak": "Steak",
  "cuisine.hangzhou": "Hangzhou",
  "cuisine.fujian": "Fujian",
  "cuisine.hakka": "Hakka",
  "cuisine.teochew": "Teochew",
  "cuisine.taiwanese": "Taiwanese",
  "cuisine.beijing": "Beijing",

  "common.loading": "Loading...",
  "common.mapLoading": "Loading map...",
  "common.mapError": "Map failed to load",
  "common.networkError": "Please check your connection",
  "common.search": "Search",
};

const dictionaries: Record<Locale, Translations> = { zh, en };

export function t(key: string, locale: Locale, params?: Record<string, string | number>): string {
  const dict = dictionaries[locale] || zh;
  let text = dict[key] || zh[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

// Award translations
export function translateAward(award: string, locale: Locale): string {
  return t(`award.${award}`, locale);
}

// Cuisine translations
const cuisineMap: Record<string, string> = {
  "Cantonese": "粤菜", "Sichuan": "川菜", "Hunan": "湘菜",
  "Jiangsu": "苏菜", "Shanghainese": "上海菜", "Shanghai": "上海菜",
  "French": "法国菜", "Italian": "意大利菜", "Japanese": "日本料理",
  "Thai": "泰国菜", "Korean": "韩国料理", "Indian": "印度菜",
  "Spanish": "西班牙菜", "Creative": "创意菜", "Fusion": "融合料理",
  "Vegetarian": "素食", "Seafood": "海鲜", "Dim Sum": "点心",
  "Hot Pot": "火锅", "Noodles": "面食", "Steak": "牛排",
  "Hangzhou": "杭帮菜", "Fujian": "闽菜", "Hakka": "客家菜",
  "Teochew": "潮州菜", "Taiwanese": "台湾菜", "Beijing": "北京菜",
};

export function translateCuisine(cuisine: string, locale: Locale): string {
  if (locale === "en") return cuisine;
  // Try exact match
  if (cuisineMap[cuisine]) return cuisineMap[cuisine];
  // Try partial match
  for (const [en, zh] of Object.entries(cuisineMap)) {
    if (cuisine.toLowerCase().includes(en.toLowerCase())) return zh;
  }
  return cuisine;
}
