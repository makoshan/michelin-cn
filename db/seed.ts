import { getDb } from "../server/queries/connection";
import { restaurants } from "./schema";

const restaurantData = [
  // 上海 - 2星
  { name: "ULTRAVIOLET by Paul Pairet", nameEn: "ULTRAVIOLET by Paul Pairet", city: "上海", district: "黄浦区", address: "中山东一路18号", latitude: 31.2304, longitude: 121.4906, award: "3-star" as const, cuisine: "创意菜", priceRange: 4, phone: "+86 21 6323 9898", description: "一晚只接待10位客人，通过紫外线灯光和音效营造沉浸式用餐体验", rating: "4.9", reviewCount: 127 },
  { name: "DA VITTORIO SHANGHAI", nameEn: "DA VITTORIO SHANGHAI", city: "上海", district: "黄浦区", address: "中山东二路600号BFC外滩金融中心北区N3栋3楼", latitude: 31.2304, longitude: 121.4937, award: "2-star" as const, cuisine: "意大利菜", priceRange: 4, phone: "+86 21 6333 9199", description: "来自意大利贝加莫的家族餐厅，以海鲜和意面闻名", rating: "4.8", reviewCount: 342 },
  { name: "Taian Table", nameEn: "Taian Table", city: "上海", district: "徐汇区", address: "泰安路113号", latitude: 31.2158, longitude: 121.4425, award: "2-star" as const, cuisine: "西餐", priceRange: 4, phone: "+86 21 6283 9260", description: "由德国主厨Stefan Stiller主理的现代欧洲料理", rating: "4.8", reviewCount: 289 },
  { name: "8 1/2 Otto e Mezzo BOMBANA", nameEn: "8 1/2 Otto e Mezzo BOMBANA", city: "上海", district: "静安区", address: "圆明园路169号协进大楼6楼", latitude: 31.2406, longitude: 121.4856, award: "2-star" as const, cuisine: "意大利菜", priceRange: 4, phone: "+86 21 6087 2890", description: "由名厨Umberto Bombana主理的顶级意大利餐厅", rating: "4.7", reviewCount: 256 },
  
  // 上海 - 1星
  { name: "福和慧", nameEn: "Fu He Hui", city: "上海", district: "长宁区", address: "愚园路1037号", latitude: 31.2244, longitude: 121.4286, award: "1-star" as const, cuisine: "素食", priceRange: 4, phone: "+86 21 5239 7878", description: "精致素食料理，每季更换菜单", rating: "4.7", reviewCount: 198 },
  { name: "明阁", nameEn: "Ming Court", city: "上海", district: "虹桥", address: "虹桥天地康得思酒店", latitude: 31.1924, longitude: 121.3206, award: "1-star" as const, cuisine: "粤菜", priceRange: 3, phone: "+86 21 5263 9618", description: "由香港米其林星级团队打造的粤菜餐厅", rating: "4.6", reviewCount: 176 },
  { name: "Jean Georges", nameEn: "Jean Georges", city: "上海", district: "黄浦区", address: "中山东一路3号外滩三号4楼", latitude: 31.2356, longitude: 121.4858, award: "1-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+86 21 6321 7733", description: "Jean-Georges Vongerichten在上海的旗舰餐厅", rating: "4.6", reviewCount: 312 },
  { name: "Maison Lameloise", nameEn: "Maison Lameloise", city: "上海", district: "浦东新区", address: "银城中路501号上海中心大厦68楼", latitude: 31.2358, longitude: 121.5065, award: "1-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+86 21 6881 3811", description: "来自法国勃艮第的百年三星餐厅上海分店", rating: "4.5", reviewCount: 234 },
  { name: "Obscura by 唐香", nameEn: "Obscura", city: "上海", district: "徐汇区", address: "复兴西路100号", latitude: 31.2167, longitude: 121.4434, award: "1-star" as const, cuisine: "中餐", priceRange: 4, phone: "+86 21 6437 5565", description: "现代中餐，将传统中国风味与创新技法融合", rating: "4.6", reviewCount: 156 },
  { name: "EHB餐厅", nameEn: "EHB", city: "上海", district: "徐汇区", address: "东平路11号", latitude: 31.2156, longitude: 121.4556, award: "1-star" as const, cuisine: "北欧菜", priceRange: 4, phone: "+86 21 6428 9999", description: "由挪威米其林三星主厨Esben Holmboe Bang主理", rating: "4.7", reviewCount: 143 },
  { name: "凌珑", nameEn: "Ling Long", city: "上海", district: "黄浦区", address: "中山东一路3号外滩三号", latitude: 31.2359, longitude: 121.4860, award: "1-star" as const, cuisine: "中餐", priceRange: 4, phone: "+86 21 6321 0999", description: "年轻主厨Jason Liu的现代中餐料理", rating: "4.7", reviewCount: 167 },
  { name: "遇外滩", nameEn: "Meet the Bund", city: "上海", district: "黄浦区", address: "中山东二路600号BFC外滩金融中心", latitude: 31.2300, longitude: 121.4940, award: "1-star" as const, cuisine: "闽菜", priceRange: 3, phone: "+86 21 6333 1177", description: "高端福建菜，由年轻主厨吴嵘主理", rating: "4.6", reviewCount: 134 },
  { name: "New Wave by Da Vittorio", nameEn: "New Wave by Da Vittorio", city: "上海", district: "黄浦区", address: "中山东一路3号外滩三号2楼", latitude: 31.2357, longitude: 121.4859, award: "1-star" as const, cuisine: "意大利菜", priceRange: 3, phone: "+86 21 6321 0101", description: "Da Vittorio旗下的休闲意大利餐厅", rating: "4.5", reviewCount: 189 },
  { name: " mercato by Jean-Georges", nameEn: "Mercato by Jean-Georges", city: "上海", district: "黄浦区", address: "中山东一路3号外滩三号6楼", latitude: 31.2355, longitude: 121.4857, award: "1-star" as const, cuisine: "意大利菜", priceRange: 3, phone: "+86 21 6321 9922", description: "Jean-Georges的意大利风格休闲餐厅", rating: "4.5", reviewCount: 278 },
  
  // 上海 - Bib Gourmand
  { name: "大壶春", nameEn: "Da Hu Chun", city: "上海", district: "黄浦区", address: "云南南路71号", latitude: 31.2345, longitude: 121.4789, award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 1, phone: "+86 21 6328 3738", description: "老字号生煎包，创立于1932年", rating: "4.4", reviewCount: 892 },
  { name: "老正兴菜馆", nameEn: "Lao Zheng Xing", city: "上海", district: "黄浦区", address: "福州路556号", latitude: 31.2350, longitude: 121.4734, award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 2, phone: "+86 21 6322 2684", description: "创立于1862年的本帮菜老字号", rating: "4.3", reviewCount: 756 },
  { name: "蘭心餐厅", nameEn: "Lan Xin", city: "上海", district: "黄浦区", address: "进贤路130号", latitude: 31.2189, longitude: 121.4623, award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 1, phone: "+86 21 6253 3288", description: "进贤路上的本帮菜小馆，环境朴素味道地道", rating: "4.4", reviewCount: 534 },
  { name: "茂隆餐厅", nameEn: "Mao Long", city: "上海", district: "黄浦区", address: "进贤路134号", latitude: 31.2188, longitude: 121.4624, award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 1, phone: "+86 21 6253 3118", description: "进贤路上另一家本帮菜名店", rating: "4.3", reviewCount: 445 },
  { name: "海金滋", nameEn: "Hai Jin Zi", city: "上海", district: "黄浦区", address: "进贤路240号", latitude: 31.2180, longitude: 121.4620, award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 1, phone: "+86 21 6217 9992", description: "人气本帮菜小馆，浓油赤酱", rating: "4.3", reviewCount: 678 },
  { name: "南翔馒头店", nameEn: "Nan Xiang Steamed Bun", city: "上海", district: "黄浦区", address: "豫园路85号", latitude: 31.2278, longitude: 121.4917, award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 1, phone: "+86 21 6355 4200", description: "豫园老字号，以蟹粉小笼闻名", rating: "4.2", reviewCount: 1234 },
  { name: "甬府尊鲜", nameEn: "Yong Fu Zun Xian", city: "上海", district: "浦东新区", address: "世纪大道100号环球金融中心2楼", latitude: 31.2361, longitude: 121.5048, award: "bib-gourmand" as const, cuisine: "宁波菜", priceRange: 2, phone: "+86 21 6877 5777", description: "高端宁波菜，海鲜见长", rating: "4.4", reviewCount: 345 },
  { name: "荣小馆", nameEn: "Rong Xiao Guan", city: "上海", district: "静安区", address: "南京西路1515号嘉里中心", latitude: 31.2267, longitude: 121.4500, award: "bib-gourmand" as const, cuisine: "台州菜", priceRange: 2, phone: "+86 21 6262 7718", description: "新荣记旗下品牌，台州家常菜", rating: "4.4", reviewCount: 456 },
  { name: "吉士酒家", nameEn: "Ji Shi", city: "上海", district: "徐汇区", address: "天平路41号", latitude: 31.1989, longitude: 121.4389, award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 2, phone: "+86 21 6282 8926", description: "天平路上的本帮菜名店，红烧肉是招牌", rating: "4.3", reviewCount: 567 },
  
  // 北京 - 3星
  { name: "新荣记（新源南路）", nameEn: "Xin Rong Ji", city: "北京", district: "朝阳区", address: "新源南路8号启皓北京东塔1层", latitude: 39.9406, longitude: 116.4578, award: "3-star" as const, cuisine: "台州菜", priceRange: 4, phone: "+86 10 6502 7699", description: "中国首家米其林三星中餐，以海鲜和台州菜闻名", rating: "4.9", reviewCount: 423 },
  { name: "京兆尹", nameEn: "King's Joy", city: "北京", district: "东城区", address: "雍和宫大街五道营胡同2号", latitude: 39.9489, longitude: 116.4106, award: "3-star" as const, cuisine: "素食", priceRange: 4, phone: "+86 10 8404 9191", description: "米其林三星素食餐厅，也是绿星餐厅", rating: "4.8", reviewCount: 356 },
  
  // 北京 - 2星
  { name: "潮上潮（朝阳）", nameEn: "Chao Shang Chao", city: "北京", district: "朝阳区", address: "东三环中路7号财富购物中心", latitude: 39.9072, longitude: 116.4567, award: "2-star" as const, cuisine: "潮州菜", priceRange: 4, phone: "+86 10 8587 9999", description: "高端潮州菜，以海鲜和精细烹饪著称", rating: "4.7", reviewCount: 234 },
  { name: "屋里厢", nameEn: "Wu Li Xiang", city: "北京", district: "朝阳区", address: "工体北路4号院", latitude: 39.9317, longitude: 116.4425, award: "2-star" as const, cuisine: "上海菜", priceRange: 3, phone: "+86 10 6585 8899", description: "上海本帮菜在北京的代表，浓油赤酱", rating: "4.6", reviewCount: 312 },
  { name: "京季", nameEn: "Jing Ji", city: "北京", district: "朝阳区", address: "新源南路16号世方豪庭2楼", latitude: 39.9400, longitude: 116.4580, award: "2-star" as const, cuisine: "官府菜", priceRange: 4, phone: "+86 10 6468 5565", description: "高端官府菜，传承宫廷烹饪技艺", rating: "4.7", reviewCount: 189 },
  
  // 北京 - 1星
  { name: "晟永兴（五道口）", nameEn: "Sheng Yong Xing", city: "北京", district: "海淀区", address: "中关村东路1号院", latitude: 39.9823, longitude: 116.3356, award: "1-star" as const, cuisine: "北京烤鸭", priceRange: 3, phone: "+86 10 6256 9999", description: "以烤鸭闻名的京菜餐厅", rating: "4.6", reviewCount: 445 },
  { name: "承味堂", nameEn: "Cheng Wei Tang", city: "北京", district: "朝阳区", address: "三里屯太古里北区N4楼", latitude: 39.9356, longitude: 116.4556, award: "1-star" as const, cuisine: "鲁菜", priceRange: 3, phone: "+86 10 6417 9999", description: "新派鲁菜，注重食材本味", rating: "4.5", reviewCount: 278 },
  { name: "曲廊院", nameEn: "Qu Lang Yuan", city: "北京", district: "东城区", address: "东四十条25号", latitude: 39.9312, longitude: 116.4300, award: "1-star" as const, cuisine: "创意菜", priceRange: 4, phone: "+86 10 6406 5555", description: "胡同里的精致料理", rating: "4.5", reviewCount: 234 },
  { name: "山河万朵", nameEn: "Shan He Wan Duo", city: "北京", district: "东城区", address: "王府井大街王府中环", latitude: 39.9108, longitude: 116.4103, award: "1-star" as const, cuisine: "素食", priceRange: 3, phone: "+86 10 6526 8888", description: "现代素食餐厅，环境优雅", rating: "4.5", reviewCount: 198 },
  { name: "富临饭店", nameEn: "Forum", city: "北京", district: "朝阳区", address: "国贸大酒店4楼", latitude: 39.9089, longitude: 116.4600, award: "1-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+86 10 8571 6464", description: "香港富临饭店北京分店，阿一鲍鱼", rating: "4.6", reviewCount: 267 },
  { name: " già già ", nameEn: "Giada Garden", city: "北京", district: "朝阳区", address: "建国门外大街1号国贸大酒店3楼", latitude: 39.9090, longitude: 116.4601, award: "1-star" as const, cuisine: "意大利菜", priceRange: 4, phone: "+86 10 6505 2299", description: "Chef Marino主理的精致意大利菜", rating: "4.5", reviewCount: 234 },
  { name: "老吉堂（工体）", nameEn: "Lao Ji Tang", city: "北京", district: "朝阳区", address: "工体南路15号", latitude: 39.9300, longitude: 116.4456, award: "1-star" as const, cuisine: "上海菜", priceRange: 2, phone: "+86 10 6551 8888", description: "老北京人心中的上海味道", rating: "4.4", reviewCount: 345 },
  
  // 北京 - Bib Gourmand
  { name: "爆肚金生隆", nameEn: "Bao Du Jin Sheng Long", city: "北京", district: "西城区", address: "德外大街36号", latitude: 39.9534, longitude: 116.3800, award: "bib-gourmand" as const, cuisine: "北京菜", priceRange: 1, phone: "+86 10 6204 6688", description: "百年爆肚老字号，创立于1917年", rating: "4.3", reviewCount: 678 },
  { name: "柴氏风味斋", nameEn: "Chai Shi", city: "北京", district: "海淀区", address: "甘家口北街", latitude: 39.9234, longitude: 116.3334, award: "bib-gourmand" as const, cuisine: "北京菜", priceRange: 1, phone: "+86 10 6834 5678", description: "以牛肉面和酱牛肉闻名", rating: "4.3", reviewCount: 567 },
  { name: "功德林", nameEn: "Gong De Lin", city: "北京", district: "西城区", address: "前门东大街2号", latitude: 39.9000, longitude: 116.4000, award: "bib-gourmand" as const, cuisine: "素食", priceRange: 1, phone: "+86 10 6512 5678", description: "百年素食老字号，创立于1922年", rating: "4.2", reviewCount: 445 },
  { name: "天厨妙香", nameEn: "Tian Chu Miao Xiang", city: "北京", district: "朝阳区", address: "朝阳门北大街6号", latitude: 39.9289, longitude: 116.4356, award: "bib-gourmand" as const, cuisine: "素食", priceRange: 1, phone: "+86 10 6405 8888", description: "精致素食小馆，价格亲民", rating: "4.2", reviewCount: 334 },
  { name: "静一餐厅", nameEn: "Jing Yi", city: "北京", district: "东城区", address: "东直门内大街", latitude: 39.9400, longitude: 116.4289, award: "bib-gourmand" as const, cuisine: "湖北菜", priceRange: 1, phone: "+86 10 6403 7777", description: "地道湖北风味", rating: "4.2", reviewCount: 289 },
  { name: "方砖厂69号炸酱面", nameEn: "Fang Zhuan Chang 69", city: "北京", district: "东城区", address: "方砖厂胡同69号", latitude: 39.9406, longitude: 116.4006, award: "bib-gourmand" as const, cuisine: "北京菜", priceRange: 1, phone: "+86 10 6405 4466", description: "胡同里的老北京炸酱面", rating: "4.3", reviewCount: 1234 },
  { name: "老诚一锅", nameEn: "Lao Cheng Yi Guo", city: "北京", district: "西城区", address: "西四南大街", latitude: 39.9234, longitude: 116.3667, award: "bib-gourmand" as const, cuisine: "北京菜", priceRange: 1, phone: "+86 10 6615 8888", description: "羊蝎子火锅", rating: "4.2", reviewCount: 567 },
  { name: "翠满楼", nameEn: "Cui Man Lou", city: "北京", district: "海淀区", address: "中关村大街", latitude: 39.9834, longitude: 116.3167, award: "bib-gourmand" as const, cuisine: "川菜", priceRange: 1, phone: "+86 10 6256 6666", description: "性价比高的川菜馆", rating: "4.2", reviewCount: 456 },
  
  // 广州
  { name: "江", nameEn: "Jiang by Chef Fei", city: "广州", district: "天河区", address: "天河路389号文华东方酒店3楼", latitude: 23.1389, longitude: 113.3256, award: "2-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+86 20 3808 8888", description: "由辉师傅主理的米其林二星粤菜", rating: "4.8", reviewCount: 312 },
  { name: "御宝轩", nameEn: "Imperial Treasure Fine Chinese Cuisine", city: "广州", district: "天河区", address: "天环广场", latitude: 23.1345, longitude: 113.3234, award: "2-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+86 20 3856 5888", description: "来自新加坡的粤菜名店", rating: "4.7", reviewCount: 267 },
  { name: "泰安 table", nameEn: "Taian Table", city: "广州", district: "天河区", address: "天河路228号正佳广场万豪酒店", latitude: 23.1378, longitude: 113.3267, award: "2-star" as const, cuisine: "西餐", priceRange: 4, phone: "+86 20 3827 8888", description: "现代欧洲料理，广州二星餐厅", rating: "4.7", reviewCount: 234 },
  { name: "炳胜私厨", nameEn: "Bing Sheng Si Chu", city: "广州", district: "天河区", address: "天河东路178号", latitude: 23.1356, longitude: 113.3367, award: "1-star" as const, cuisine: "粤菜", priceRange: 3, phone: "+86 20 8758 8888", description: "炳胜集团的高端私厨品牌", rating: "4.6", reviewCount: 345 },
  { name: "玉堂春暖", nameEn: "Yu Tang Chun Nuan", city: "广州", district: "荔湾区", address: "沙面南街1号白天鹅宾馆3楼", latitude: 23.1089, longitude: 113.2456, award: "1-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+86 20 8188 6968", description: "白天鹅宾馆的招牌中餐厅", rating: "4.7", reviewCount: 289 },
  { name: "丽轩", nameEn: "Li Xuan", city: "广州", district: "天河区", address: "珠江新城兴安路3号丽思卡尔顿酒店3楼", latitude: 23.1189, longitude: 113.3267, award: "1-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+86 20 3813 6688", description: "丽思卡尔顿的中餐厅", rating: "4.6", reviewCount: 198 },
  { name: "Rêver", nameEn: "Rever", city: "广州", district: "海珠区", address: "琶洲大道东", latitude: 23.0989, longitude: 113.3667, award: "1-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+86 20 8923 8888", description: "现代法国料理", rating: "4.6", reviewCount: 167 },
  { name: "广御轩", nameEn: "Guang Yu Xuan", city: "广州", district: "天河区", address: "珠江新城", latitude: 23.1180, longitude: 113.3250, award: "1-star" as const, cuisine: "粤菜", priceRange: 3, phone: "+86 20 3856 6666", description: "新派粤菜", rating: "4.5", reviewCount: 234 },
  { name: "宏图府", nameEn: "Hong Tu Fu", city: "广州", district: "荔湾区", address: "白天鹅宾馆", latitude: 23.1090, longitude: 113.2458, award: "1-star" as const, cuisine: "粤菜", priceRange: 3, phone: "+86 20 8188 6168", description: "白天鹅宾馆的另一间星级餐厅", rating: "4.5", reviewCount: 189 },
  { name: "惠食佳（滨江大公馆）", nameEn: "Hui Shi Jia", city: "广州", district: "海珠区", address: "滨江西路", latitude: 23.1080, longitude: 113.2580, award: "1-star" as const, cuisine: "粤菜", priceRange: 2, phone: "+86 20 3437 8888", description: "以啫啫煲闻名的粤菜名店", rating: "4.6", reviewCount: 567 },
  
  // 广州 - Bib Gourmand
  { name: "陈添记", nameEn: "Chen Tian Ji", city: "广州", district: "荔湾区", address: "宝华路十五甫三巷2号", latitude: 23.1180, longitude: 113.2450, award: "bib-gourmand" as const, cuisine: "广州小吃", priceRange: 1, phone: "+86 20 8188 3333", description: "老字号鱼皮和艇仔粥", rating: "4.3", reviewCount: 1234 },
  { name: "吴财记面家", nameEn: "Wu Cai Ji", city: "广州", district: "荔湾区", address: "大同路和隆里20号", latitude: 23.1178, longitude: 113.2440, award: "bib-gourmand" as const, cuisine: "广州小吃", priceRange: 1, description: "传统竹升面", rating: "4.3", reviewCount: 890 },
  { name: "南信牛奶甜品专家", nameEn: "Nan Xin", city: "广州", district: "荔湾区", address: "第十甫路47号", latitude: 23.1170, longitude: 113.2445, award: "bib-gourmand" as const, cuisine: "甜品", priceRange: 1, description: "传统双皮奶和姜撞奶", rating: "4.2", reviewCount: 1567 },
  { name: "达扬原味炖品", nameEn: "Da Yang", city: "广州", district: "越秀区", address: "文明路160号", latitude: 23.1256, longitude: 113.2700, award: "bib-gourmand" as const, cuisine: "炖品", priceRange: 1, description: "原盅炖汤", rating: "4.3", reviewCount: 678 },
  { name: "同记鸡粥粉面店", nameEn: "Tong Ji", city: "广州", district: "荔湾区", address: "长寿东路", latitude: 23.1200, longitude: 113.2480, award: "bib-gourmand" as const, cuisine: "广州小吃", priceRange: 1, description: "白切鸡和鸡粥", rating: "4.2", reviewCount: 456 },
  { name: "八珍煎饺", nameEn: "Ba Zhen", city: "广州", district: "越秀区", address: "北京路", latitude: 23.1250, longitude: 113.2680, award: "bib-gourmand" as const, cuisine: "广州小吃", priceRange: 1, description: "煎饺老字号", rating: "4.2", reviewCount: 534 },
  { name: "向群饭店", nameEn: "Xiang Qun", city: "广州", district: "荔湾区", address: "龙津东路", latitude: 23.1220, longitude: 113.2500, award: "bib-gourmand" as const, cuisine: "粤菜", priceRange: 1, description: "老牌粤菜小馆", rating: "4.3", reviewCount: 445 },
  { name: "新泰乐", nameEn: "Xin Tai Le", city: "广州", district: "越秀区", address: "江南大道中", latitude: 23.0980, longitude: 113.2750, award: "bib-gourmand" as const, cuisine: "粤菜", priceRange: 1, description: "煲仔饭专家", rating: "4.2", reviewCount: 378 },
  
  // 成都
  { name: "玉芝兰", nameEn: "Yu Zhi Lan", city: "成都", district: "锦江区", address: "长发街24号", latitude: 30.6600, longitude: 104.0780, award: "2-star" as const, cuisine: "川菜", priceRange: 4, phone: "+86 28 8612 8888", description: "兰桂均主理的川菜二星餐厅，以私房菜闻名", rating: "4.8", reviewCount: 234 },
  { name: "柴门荟", nameEn: "Chai Men Hui", city: "成都", district: "锦江区", address: "红星路三段", latitude: 30.6560, longitude: 104.0800, award: "1-star" as const, cuisine: "川菜", priceRange: 3, phone: "+86 28 8666 8888", description: "新派川菜，精致呈现", rating: "4.5", reviewCount: 189 },
  { name: "成都宴", nameEn: "Cheng Du Yan", city: "成都", district: "高新区", address: "天府大道北段", latitude: 30.5800, longitude: 104.0600, award: "1-star" as const, cuisine: "川菜", priceRange: 3, description: "现代川菜料理", rating: "4.5", reviewCount: 167 },
  { name: "芳香景", nameEn: "Fang Xiang Jing", city: "成都", district: "青羊区", address: "宽窄巷子", latitude: 30.6680, longitude: 104.0580, award: "1-star" as const, cuisine: "川菜", priceRange: 3, description: "藏在宽窄巷子里的精致川菜", rating: "4.5", reviewCount: 145 },
  { name: "眉州东坡", nameEn: "Meizhou Dongpo", city: "成都", district: "锦江区", address: "春熙路", latitude: 30.6565, longitude: 104.0785, award: "selected" as const, cuisine: "川菜", priceRange: 2, description: "知名川菜连锁品牌", rating: "4.3", reviewCount: 678 },
  { name: "陈麻婆豆腐（青华路）", nameEn: "Chen Ma Po", city: "成都", district: "青羊区", address: "青华路10号", latitude: 30.6700, longitude: 104.0450, award: "bib-gourmand" as const, cuisine: "川菜", priceRange: 1, description: "麻婆豆腐创始店", rating: "4.3", reviewCount: 1234 },
  { name: "老成都三样面", nameEn: "Lao Cheng Du", city: "成都", district: "青羊区", address: "西大街", latitude: 30.6720, longitude: 104.0560, award: "bib-gourmand" as const, cuisine: "成都小吃", priceRange: 1, description: "担担面和红油抄手", rating: "4.2", reviewCount: 567 },
  { name: "小龙翻大江", nameEn: "Xiao Long Fan Da Jiang", city: "成都", district: "锦江区", address: "春熙路南段", latitude: 30.6550, longitude: 104.0770, award: "bib-gourmand" as const, cuisine: "火锅", priceRange: 2, description: "高端火锅店", rating: "4.3", reviewCount: 890 },
  { name: "皇城坝小吃", nameEn: "Huang Cheng Ba", city: "成都", district: "青羊区", address: "人民公园", latitude: 30.6620, longitude: 104.0550, award: "bib-gourmand" as const, cuisine: "成都小吃", priceRange: 1, description: "成都传统小吃集合", rating: "4.2", reviewCount: 445 },
  
  // 杭州
  { name: "龙井草堂", nameEn: "Longjing Caotang", city: "杭州", district: "西湖区", address: "龙井路399号", latitude: 30.2180, longitude: 120.1180, award: "1-star" as const, cuisine: "杭帮菜", priceRange: 3, phone: "+86 571 8796 8888", description: "西湖边的杭帮菜名店", rating: "4.6", reviewCount: 234 },
  { name: "金沙厅", nameEn: "Jin Sha", city: "杭州", district: "西湖区", address: "西湖大道2号四季酒店", latitude: 30.2450, longitude: 120.1550, award: "1-star" as const, cuisine: "杭帮菜", priceRange: 4, phone: "+86 571 8888 8888", description: "四季酒店的中餐厅", rating: "4.7", reviewCount: 198 },
  { name: "紫薇厅", nameEn: "Zi Wei Ting", city: "杭州", district: "西湖区", address: "杨公堤18号西湖国宾馆", latitude: 30.2300, longitude: 120.1300, award: "1-star" as const, cuisine: "杭帮菜", priceRange: 4, phone: "+86 571 8797 9888", description: "西湖国宾馆的招牌餐厅", rating: "4.6", reviewCount: 167 },
  { name: "新新饭店1913餐厅", nameEn: "Xin Xin 1913", city: "杭州", district: "西湖区", address: "北山路58号", latitude: 30.2580, longitude: 120.1480, award: "bib-gourmand" as const, cuisine: "杭帮菜", priceRange: 2, description: "百年老饭店", rating: "4.3", reviewCount: 345 },
  { name: "奎元馆", nameEn: "Kui Yuan Guan", city: "杭州", district: "上城区", address: "解放路154号", latitude: 30.2500, longitude: 120.1650, award: "bib-gourmand" as const, cuisine: "杭帮菜", priceRange: 1, description: "虾爆鳝面老字号", rating: "4.3", reviewCount: 678 },
  { name: "楼外楼", nameEn: "Lou Wai Lou", city: "杭州", district: "西湖区", address: "孤山路30号", latitude: 30.2530, longitude: 120.1400, award: "bib-gourmand" as const, cuisine: "杭帮菜", priceRange: 2, description: "西湖醋鱼闻名", rating: "4.2", reviewCount: 1234 },
  { name: "知味观", nameEn: "Zhi Wei Guan", city: "杭州", district: "上城区", address: "仁和路83号", latitude: 30.2550, longitude: 120.1680, award: "bib-gourmand" as const, cuisine: "杭帮菜", priceRange: 1, description: "杭州老字号小吃", rating: "4.2", reviewCount: 890 },
  { name: "外婆家", nameEn: "Wai Po Jia", city: "杭州", district: "拱墅区", address: "武林广场", latitude: 30.2750, longitude: 120.1650, award: "selected" as const, cuisine: "杭帮菜", priceRange: 1, description: "杭帮菜连锁品牌", rating: "4.1", reviewCount: 1567 },
  { name: "弄堂里", nameEn: "Nong Tang Li", city: "杭州", district: "西湖区", address: "龙井路", latitude: 30.2200, longitude: 120.1200, award: "bib-gourmand" as const, cuisine: "杭帮菜", priceRange: 1, description: "弄堂风味杭帮菜", rating: "4.2", reviewCount: 456 },
  
  // 深圳
  { name: "Ensue", nameEn: "Ensue", city: "深圳", district: "福田区", address: "益田路4088号香格里拉大酒店40楼", latitude: 22.5380, longitude: 114.0550, award: "2-star" as const, cuisine: "创意菜", priceRange: 4, phone: "+86 755 2151 3838", description: "由名厨Christopher Kostow主理的现代料理", rating: "4.7", reviewCount: 234 },
  { name: "深圳君悦酒店1881", nameEn: "1881", city: "深圳", district: "罗湖区", address: "宝安南路1881号君悦酒店1楼", latitude: 22.5385, longitude: 114.1080, award: "1-star" as const, cuisine: "粤菜", priceRange: 3, description: "君悦酒店的粤菜中餐厅", rating: "4.5", reviewCount: 145 },
  { name: "嘉苑饭店", nameEn: "Jia Yuan", city: "深圳", district: "南山区", address: "深南大道9028号益田假日广场", latitude: 22.5360, longitude: 113.9750, award: "1-star" as const, cuisine: "潮州菜", priceRange: 3, description: "高端潮州菜", rating: "4.5", reviewCount: 123 },
  { name: "谭厨", nameEn: "Tan Chu", city: "深圳", district: "福田区", address: "福华路", latitude: 22.5420, longitude: 114.0580, award: "bib-gourmand" as const, cuisine: "中山菜", priceRange: 1, description: "中山脆肉鲩", rating: "4.3", reviewCount: 234 },
  { name: "凤凰楼", nameEn: "Feng Huang Lou", city: "深圳", district: "福田区", address: "华强北路", latitude: 22.5450, longitude: 114.0850, award: "bib-gourmand" as const, cuisine: "粤菜", priceRange: 2, description: "老牌粤菜酒楼", rating: "4.3", reviewCount: 345 },
  { name: "春满园", nameEn: "Chun Man Yuan", city: "深圳", district: "南山区", address: "南海大道", latitude: 22.5250, longitude: 113.9300, award: "bib-gourmand" as const, cuisine: "粤菜", priceRange: 2, description: "传统粤菜", rating: "4.2", reviewCount: 289 },
  { name: "新发茶餐厅", nameEn: "Xin Fa", city: "深圳", district: "罗湖区", address: "人民南路", latitude: 22.5330, longitude: 114.1150, award: "bib-gourmand" as const, cuisine: "茶餐厅", priceRange: 1, description: "港式茶餐厅", rating: "4.2", reviewCount: 567 },
  
  // 香港 - 3星
  { name: "龙景轩", nameEn: "Lung King Heen", city: "香港", district: "中环", address: "中环金融街8号四季酒店4楼", latitude: 22.2860, longitude: 114.1590, award: "3-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+852 3196 8888", description: "全球首家米其林三星中餐厅", rating: "4.9", reviewCount: 567 },
  { name: "8 Otto e Mezzo BOMBANA", nameEn: "8 Otto e Mezzo BOMBANA", city: "香港", district: "中环", address: "中环遮打道16-20号历山大厦2楼", latitude: 22.2820, longitude: 114.1580, award: "3-star" as const, cuisine: "意大利菜", priceRange: 4, phone: "+852 2537 8859", description: "Umberto Bombana的香港三星餐厅", rating: "4.8", reviewCount: 456 },
  { name: "Caprice", nameEn: "Caprice", city: "香港", district: "中环", address: "中环金融街8号四季酒店6楼", latitude: 22.2865, longitude: 114.1595, award: "3-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+852 3196 8860", description: "四季酒店的法国三星餐厅", rating: "4.8", reviewCount: 345 },
  { name: "富临饭店", nameEn: "Forum", city: "香港", district: "湾仔", address: "湾仔谢斐道", latitude: 22.2780, longitude: 114.1720, award: "3-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+852 2866 0282", description: "以鲍鱼闻名", rating: "4.8", reviewCount: 432 },
  { name: "L'Atelier de Joël Robuchon", nameEn: "L'Atelier de Joël Robuchon", city: "香港", district: "中环", address: "中环皇后大道中15号置地广场4楼", latitude: 22.2810, longitude: 114.1570, award: "3-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+852 2166 9000", description: "Robuchon在香港的旗舰餐厅", rating: "4.8", reviewCount: 389 },
  { name: "唐阁", nameEn: "T'ang Court", city: "香港", district: "尖沙咀", address: "尖沙咀北京道8号朗廷酒店", latitude: 22.2970, longitude: 114.1720, award: "3-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+852 2132 7898", description: "朗廷酒店的米其林三星中餐厅", rating: "4.7", reviewCount: 298 },
  { name: "Bo Innovation", nameEn: "Bo Innovation", city: "香港", district: "中环", address: "中环砵甸乍街45号", latitude: 22.2830, longitude: 114.1530, award: "3-star" as const, cuisine: "创意菜", priceRange: 4, phone: "+852 2850 8371", description: "Alvin Leung的分子料理餐厅", rating: "4.7", reviewCount: 267 },
  
  // 香港 - 2星
  { name: "Amber", nameEn: "Amber", city: "香港", district: "中环", address: "中环皇后大道中15号置地文华东方酒店7楼", latitude: 22.2815, longitude: 114.1575, award: "2-star" as const, cuisine: "法国菜", priceRange: 4, description: "现代法国料理", rating: "4.7", reviewCount: 234 },
  { name: "Ecriture", nameEn: "Ecriture", city: "香港", district: "中环", address: "中环皇后大道中80号H Queen's 26楼", latitude: 22.2825, longitude: 114.1550, award: "2-star" as const, cuisine: "法国菜", priceRange: 4, description: "现代法国料理", rating: "4.7", reviewCount: 189 },
  { name: "新同乐鱼翅酒家", nameEn: "Sun Tung Lok", city: "香港", district: "尖沙咀", address: "尖沙咀弥敦道20号", latitude: 22.2960, longitude: 114.1730, award: "2-star" as const, cuisine: "粤菜", priceRange: 4, description: "老牌鱼翅酒家", rating: "4.6", reviewCount: 312 },
  { name: "天龙轩", nameEn: "Tin Lung Heen", city: "香港", district: "九龙", address: "柯士甸道西1号丽思卡尔顿酒店102楼", latitude: 22.3030, longitude: 114.1600, award: "2-star" as const, cuisine: "粤菜", priceRange: 4, description: "丽思卡尔顿的中餐厅", rating: "4.7", reviewCount: 278 },
  { name: "Ovolo酒店Veda", nameEn: "VEDA", city: "香港", district: "中环", address: "中环亚毕诺道2号", latitude: 22.2800, longitude: 114.1530, award: "2-star" as const, cuisine: "素食", priceRange: 3, description: "高端素食餐厅", rating: "4.5", reviewCount: 156 },
  { name: "Arcane", nameEn: "Arcane", city: "香港", district: "中环", address: "中环安兰街18号3楼", latitude: 22.2810, longitude: 114.1520, award: "2-star" as const, cuisine: "欧洲菜", priceRange: 4, description: "现代欧洲料理", rating: "4.6", reviewCount: 145 },
  
  // 香港 - Bib Gourmand
  { name: "一乐烧鹅", nameEn: "Yat Lok", city: "香港", district: "中环", address: "中环士丹利街34-38号", latitude: 22.2820, longitude: 114.1550, award: "bib-gourmand" as const, cuisine: "烧味", priceRange: 1, description: "米其林必比登烧鹅", rating: "4.4", reviewCount: 890 },
  { name: "麦奵云吞面世家", nameEn: "Mak's Noodles", city: "香港", district: "中环", address: "中环威灵顿街77号", latitude: 22.2830, longitude: 114.1540, award: "bib-gourmand" as const, cuisine: "云吞面", priceRange: 1, description: "传统云吞面", rating: "4.3", reviewCount: 678 },
  { name: "九记牛腩", nameEn: "Kau Kee", city: "香港", district: "中环", address: "中环歌赋街21号", latitude: 22.2840, longitude: 114.1520, award: "bib-gourmand" as const, cuisine: "牛腩面", priceRange: 1, description: "清汤牛腩面", rating: "4.3", reviewCount: 756 },
  { name: "兰芳园", nameEn: "Lan Fong Yuen", city: "香港", district: "中环", address: "中环结志街2号", latitude: 22.2835, longitude: 114.1535, award: "bib-gourmand" as const, cuisine: "茶餐厅", priceRange: 1, description: "丝袜奶茶创始店", rating: "4.3", reviewCount: 534 },
  { name: "添好运（深水埗）", nameEn: "Tim Ho Wan", city: "香港", district: "深水埗", address: "深水埗福荣街9-11号", latitude: 22.3300, longitude: 114.1600, award: "bib-gourmand" as const, cuisine: "点心", priceRange: 1, description: "最平价的米其林星级点心", rating: "4.4", reviewCount: 1234 },
  { name: "甘牌烧鹅", nameEn: "Kam's Roast Goose", city: "香港", district: "湾仔", address: "湾仔轩尼诗道226号", latitude: 22.2785, longitude: 114.1770, award: "bib-gourmand" as const, cuisine: "烧味", priceRange: 1, description: "镛记后人开设的烧鹅店", rating: "4.4", reviewCount: 890 },
  { name: "再兴烧腊饭店", nameEn: "Joy Hing", city: "香港", district: "湾仔", address: "湾仔史钊域道1号", latitude: 22.2770, longitude: 114.1710, award: "bib-gourmand" as const, cuisine: "烧味", priceRange: 1, description: "烧腊老字号", rating: "4.3", reviewCount: 567 },
  
  // 澳门
  { name: " Robuchon au Dôme", nameEn: "Robuchon au Dome", city: "澳门", district: "澳门半岛", address: "澳门商业大马路251号新葡京酒店43楼", latitude: 22.1890, longitude: 113.5440, award: "3-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+853 8803 7878", description: "Joël Robuchon在澳门的旗舰餐厅", rating: "4.8", reviewCount: 345 },
  { name: "天巢法国餐厅", nameEn: "The Tasting Room", city: "澳门", district: "澳门半岛", address: "南湾大马路新葡京酒店39楼", latitude: 22.1885, longitude: 113.5445, award: "3-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+853 8803 7722", description: "新派法国料理", rating: "4.7", reviewCount: 267 },
  { name: "8餐厅", nameEn: "The Eight", city: "澳门", district: "澳门半岛", address: "葡京路2-4号新葡京酒店2楼", latitude: 22.1895, longitude: 113.5435, award: "3-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+853 8803 7788", description: "米其林三星中餐厅", rating: "4.8", reviewCount: 389 },
  { name: "誉珑轩", nameEn: "Jade Dragon", city: "澳门", district: "路氹", address: "路氹城大马路新濠天地2楼", latitude: 22.1600, longitude: 113.5550, award: "3-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+853 8868 2822", description: "新濠天地的招牌粤菜", rating: "4.8", reviewCount: 312 },
  { name: "永利宫", nameEn: "Wing Lei Palace", city: "澳门", district: "路氹", address: "路氹城体育馆大马路永利皇宫", latitude: 22.1580, longitude: 113.5500, award: "2-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+853 8889 3668", description: "永利皇宫的中餐厅", rating: "4.7", reviewCount: 234 },
  { name: "川江月", nameEn: "Sichuan Moon", city: "澳门", district: "路氹", address: "路氹城体育馆大马路永利皇宫", latitude: 22.1585, longitude: 113.5505, award: "2-star" as const, cuisine: "川菜", priceRange: 4, phone: "+853 8889 3668", description: "江振诚主理的川菜餐厅", rating: "4.7", reviewCount: 189 },
  { name: "紫逸轩", nameEn: "Zi Yixuan", city: "澳门", district: "路氹", address: "路氹城大马路四季酒店", latitude: 22.1595, longitude: 113.5560, award: "1-star" as const, cuisine: "粤菜", priceRange: 3, description: "四季酒店的中餐厅", rating: "4.6", reviewCount: 156 },
  { name: "陈光记", nameEn: "Chan Kun Kee", city: "澳门", district: "澳门半岛", address: "罗保博士街马路19号", latitude: 22.1900, longitude: 113.5450, award: "bib-gourmand" as const, cuisine: "烧味", priceRange: 1, description: "烧腊老字号", rating: "4.3", reviewCount: 445 },
  { name: "大利来记", nameEn: "Tai Lei Loi Kei", city: "澳门", district: "氹仔", address: "氹仔告利雅施利华街35号", latitude: 22.1530, longitude: 113.5580, award: "bib-gourmand" as const, cuisine: "澳门小吃", priceRange: 1, description: "猪扒包", rating: "4.3", reviewCount: 678 },
  { name: "诚昌饭店", nameEn: "Seng Cheong", city: "澳门", district: "氹仔", address: "氹仔官也街28-30号", latitude: 22.1525, longitude: 113.5590, award: "bib-gourmand" as const, cuisine: "澳门菜", priceRange: 1, description: "水蟹粥", rating: "4.3", reviewCount: 534 },
  { name: "莫义记", nameEn: "Mok Yi Kei", city: "澳门", district: "氹仔", address: "氹仔官也街9号A", latitude: 22.1535, longitude: 113.5585, award: "bib-gourmand" as const, cuisine: "甜品", priceRange: 1, description: "榴莲雪糕", rating: "4.2", reviewCount: 456 },
  { name: "梓记牛什", nameEn: "Chi Kei", city: "澳门", district: "澳门半岛", address: "营地街市市政综合大楼3楼", latitude: 22.1910, longitude: 113.5420, award: "bib-gourmand" as const, cuisine: "澳门小吃", priceRange: 1, description: "牛杂", rating: "4.3", reviewCount: 389 },
  
  // 台北
  { name: "颐宫中餐", nameEn: "Le Palais", city: "台北", district: "大同区", address: "承德路一段3号君品酒店17楼", latitude: 25.0490, longitude: 121.5170, award: "3-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+886 2 2181 9950", description: "台湾首家米其林三星中餐厅", rating: "4.8", reviewCount: 456 },
  { name: "祥云龙吟", nameEn: "Shoun RyuGin", city: "台北", district: "大安区", address: "敦化南路一段", latitude: 25.0400, longitude: 121.5480, award: "3-star" as const, cuisine: "日本菜", priceRange: 4, phone: "+886 2 8101 8678", description: "龙吟的台湾分店", rating: "4.7", reviewCount: 345 },
  { name: "RAW", nameEn: "RAW", city: "台北", district: "中山区", address: "乐群三路301号", latitude: 25.0830, longitude: 121.5550, award: "1-star" as const, cuisine: "创意菜", priceRange: 4, phone: "+886 2 8501 5800", description: "江振诚主理的台湾食材餐厅", rating: "4.7", reviewCount: 567 },
  { name: "教父牛排", nameEn: "Danny's Steakhouse", city: "台北", district: "大安区", address: "和平东路一段", latitude: 25.0330, longitude: 121.5360, award: "1-star" as const, cuisine: "牛排", priceRange: 4, phone: "+886 2 2325 1666", description: "台北顶级牛排馆", rating: "4.6", reviewCount: 345 },
  { name: "Logy", nameEn: "Logy", city: "台北", district: "大安区", address: "安和路一段", latitude: 25.0340, longitude: 121.5520, award: "1-star" as const, cuisine: "创意菜", priceRange: 4, description: "现代亚洲料理", rating: "4.6", reviewCount: 234 },
  { name: "金蓬莱遵古台菜", nameEn: "Kinpaira", city: "台北", district: "士林区", address: "天母东路", latitude: 25.1080, longitude: 121.5350, award: "1-star" as const, cuisine: "台湾菜", priceRange: 3, description: "传统台菜", rating: "4.5", reviewCount: 289 },
  { name: "阜杭豆浆", nameEn: "Fu Hang Soy Milk", city: "台北", district: "中正区", address: "忠孝东路一段108号2楼", latitude: 25.0440, longitude: 121.5250, award: "bib-gourmand" as const, cuisine: "早餐", priceRange: 1, description: "厚烧饼夹蛋和豆浆", rating: "4.4", reviewCount: 1234 },
  { name: "鼎泰丰（信义路）", nameEn: "Din Tai Fung", city: "台北", district: "大安区", address: "信义路二段194号", latitude: 25.0335, longitude: 121.5290, award: "bib-gourmand" as const, cuisine: "点心", priceRange: 1, description: "小笼包名店", rating: "4.4", reviewCount: 2345 },
  { name: "林东芳牛肉面", nameEn: "Lin Dong Fang", city: "台北", district: "中山区", address: "八德路二段", latitude: 25.0480, longitude: 121.5430, award: "bib-gourmand" as const, cuisine: "牛肉面", priceRange: 1, description: "红烧牛肉面", rating: "4.3", reviewCount: 890 },
  { name: "老山东牛肉面", nameEn: "Lao Shan Dong", city: "台北", district: "中正区", address: "开封街一段", latitude: 25.0460, longitude: 121.5100, award: "bib-gourmand" as const, cuisine: "牛肉面", priceRange: 1, description: "刀削牛肉面", rating: "4.3", reviewCount: 756 },
  { name: "永康牛肉面馆", nameEn: "Yong Kang Beef Noodles", city: "台北", district: "大安区", address: "金山南路二段31巷17号", latitude: 25.0310, longitude: 121.5270, award: "bib-gourmand" as const, cuisine: "牛肉面", priceRange: 1, description: "红烧和清炖牛肉面", rating: "4.3", reviewCount: 678 },
  { name: "小刘清汤瓜仔肉", nameEn: "Xiao Liu", city: "台北", district: "万华区", address: "华西街17之4号", latitude: 25.0350, longitude: 121.4990, award: "bib-gourmand" as const, cuisine: "台湾小吃", priceRange: 1, description: "瓜仔肉饭", rating: "4.2", reviewCount: 445 },
  { name: "阿男麻油鸡", nameEn: "A Nan Sesame Chicken", city: "台北", district: "中正区", address: "宁波西街", latitude: 25.0300, longitude: 121.5150, award: "bib-gourmand" as const, cuisine: "台湾小吃", priceRange: 1, description: "麻油鸡", rating: "4.2", reviewCount: 334 },
  
  // 成都 - 更多
  { name: "廊桥", nameEn: "The Bridge", city: "成都", district: "锦江区", address: "滨江东路66号", latitude: 30.6500, longitude: 104.0850, award: "1-star" as const, cuisine: "川菜", priceRange: 3, phone: "+86 28 8455 8888", description: "现代川菜，廊桥上的餐厅", rating: "4.5", reviewCount: 198 },
  { name: "马旺子", nameEn: "Ma Wang Zi", city: "成都", district: "锦江区", address: "红星路三段1号IFS", latitude: 30.6550, longitude: 104.0790, award: "1-star" as const, cuisine: "川菜", priceRange: 2, description: "百年川菜老字号", rating: "4.5", reviewCount: 345 },
  { name: "银锅", nameEn: "Silver Pot", city: "成都", district: "高新区", address: "交子大道", latitude: 30.5750, longitude: 104.0550, award: "1-star" as const, cuisine: "火锅", priceRange: 3, description: "高端火锅", rating: "4.4", reviewCount: 267 },
  { name: "臻选雲海肴", nameEn: "Yun Hai Yao", city: "成都", district: "锦江区", address: "太古里", latitude: 30.6540, longitude: 104.0780, award: "selected" as const, cuisine: "云南菜", priceRange: 2, description: "云南菜", rating: "4.3", reviewCount: 234 },
  
  // 杭州 - 更多
  { name: "兰轩村庄食坊", nameEn: "Lan Xuan", city: "杭州", district: "西湖区", address: "法云弄22号安缦法云", latitude: 30.2250, longitude: 120.1050, award: "1-star" as const, cuisine: "杭帮菜", priceRange: 3, description: "安缦法云的中餐厅", rating: "4.6", reviewCount: 123 },
  { name: "悦轩", nameEn: "Yue Xuan", city: "杭州", district: "上城区", address: "钱江路1366号柏悦酒店37楼", latitude: 30.2480, longitude: 120.2100, award: "1-star" as const, cuisine: "粤菜", priceRange: 4, description: "柏悦酒店的中餐厅", rating: "4.5", reviewCount: 156 },
  { name: "青岚", nameEn: "Qing Lan", city: "杭州", district: "西湖区", address: "南山路147号", latitude: 30.2450, longitude: 120.1500, award: "selected" as const, cuisine: "创意菜", priceRange: 3, description: "现代料理", rating: "4.4", reviewCount: 189 },
  { name: "里安", nameEn: "Li An", city: "杭州", district: "上城区", address: "钱江新城康莱德酒店", latitude: 30.2470, longitude: 120.2120, award: "1-star" as const, cuisine: "粤菜", priceRange: 4, description: "康莱德酒店的中餐厅", rating: "4.5", reviewCount: 134 },
];

async function seed() {
  const db = getDb();
  
  console.log("Seeding restaurants...");
  
  for (const restaurant of restaurantData) {
    await db.insert(restaurants).values(restaurant);
  }
  
  console.log(`Seeded ${restaurantData.length} restaurants`);
}

seed().catch(console.error);
