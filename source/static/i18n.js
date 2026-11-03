/* Four complete UI locales. Country selection uses only /api/locale server metadata.
   Feedback translations are explicitly labelled; named events are not translated. */
(function (host) {
  "use strict";
  const LOCALES = ["zh-TW", "zh-HK", "zh-CN", "en"];
  const valid = (v) =>
    LOCALES.find((l) => l.toLowerCase() === String(v || "").toLowerCase()) ||
    null;
  function browserLocale(languages = []) {
    for (const raw of languages) {
      const s = String(raw).toLowerCase();
      if (/^zh-(?:hant-)?(?:hk|mo)(-|$)/.test(s)) return "zh-HK";
      if (/^zh-(tw|hant)(-|$)/.test(s)) return "zh-TW";
      if (/^zh($|-)/.test(s)) return "zh-CN";
      if (/^en($|-)/.test(s)) return "en";
    }
    return null;
  }
  const COUNTRIES = new Set(
    "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
      " ",
    ),
  );
  function countryLocale(country) {
    const c = String(country || "").toUpperCase();
    if (!COUNTRIES.has(c)) return null;
    return c === "TW"
      ? "zh-TW"
      : c === "HK"
        ? "zh-HK"
        : c === "CN"
          ? "zh-CN"
          : "en";
  }
  function pathLocale(pathname) {
    const match = String(pathname || "").match(/^\/([^/]+)(?:\/|$)/);
    return match ? valid(match[1]) : null;
  }
  function localePathURL(href, locale) {
    const url = new URL(href);
    const chosen = valid(locale);
    if (!chosen) throw new TypeError("Unsupported locale");
    url.pathname = "/" + chosen + "/";
    url.searchParams.delete("lang");
    return url;
  }
  function resolveLocale({
    url = null,
    path = null,
    saved = null,
    country = null,
    languages = [],
  } = {}) {
    return (
      valid(url) ||
      pathLocale(path) ||
      valid(saved) ||
      countryLocale(country) ||
      browserLocale(languages) ||
      "zh-TW"
    );
  }
  function localeCookie(locale, secure = false) {
    const chosen = valid(locale);
    if (!chosen) throw new TypeError("Unsupported locale");
    return (
      "hackit-locale=" +
      chosen +
      "; Path=/; Max-Age=31536000; SameSite=Lax" +
      (secure ? "; Secure" : "")
    );
  }
  function readSaved(storage) {
    try {
      return valid(storage.getItem("hackit-locale"));
    } catch {
      return null;
    }
  }
  const D = {
    "zh-TW": {
      title: "HackIt — 讓想法發生",
      description: "HackIt — 由年輕 Builder 一起打造的創作與共創社群。",
      skip: "略過捲動動畫，閱讀內容",
      language: "語言",
      map: "HackIt 全球地圖",
      mapDetail: "HackIt 全球地圖，目前台灣有團隊",
      mapView: "地圖視角",
      asia: "東亞",
      world: "世界",
      panWorld: "左右滑動探索世界",
      panWorldLabel: "全球地圖；左右滑動或使用方向鍵探索",
      openTaiwan: "開啟 HackIt Taiwan 團隊資訊",
      closeTaiwan: "關閉台灣資訊",
      taiwan: "台灣",
      taiwanLabel: "Taiwan 台灣",
      goTaiwan: "前往台灣站 ↗",
      wallTitle: ["作品之外，", "還留下了這些。"],
      wallNote: "活動回饋節錄；照片為活動紀錄，非引言者身分對照。",
      photoHeading: ["不是想像。", "是一起做出來的。"],
      belief: "我們的使命",
      mission: ["讓年輕 Builder", "親手改變世界。"],
      missionLead:
        "HackIt 的使命，是讓年輕 Builder 在親手改變世界的過程中，成為勇於冒險、持續成長、並相信自己力量的未來設計者。",
      joinLabel: "加入 HackIt",
      joinTitle: ["下一個想法，", "一起實現。"],
      join: "加入我們",
      readingTitle: ["讓年輕 Builder", "親手改變世界。"],
      readingCopy:
        "HackIt 的使命，是讓年輕 Builder 在親手改變世界的過程中，成為勇於冒險、持續成長、並相信自己力量的未來設計者。",
      closeJoin: "關閉加入視窗",
      dialogLabel: "一起動手",
      dialogTitle: "找到你的社群。",
      dialogCopy: "前往地區官網，認識當地活動與加入方式。",
      contact: "聯絡我們",
      collaborate: "合作或其他想法",
      participant: "參與者回饋",
      daydreamParticipant: "Daydream Taiwan 參與者",
      excerpt: "原文節錄",
      eventRecord: "活動紀錄",
      quoteOpen: "「",
      quoteClose: "」",
      readStory: "閱讀這段故事",
      closeStory: "關閉故事",
      storyLabel: "參與者的故事",
      storySummaryLabel: "編輯摘要；可展開閱讀全文",
      missionSections: [
        "HackIt 的使命，是讓年輕 Builder 在親手改變世界的過程中，成為勇於冒險、持續成長、並相信自己力量的未來設計者。",
        "HackIt 讓年輕 Builder 親手改變世界——在冒險與創造中，學會相信自己能做到。",
        "我們是由年輕 Builder 為年輕 Builder 打造的行動社群，相信學習不該被關進教室。透過黑客松與遠征，我們讓年輕 Builder 從「我不行」走到「我真的能」，在真實世界裡動手創造、在夥伴之間互相點燃。因為當年輕 Builder 被信任，他們不只是參與者，而是未來的設計者。",
        "HackIt 的目標，是透過「冒險式創造」（Adventure-based Creation），讓 13‒23 歲的年輕 Builder 在真實世界中動手實踐，從被動的學習者轉變為主動的改變者。我們相信學習應該發生在挑戰、創造與冒險中。我們的行動由年輕 Builder 主導推動，讓他們在最具可塑性的年紀中，看見世界，也改變世界。",
        "我們不追求形式，而追求文化—— 動手實作、勇於冒險、跨出舒適圈，並讓每一次行動都留下具體的影響。我們的成功，不以活動數量衡量，而以每一個被點燃的靈魂、每一個重新相信自己的年輕 Builder 為指標。因為當他們學會主動創造、彼此啟發，他們不只是成長，他們正在重寫未來。",
        "改變世界，意味著擁有面對未知、勇於行動的勇氣；\n勇於冒險，代表持續跨出舒適圈、探索新可能的創新力；\n持續成長，則是讓每一次嘗試都能化為推進的執行力。",
        "而當這三種力量被協作與善用工具放大，年輕 Builder 不只是學習者\n——他們將成為真正能親手設計未來的設計者。",
        "未來的設計者 =（勇氣 × 創新力 × 執行力）^（協作 × 工具槓桿）",
        "——用勇氣啟動、以創新尋路、靠執行抵達，並讓社群協作與科技放大改變的力量。",
      ],
    },
    "zh-HK": {
      title: "HackIt — 將想法付諸實踐",
      description: "HackIt — 由年輕 Builder 一同建立的創作社群。",
      skip: "略過捲動動畫，直接閱讀",
      language: "語言",
      map: "HackIt 世界地圖",
      mapDetail: "HackIt 世界地圖，目前台灣設有團隊",
      mapView: "地圖視角",
      asia: "東亞",
      world: "世界",
      panWorld: "左右滑動探索世界",
      panWorldLabel: "全球地圖；左右滑動或使用方向鍵探索",
      openTaiwan: "查看 HackIt Taiwan 團隊資訊",
      closeTaiwan: "關閉台灣資訊",
      taiwan: "台灣",
      taiwanLabel: "Taiwan 台灣",
      goTaiwan: "瀏覽台灣網站 ↗",
      wallTitle: ["不只是作品，", "還有這些收穫。"],
      wallNote: "活動分享節錄；相片為活動紀錄，並非引述者的身分對照。",
      photoHeading: ["不只是想像。", "是一起做出來的。"],
      belief: "我們的使命",
      mission: ["讓年輕 Builder", "親手改變世界。"],
      missionLead:
        "HackIt 的使命，是讓年輕 Builder 在親手改變世界的過程中，成為勇於冒險、持續成長、並相信自己力量的未來設計者。",
      joinLabel: "加入 HackIt",
      joinTitle: ["下一個想法，", "一起實現。"],
      join: "加入我們",
      readingTitle: ["讓年輕 Builder", "親手改變世界。"],
      readingCopy:
        "HackIt 的使命，是讓年輕 Builder 在親手改變世界的過程中，成為勇於冒險、持續成長、並相信自己力量的未來設計者。",
      closeJoin: "關閉加入視窗",
      dialogLabel: "一起動手",
      dialogTitle: "找到你的社群。",
      dialogCopy: "瀏覽地區網站，了解當地活動及參加方法。",
      contact: "聯絡我們",
      collaborate: "合作或其他想法",
      participant: "參加者分享",
      daydreamParticipant: "Daydream Taiwan 參加者",
      excerpt: "原文節錄（保留台灣用語）",
      eventRecord: "活動相片",
      quoteOpen: "「",
      quoteClose: "」",
      readStory: "閱讀這段分享",
      closeStory: "關閉分享",
      storyLabel: "參加者的故事",
      storySummaryLabel: "編輯摘要；可展開閱讀全文",
      missionSections: [
        "HackIt 的使命，是讓年輕 Builder 在親手改變世界的過程中，成為勇於冒險、持續成長、並相信自己力量的未來設計者。",
        "HackIt 讓年輕 Builder 親手改變世界——在冒險與創造中，學會相信自己能做到。",
        "我們是由年輕 Builder 為年輕 Builder 打造的行動社群，相信學習不該被關進教室。透過黑客松與遠征，我們讓年輕 Builder 從「我不行」走到「我真的能」，在真實世界裡動手創造、在夥伴之間互相點燃。因為當年輕 Builder 被信任，他們不只是參與者，而是未來的設計者。",
        "HackIt 的目標，是透過「冒險式創造」（Adventure-based Creation），讓 13‒23 歲的年輕 Builder 在真實世界中動手實踐，從被動的學習者轉變為主動的改變者。我們相信學習應該發生在挑戰、創造與冒險中。我們的行動由年輕 Builder 主導推動，讓他們在最具可塑性的年紀中，看見世界，也改變世界。",
        "我們不追求形式，而追求文化—— 動手實作、勇於冒險、跨出舒適圈，並讓每一次行動都留下具體的影響。我們的成功，不以活動數量衡量，而以每一個被點燃的靈魂、每一個重新相信自己的年輕 Builder 為指標。因為當他們學會主動創造、彼此啟發，他們不只是成長，他們正在重寫未來。",
        "改變世界，意味著擁有面對未知、勇於行動的勇氣；\n勇於冒險，代表持續跨出舒適圈、探索新可能的創新力；\n持續成長，則是讓每一次嘗試都能化為推進的執行力。",
        "而當這三種力量被協作與善用工具放大，年輕 Builder 不只是學習者\n——他們將成為真正能親手設計未來的設計者。",
        "未來的設計者 =（勇氣 × 創新力 × 執行力）^（協作 × 工具槓桿）",
        "——用勇氣啟動、以創新尋路、靠執行抵達，並讓社群協作與科技放大改變的力量。",
      ],
    },
    "zh-CN": {
      title: "HackIt — 让想法成为现实",
      description: "HackIt — 由年轻 Builder 共同打造的创作社区。",
      skip: "跳过滚动动画，直接阅读",
      language: "语言",
      map: "HackIt 世界地图",
      mapDetail: "HackIt 世界地图，目前台湾设有团队",
      mapView: "地图视角",
      asia: "东亚",
      world: "世界",
      panWorld: "左右滑动探索世界",
      panWorldLabel: "全球地图；左右滑动或使用方向键探索",
      openTaiwan: "查看 HackIt Taiwan 团队信息",
      closeTaiwan: "关闭台湾信息",
      taiwan: "台湾",
      taiwanLabel: "Taiwan 台湾",
      goTaiwan: "访问台湾网站 ↗",
      wallTitle: ["不只是作品，", "还有这些收获。"],
      wallNote: "活动反馈节选；照片为活动记录，不代表引述者的身份。",
      photoHeading: ["不只是想象。", "是一起做出来的。"],
      belief: "我们的使命",
      mission: ["让年轻 Builder", "亲手改变世界。"],
      missionLead:
        "HackIt 的使命，是让年轻 Builder 在亲手改变世界的过程中，成为勇于冒险、持续成长、并相信自己力量的未来设计者。",
      joinLabel: "加入 HackIt",
      joinTitle: ["下一个想法，", "一起实现。"],
      join: "加入我们",
      readingTitle: ["让年轻 Builder", "亲手改变世界。"],
      readingCopy:
        "HackIt 的使命，是让年轻 Builder 在亲手改变世界的过程中，成为勇于冒险、持续成长、并相信自己力量的未来设计者。",
      closeJoin: "关闭加入窗口",
      dialogLabel: "一起动手",
      dialogTitle: "找到你的社区。",
      dialogCopy: "访问地区官网，了解当地活动和参与方式。",
      contact: "联系我们",
      collaborate: "合作或其他想法",
      participant: "参与者反馈",
      daydreamParticipant: "Daydream Taiwan 参与者",
      excerpt: "节选 · 简体转写",
      eventRecord: "活动记录",
      quoteOpen: "“",
      quoteClose: "”",
      readStory: "阅读这段故事",
      closeStory: "关闭故事",
      storyLabel: "参与者的故事",
      storySummaryLabel: "编辑摘要；可展开阅读全文",
      missionSections: [
        "HackIt 的使命，是让年轻 Builder 在亲手改变世界的过程中，成为勇于冒险、持续成长、并相信自己力量的未来设计者。",
        "HackIt 让年轻 Builder 亲手改变世界——在冒险与创造中，学会相信自己能做到。",
        "我们是由年轻 Builder 为年轻 Builder 打造的行动社区，相信学习不该被关进教室。通过黑客松与远征，我们让年轻 Builder 从“我不行”走到“我真的能”，在真实世界里动手创造、在伙伴之间互相点燃。因为当年轻 Builder 被信任，他们不只是参与者，而是未来的设计者。",
        "HackIt 的目标，是通过“冒险式创造”（Adventure-based Creation），让 13‒23 岁的年轻 Builder 在真实世界中动手实践，从被动的学习者转变为主动的改变者。我们相信学习应该发生在挑战、创造与冒险中。我们的行动由年轻 Builder 主导推动，让他们在最具可塑性的年纪中，看见世界，也改变世界。",
        "我们不追求形式，而追求文化——动手实践、勇于冒险、跨出舒适圈，并让每一次行动都留下具体的影响。我们的成功，不以活动数量衡量，而以每一个被点燃的灵魂、每一个重新相信自己的年轻 Builder 为指标。因为当他们学会主动创造、彼此启发，他们不只是成长，他们正在重写未来。",
        "改变世界，意味着拥有面对未知、勇于行动的勇气；\n勇于冒险，代表持续跨出舒适圈、探索新可能的创新力；\n持续成长，则是让每一次尝试都能化为推进的执行力。",
        "而当这三种力量被协作与善用工具放大，年轻 Builder 不只是学习者\n——他们将成为真正能亲手设计未来的设计者。",
        "未来的设计者 =（勇气 × 创新力 × 执行力）^（协作 × 工具杠杆）",
        "——用勇气启动、以创新寻路、靠执行抵达，并让社区协作与科技放大改变的力量。",
      ],
    },
    en: {
      title: "HackIt — Make ideas happen",
      description:
        "HackIt — a community of young Builders creating and building together.",
      skip: "Skip the scroll animation and read the content",
      language: "Language",
      map: "HackIt world map",
      mapDetail: "HackIt world map. Taiwan has an established team.",
      mapView: "Map view",
      asia: "East Asia",
      world: "World",
      panWorld: "Swipe to explore the world",
      panWorldLabel:
        "World map; swipe horizontally or use the arrow keys to explore",
      openTaiwan: "Open HackIt Taiwan team information",
      closeTaiwan: "Close Taiwan information",
      taiwan: "Taiwan",
      taiwanLabel: "Taiwan",
      goTaiwan: "Visit the Taiwan website ↗",
      wallTitle: ["More than projects.", "Stories that stay."],
      wallNote:
        "Reflections from the events. Photos do not identify the people quoted.",
      photoHeading: ["Not just imagined.", "Made together."],
      belief: "Our mission",
      mission: ["Empowering young Builders", "to change the world hands‑on."],
      missionLead:
        "HackIt’s mission is to help young Builders become designers of the future who dare to take risks, keep growing, and believe in their own power, through the hands-on process of changing the world.",
      joinLabel: "Join HackIt",
      joinTitle: ["Your next idea.", "Let’s make it real."],
      join: "Join us",
      readingTitle: [
        "Empowering young Builders",
        "to change the world hands‑on.",
      ],
      readingCopy:
        "HackIt’s mission is to help young Builders become designers of the future who dare to take risks, keep growing, and believe in their own power, through the hands-on process of changing the world.",
      closeJoin: "Close the join dialog",
      dialogLabel: "Build together",
      dialogTitle: "Find your community.",
      dialogCopy:
        "Visit a regional website to explore local events and ways to join.",
      contact: "Contact us",
      collaborate: "Collaborations or other ideas",
      participant: "Participant feedback",
      daydreamParticipant: "Daydream Taiwan participant",
      excerpt: "Translated excerpt",
      eventRecord: "Event photograph",
      quoteOpen: "“",
      quoteClose: "”",
      readStory: "Read this story",
      closeStory: "Close story",
      storyLabel: "A participant’s story",
      storySummaryLabel: "Editorial summary · Full reflection available",
      missionSections: [
        "HackIt’s mission is to help young Builders become designers of the future who dare to take risks, keep growing, and believe in their own power, through the hands-on process of changing the world.",
        "HackIt empowers young Builders to change the world hands-on—and, through adventure and creation, learn to believe they can do it.",
        "We are an action-oriented community built by young Builders, for young Builders. We believe learning should not be confined to the classroom. Through hackathons and expeditions, we help young Builders move from “I can’t” to “I really can”, creating in the real world and sparking inspiration in one another. When young Builders are trusted, they become more than participants: they become designers of the future.",
        "HackIt’s goal is to use “Adventure-based Creation” to enable young Builders aged 13–23 to put ideas into practice in the real world, moving from passive learners to active changemakers. We believe learning should happen through challenge, creation, and adventure. Our initiatives are led and driven by young Builders, enabling them to discover the world—and change it—during their most formative years.",
        "We pursue culture, not form: building hands-on, daring to take risks, stepping outside our comfort zones, and ensuring every action leaves a tangible impact. We measure success not by the number of events, but by every spirit inspired and every young Builder who learns to believe in themselves again. As they learn to create proactively and inspire one another, they are not just growing—they are rewriting the future.",
        "Changing the world means having the courage to face the unknown and act boldly;\nDaring to take risks means having the capacity to innovate by continually stepping outside our comfort zones and exploring new possibilities;\nContinual growth means having the ability to turn every attempt into forward momentum through execution.",
        "When these three strengths are amplified through collaboration and the effective use of tools, young Builders become more than learners\n—they become designers who can truly shape the future with their own hands.",
        "Designers of the future = (Courage × Innovation × Execution)^(Collaboration × Tool leverage)",
        "—Start with courage, find a path through innovation, reach the destination through execution, and let community collaboration and technology amplify the power to bring about change.",
      ],
    },
  };
  const QUOTES = {
    "zh-TW": [
      "我們一起挑戰了各自人生中的第一款遊戲。",
      "我更願意發言、更願意幫忙、更願意詢問。",
      "漸漸覺得能上台跟別人分享想法是一件很有趣的事情。",
      "看到作品真的能玩就很感動了TT",
      "這次雖然做得不算完美，不過這是一個很累但很值得的經驗",
      "我很喜歡大家一起討論，互相幫助的過程。",
      "在完成作品的空閒時間交到了一群志同道合的好朋友，一起唱歌一起追日出",
      "雖然最終沒有得名，但這不是重點，我們最終得到彼此！",
      "終於也是成功做出了自己的遊戲，雖然不是很完美，但對一開始的我們來說已經是天方夜譚。",
      "雖然我看起來是白忙一場，但經過這兩天的時間完全投入在一項軟體上，我發現我也默默學到很多功能跟流程。",
      "當我在晚上和工作人員許願想吃pocky時，沒想到他們真的買回來了，讓我超級開心又感動的～",
      "後來有人提出要改變方向，不用像寫小說那樣詳細，環環相扣，只要寫出簡單劇情，能完成就好，果然我們找到節奏，後面問題迎刃而解，也更有默契，耿了解彼此溝通方式。",
      "半夜裡，我們三個人就這樣一邊查資料、一邊互相討論怎麼 Debug，最後終於趕在期限內把遊戲做出來。這次經驗讓我們發現，雖然開發 3D 遊戲比想像中困難很多，但透過團隊合作解決技術問題的過程，確實讓我們學到了不少實作上的經驗。",
      "在這場活動中，我從幾乎零基礎，到和隊友合作完成一個能運行的遊戲，只花了兩天的時間，在製作的過程中，當然也遇到了許多問題，我們也從中學習了解決問題的方法",
      "在籌備期間我意外的很融入大家，他們也從來不會因為我資訊類能力爛的跟泥土一樣就看不起我，取而代之的是超包容的心態和超友善的氛圍，跟我一開始想像的完全不一樣阿家人們！",
      "雖然 AI 沒能直接生出完整的遊戲，但它幫我們產出了最初的 **3D 模型**。這成為了我們「成為巨人」的第一步，也開啟了後續精彩的「酷酷手搓時間」。",
    ],
    "zh-HK": [
      "我們一起挑戰製作各自人生中的第一款遊戲。",
      "我更願意發言、更願意幫忙，也更願意開口問問題。",
      "漸漸覺得上台跟大家分享想法，其實是一件很有趣的事。",
      "看到作品真的可以玩，就已經很感動了 TT",
      "這次雖然做得不算完美，但這是一段很累、卻很值得的經歷。",
      "我很喜歡大家一起討論、互相幫忙的過程。",
      "完成作品後，在空閒時間認識了一群志同道合的好朋友，一起唱歌、一起看日出。",
      "雖然最後沒有得獎，但這不是重點，我們最後收穫了彼此！",
      "最後終於做出了自己的遊戲。雖然不算完美，但對一開始的我們來說，這根本難以想像。",
      "雖然看起來像白忙了一場，但這兩天全心投入使用一套軟件後，我發現自己其實學會了不少功能和流程。",
      "晚上我跟工作人員說想吃 Pocky，沒想到他們真的買回來了，令我又開心又感動～",
      "後來有人提議改變方向，不用像寫小說般詳細、環環相扣，只要寫出簡單劇情，能完成就好。結果我們真的找到節奏，之後的問題迎刃而解，也更有默契，更了解彼此的溝通方式。",
      "半夜裏，我們三個人一邊查資料，一邊討論怎樣除錯，最後終於趕在限期前做出遊戲。這次讓我們發現，開發 3D 遊戲比想像中困難得多，但透過團隊合作解決技術問題，確實學到了不少實作經驗。",
      "在這場活動中，我從幾乎零基礎，到跟隊友合作完成一個能運作的遊戲，只用了兩天。製作過程中當然也遇到很多問題，我們亦從中學會了解決問題的方法。",
      "籌備期間，我意外地很快就融入大家。他們從來沒有因為我的資訊科技能力很差而看不起我，反而非常包容，氣氛也很友善，跟我最初想像的完全不同！",
      "雖然 AI 未能直接生成完整遊戲，但它幫我們做出了最初的 3D 模型。這成了我們「成為巨人」的第一步，也讓我們開始了之後精彩的親手製作過程。",
    ],
    "zh-CN": [
      "我们一起挑战制作各自人生中的第一款游戏。",
      "我更愿意发言、更愿意帮忙，也更愿意开口提问。",
      "渐渐觉得上台和大家分享想法，其实是一件很有趣的事。",
      "看到作品真的能玩，就已经很感动了 TT",
      "这次虽然做得不算完美，但这是一段很累、却很值得的经历。",
      "我很喜欢大家一起讨论、互相帮助的过程。",
      "完成作品后，在空闲时间认识了一群志同道合的好朋友，一起唱歌、一起看日出。",
      "虽然最后没有获奖，但这不是重点，我们最终收获了彼此！",
      "最后终于做出了自己的游戏。虽然不算完美，但对一开始的我们来说，这根本难以想象。",
      "虽然看起来像白忙了一场，但这两天全心投入使用一款软件后，我发现自己其实学会了不少功能和流程。",
      "晚上我跟工作人员说想吃 Pocky，没想到他们真的买回来了，让我又开心又感动～",
      "后来有人提议改变方向，不用像写小说那样详细、环环相扣，只要写出简单剧情，能完成就好。结果我们真的找到了节奏，后面的问题迎刃而解，也更有默契，更了解彼此的沟通方式。",
      "半夜里，我们三个人一边查资料，一边讨论怎么调试，最后终于赶在截止时间前做出了游戏。这次让我们发现，开发 3D 游戏比想象中困难得多，但通过团队合作解决技术问题，确实学到了不少实践经验。",
      "在这场活动中，我从几乎零基础，到和队友合作完成一个能运行的游戏，只用了两天。制作过程中当然也遇到了很多问题，我们也从中学会了解决问题的方法。",
      "筹备期间，我意外地很快就融入了大家。他们从来没有因为我的信息技术能力很差而看不起我，反而非常包容，氛围也很友善，跟我最初想象的完全不同！",
      "虽然 AI 没能直接生成完整游戏，但它帮我们做出了最初的 3D 模型。这成了我们“成为巨人”的第一步，也开启了后面精彩的亲手制作过程。",
    ],
    en: [
      "Together, we took on making our very first games.",
      "I became more willing to speak up, help out, and ask questions.",
      "I gradually found that getting on stage to share my ideas was actually fun.",
      "Seeing that our game was actually playable was so moving. TT",
      "It wasn’t perfect, but it was an exhausting and worthwhile experience.",
      "I really enjoyed discussing ideas and helping each other along the way.",
      "After finishing our project, I made a group of like-minded friends. We sang together and watched the sunrise.",
      "We didn’t win a prize, but that wasn’t the point. We found each other!",
      "We finally made our own game. It wasn’t perfect, but at the start we could barely have imagined getting this far.",
      "It may have looked like wasted effort, but after two days immersed in one piece of software, I realised how many features and workflows I had learned.",
      "One evening, I told the staff I wished we had Pocky. I never expected them to actually bring some back—it made me so happy and touched!",
      "Then someone suggested changing direction: the story didn’t need to be as detailed and tightly woven as a novel. A simple story we could finish would do. We found our rhythm, worked through the problems, and grew more in sync as we learned how each other communicated.",
      "In the middle of the night, the three of us looked things up and talked through how to debug, finally finishing our game before the deadline. Making a 3D game was much harder than we expected, but solving technical problems together taught us a lot through hands-on experience.",
      "At this event, I went from almost no experience to making a working game with my teammates in just two days. We ran into plenty of problems along the way, and learned how to solve them.",
      "During preparations, I was surprised by how well I fit in. No one looked down on me for being terrible with tech. Instead, they were incredibly welcoming and friendly—completely different from what I had imagined!",
      "AI couldn’t generate a complete game for us, but it helped create our first 3D models. That was our first step towards “becoming giants”—and the start of the fun, hands-on building that followed.",
    ],
  };
  const QUOTE_CREDITS = {
    "zh-TW": [
      "Daydream Taiwan 參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
      "Scrapyard 籌備團隊回饋 · 原文節錄",
      "參與者回饋 · 原文節錄",
    ],
    "zh-HK": [
      "Daydream Taiwan 參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
      "Scrapyard 籌備團隊分享 · 原文節錄・香港用語調整",
      "參加者分享 · 原文節錄・香港用語調整",
    ],
    "zh-CN": [
      "Daydream Taiwan 参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
      "Scrapyard 筹备团队分享 · 原文节选・简体中文本地化",
      "参与者分享 · 原文节选・简体中文本地化",
    ],
    en: [
      "Daydream Taiwan Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
      "Scrapyard Organizer reflection · Translated excerpt",
      "Participant reflection · Translated excerpt",
    ],
  };
  // Photo-specific alt descriptions are populated below; event titles remain proper names.
  const PHOTO_ALTS = {
    "zh-TW": [
      "夥伴一起使用筆電創作",
      "活動現場合照",
      "使用筆電創作的現場",
      "小組在桌邊交流",
      "兩位夥伴並肩使用筆電創作",
      "使用筆電創作的現場",
      "夥伴在活動現場相聚",
      "活動中的分享",
      "滿場一起創作的現場",
      "教室裡的共創現場",
      "筆電上正在製作的遊戲",
      "夥伴與作品前的合照",
      "螢幕上的遊戲開發程式碼",
      "舞台上的分享",
      "活動中與夥伴相聚",
      "專注製作作品的現場",
      "活動中的交流片刻",
      "夥伴圍坐在地板上交流",
      "圍著筆電交流與展示作品",
      "活動期間一起迎接日出",
      "創作桌邊的交流片刻",
      "使用筆電專注開發的夥伴",
      "活動中的輕鬆互動",
      "活動期間的夜景",
      "一起研究筆電上的作品",
      "活動現場裡的交流與笑容",
      "活動結束時一起揮手合照",
      "創作桌邊開懷交流的夥伴",
      "大夥一起參與工作坊的現場",
      "夥伴圍著筆電一起研究問題",
      "創作之餘一起玩桌遊",
      "在筆記本上構思與繪製想法",
      "一起迎接的日出與城市風景",
      "活動中輕鬆開懷的片刻",
      "創作桌邊抬頭交流的夥伴",
      "圍著筆電交流與展示作品",
      "忙碌創作之間一起分享餐點",
      "筆電上的程式碼與專注開發",
      "充滿創作與交流的活動現場",
      "夥伴在共同空間裡一起創作",
      "並肩使用筆電討論的夥伴",
      "創作桌邊分享想法的時刻",
    ],
    "zh-HK": [
      "夥伴一起使用手提電腦創作",
      "活動大合照",
      "使用手提電腦創作的現場",
      "小組圍桌交流",
      "兩位夥伴並肩使用手提電腦創作",
      "使用手提電腦創作的現場",
      "夥伴在活動現場相聚",
      "活動中的分享",
      "大家一起投入創作的現場",
      "課室裏的共同創作現場",
      "手提電腦上正在製作的遊戲",
      "夥伴與作品合照",
      "螢幕上的遊戲開發程式碼",
      "台上的分享",
      "活動中與夥伴相聚",
      "專注製作作品的現場",
      "活動中的交流片刻",
      "夥伴圍坐在地板上交流",
      "圍着手提電腦交流與展示作品",
      "活動期間一起迎接日出",
      "創作桌旁的交流片刻",
      "使用手提電腦專注開發的夥伴",
      "活動中的輕鬆互動",
      "活動期間的夜景",
      "一起研究手提電腦上的作品",
      "活動現場的交流與笑容",
      "活動結束時一起揮手合照",
      "創作桌旁開懷交流的夥伴",
      "大家一起參與工作坊的現場",
      "夥伴圍着手提電腦一起研究問題",
      "創作之餘一起玩桌上遊戲",
      "在記事簿上構思與畫出想法",
      "一起迎接的日出與城市風景",
      "活動中輕鬆開懷的片刻",
      "創作桌旁抬頭交流的夥伴",
      "圍着手提電腦交流與展示作品",
      "忙碌創作之間一起分享食物",
      "手提電腦上的程式碼與專注開發",
      "充滿創作與交流的活動現場",
      "夥伴在共用空間裏一起創作",
      "並肩使用手提電腦討論的夥伴",
      "創作桌旁分享想法的時刻",
    ],
    "zh-CN": [
      "伙伴一起使用笔记本电脑创作",
      "活动现场合照",
      "使用笔记本电脑创作的现场",
      "小组在桌边交流",
      "两位伙伴并肩使用笔记本电脑创作",
      "使用笔记本电脑创作的现场",
      "伙伴在活动现场相聚",
      "活动中的分享",
      "大家一起投入创作的现场",
      "教室里的共同创作现场",
      "笔记本电脑上正在制作的游戏",
      "伙伴与作品合照",
      "屏幕上的游戏开发代码",
      "舞台上的分享",
      "活动中与伙伴相聚",
      "专注制作作品的现场",
      "活动中的交流片刻",
      "伙伴围坐在地板上交流",
      "围着笔记本电脑交流和展示作品",
      "活动期间一起迎接日出",
      "创作桌边的交流片刻",
      "使用笔记本电脑专注开发的伙伴",
      "活动中的轻松互动",
      "活动期间的夜景",
      "一起研究笔记本电脑上的作品",
      "活动现场的交流与笑容",
      "活动结束时一起挥手合照",
      "创作桌边开怀交流的伙伴",
      "大家一起参与工作坊的现场",
      "伙伴围着笔记本电脑一起研究问题",
      "创作之余一起玩桌游",
      "在笔记本上构思和画出想法",
      "一起迎接的日出与城市风景",
      "活动中轻松开怀的片刻",
      "创作桌边抬头交流的伙伴",
      "围着笔记本电脑交流和展示作品",
      "忙碌创作之间一起分享餐点",
      "笔记本电脑上的代码与专注开发",
      "充满创作与交流的活动现场",
      "伙伴在共享空间里一起创作",
      "并肩使用笔记本电脑讨论的伙伴",
      "创作桌边分享想法的时刻",
    ],
    en: [
      "Participants creating together on laptops",
      "Group photograph at the event",
      "Creating with a laptop at the event",
      "A group talking around a table",
      "Two participants working side by side on laptops",
      "Creating with a laptop at the event",
      "Participants gathering at the event",
      "A presentation during the event",
      "A room full of people creating together",
      "Collaborative work in a classroom",
      "A game in development on a laptop",
      "Participants posing with their work",
      "Game development code on a screen",
      "A presentation on stage",
      "Spending time with fellow participants",
      "Focused work on a project",
      "A conversation during the event",
      "Participants sitting together on the floor",
      "Sharing and showing projects around a laptop",
      "Watching the sunrise during the event",
      "A conversation beside a work table",
      "A participant focused on development using a laptop",
      "A light-hearted moment at the event",
      "A night-time view during the event",
      "Examining a project together on a laptop",
      "Conversations and smiles at the event",
      "Waving together for a group photo at the end of the event",
      "Participants chatting happily beside a work table",
      "Participants taking part in a workshop together",
      "Gathering around a laptop to work through a problem",
      "Playing board games between creative sessions",
      "Sketching and developing ideas in a notebook",
      "Watching the sunrise over the city together",
      "A relaxed, cheerful moment during the event",
      "Participants looking up to talk beside a work table",
      "Sharing and showing projects around a laptop",
      "Sharing a meal between busy creative sessions",
      "Code on a laptop during focused development",
      "An event space full of creativity and conversation",
      "Participants creating together in a shared space",
      "Participants discussing their work side by side with laptops",
      "Sharing ideas beside a work table",
    ],
  };
  const STORIES = {
    "zh-TW": [
      {
        title: "卡住之後，一起找到節奏",
        summary: "劇情討論到午夜還沒定案。改變方向，讓團隊找到可以完成的版本。",
        text: "活動第一天我們經歷了劇本卡住，因為我們一開始太想把劇本寫得合理且符合邏輯，有推理感，後來到瞭晚上12點劇情都沒討論好，我們很怕做不完，後來有人提出要改變方向，不用像寫小說那樣詳細，環環相扣，只要寫出簡單劇情，能完成就好，果然我們找到節奏，後面問題迎刃而解，也更有默契，耿了解彼此溝通方式。",
        credit: "參與者回饋",
        renderingLabel: "全文原文",
        isVerbatim: true,
        titleAndSummaryAreEditorial: true,
      },
      {
        title: "讓模型動起來的那一刻",
        summary:
          "第一次參加黑客松，挑戰 3D 遊戲。從接連出現的 Bug，到一起查資料、討論解法。",
        text: "這是我們三人第一次參加黑客松。雖然平常有在寫程式，但從來沒有開發過遊戲，這次卻直接挑戰難度較高的 3D遊戲。這兩天我們幾乎沒怎麼睡覺，一直待在電腦前寫程式碼。\n​雖然過程很累，但當我們看到自己寫出來的程式，成功讓3D模型在螢幕上動起來的那一刻，那種疲憊感就消失了。開發過程中其實並不順利，每一行程式碼都考驗著我們的能力，Bug也接二連三出現，甚至好幾次差點讓整個遊戲跑不動。\n​半夜裡，我們三個人就這樣一邊查資料、一邊互相討論怎麼 Debug，最後終於趕在期限內把遊戲做出來。這次經驗讓我們發現，雖然開發 3D 遊戲比想像中困難很多，但透過團隊合作解決技術問題的過程，確實讓我們學到了不少實作上的經驗。",
        credit: "參與者回饋",
        renderingLabel: "全文原文",
        isVerbatim: true,
        titleAndSummaryAreEditorial: true,
      },
      {
        title: "從大夢想，做到能完成的版本",
        summary:
          "第一次用 Ren’Py：縮小故事、分工合作，也看見一款遊戲背後的努力。",
        text: "這次第一次自己用 Ren’Py 做遊戲，真的覺得很新鮮，也很有成就感。一開始我想做一個劇情超完整、角色很多、還有不同結局的大型遊戲，夢想真的開很大。但實際開始做之後才發現，寫劇情就要花很多時間，還要一直debug，有時候一個小地方打錯就整個跑不動。第一天晚上才體會到「時間有限」這件事，只好修改成簡單版的，也知道原來做遊戲沒有想像中那麼簡單。\n在過程中，我也深深體驗到團隊合作的重要性。一人負責寫劇情、一人負責美術、一人負責程式，會比一個人硬撐還有效率。而且大家可以互相討論、給意見，遇到問題也比較不會那麼挫折。這次雖然做得不算完美，不過這是一個很累但很值得的經驗，讓我更了解做遊戲背後的努力。",
        credit: "參與者回饋",
        renderingLabel: "全文原文",
        isVerbatim: true,
        titleAndSummaryAreEditorial: true,
      },
    ],
    "zh-HK": [
      {
        title: "卡關之後，一起找到節奏",
        summary: "討論到午夜，劇情仍未定案。改變方向，讓團隊找到能完成的版本。",
        text: "活動第一天，我們在劇本上卡住了。起初太想把劇本寫得合理、有邏輯，又有推理感，結果到了晚上十二時，劇情還未討論好，大家都很怕做不完。後來有人提議改變方向，不用像寫小說般詳細、環環相扣，只要寫出簡單劇情，能完成就好。結果我們真的找到節奏，之後的問題迎刃而解，也更有默契，更了解彼此的溝通方式。",
        credit: "參加者分享",
        renderingLabel: "原文全文・香港用語調整",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
      {
        title: "讓模型動起來的那一刻",
        summary:
          "第一次參加黑客松，挑戰 3D 遊戲。從接連出現的錯誤，到一起查資料、討論解法。",
        text: "這是我們三個人第一次參加黑客松。雖然平時有寫程式，但從來沒有開發過遊戲，這次卻直接挑戰難度較高的 3D 遊戲。這兩天我們幾乎沒怎樣睡，一直坐在電腦前寫程式碼。\n\n過程雖然很累，但看到自己寫的程式成功讓 3D 模型在螢幕上動起來的一刻，那種疲倦感就消失了。開發過程其實並不順利，每一行程式碼都考驗着我們，錯誤接連出現，甚至有幾次差點令整個遊戲無法運行。\n\n半夜裏，我們三個人一邊查資料，一邊討論怎樣除錯，最後終於趕在限期前做出遊戲。這次讓我們發現，開發 3D 遊戲比想像中困難得多，但透過團隊合作解決技術問題，確實學到了不少實作經驗。",
        credit: "參加者分享",
        renderingLabel: "原文全文・香港用語調整",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
      {
        title: "從大夢想，做到能完成的版本",
        summary:
          "第一次用 Ren’Py：縮小故事規模、分工合作，也看見一款遊戲背後的努力。",
        text: "這次第一次自己用 Ren’Py 做遊戲，真的覺得很新鮮，也很有成功感。一開始，我想做一個劇情很完整、角色很多，還有不同結局的大型遊戲，夢想真的很大。但真正開始後才發現，寫劇情要花很多時間，還要不斷除錯，有時一個小地方打錯，整個遊戲就跑不動。第一晚才真正體會到時間有限，只好改成簡單版，也明白了做遊戲沒有想像中容易。\n\n過程中，我也深深體會到團隊合作的重要。一人寫劇情、一人做美術、一人寫程式，比一個人硬撐更有效率。大家可以互相討論、給意見，遇到問題也不會那麼挫敗。這次雖然做得不算完美，但這是一段很累、卻很值得的經歷，讓我更了解做遊戲背後的努力。",
        credit: "參加者分享",
        renderingLabel: "原文全文・香港用語調整",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
    ],
    "zh-CN": [
      {
        title: "卡住之后，一起找到节奏",
        summary:
          "讨论到午夜，剧情还没定下来。改变方向，让团队找到能完成的版本。",
        text: "活动第一天，我们在剧本上卡住了。起初太想把剧本写得合理、有逻辑，又有推理感，结果到了晚上十二点，剧情还没讨论好，大家都很怕做不完。后来有人提议改变方向，不用像写小说那样详细、环环相扣，只要写出简单剧情，能完成就好。结果我们真的找到了节奏，后面的问题迎刃而解，也更有默契，更了解彼此的沟通方式。",
        credit: "参与者分享",
        renderingLabel: "原文全文・简体中文本地化",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
      {
        title: "让模型动起来的那一刻",
        summary:
          "第一次参加黑客松，挑战 3D 游戏。从接连出现的 Bug，到一起查资料、讨论解法。",
        text: "这是我们三个人第一次参加黑客松。虽然平时有写代码，但从来没有开发过游戏，这次却直接挑战难度较高的 3D 游戏。这两天我们几乎没怎么睡，一直坐在电脑前写代码。\n\n过程虽然很累，但看到自己写的程序成功让 3D 模型在屏幕上动起来的那一刻，那种疲惫感就消失了。开发过程其实并不顺利，每一行代码都考验着我们，Bug 接连出现，甚至有几次差点让整个游戏无法运行。\n\n半夜里，我们三个人一边查资料，一边讨论怎么调试，最后终于赶在截止时间前做出了游戏。这次让我们发现，开发 3D 游戏比想象中困难得多，但通过团队合作解决技术问题，确实学到了不少实践经验。",
        credit: "参与者分享",
        renderingLabel: "原文全文・简体中文本地化",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
      {
        title: "从大梦想，做到能完成的版本",
        summary:
          "第一次用 Ren’Py：缩小故事规模、分工合作，也看见一款游戏背后的努力。",
        text: "这次第一次自己用 Ren’Py 做游戏，真的觉得很新鲜，也很有成就感。一开始，我想做一个剧情很完整、角色很多，还有不同结局的大型游戏，梦想真的很大。但真正开始后才发现，写剧情要花很多时间，还要不断调试，有时一个小地方打错，整个游戏就跑不起来。第一天晚上才真正体会到时间有限，只好改成简单版，也明白了做游戏没有想象中容易。\n\n过程中，我也深深体会到团队合作的重要性。一人写剧情、一人做美术、一人写代码，比一个人硬撑更有效率。大家可以互相讨论、给意见，遇到问题也不会那么挫败。这次虽然做得不算完美，但这是一段很累、却很值得的经历，让我更了解做游戏背后的努力。",
        credit: "参与者分享",
        renderingLabel: "原文全文・简体中文本地化",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
    ],
    en: [
      {
        title: "Finding our rhythm, together",
        summary:
          "At midnight, the story still wasn’t settled. Changing direction helped the team find a version they could finish.",
        text: "On the first day, we got stuck on the script. We wanted the story to be logical, convincing, and full of mystery. By midnight, we still hadn’t settled on it, and we were afraid we wouldn’t finish. Then someone suggested a different direction: it didn’t need to be as detailed and tightly woven as a novel. A simple story we could finish would do. We found our rhythm, worked through the problems, and grew more in sync as we learned how each other communicated.",
        credit: "Participant reflection",
        renderingLabel: "Translated full reflection",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
      {
        title: "The moment the model moved",
        summary:
          "Their first hackathon, and a 3D game: recurring bugs led to researching and working through solutions together.",
        text: "This was the first hackathon for all three of us. We coded regularly, but had never developed a game. This time, we went straight for the harder challenge of a 3D game. Over those two days, we barely slept and spent our time at our computers writing code.\n\nIt was exhausting, but when we saw our code make a 3D model move on screen, the tiredness disappeared. Development wasn’t smooth: every line tested us, bugs kept appearing, and several times the whole game almost stopped working.\n\nIn the middle of the night, the three of us looked things up and talked through how to debug, finally finishing our game before the deadline. Making a 3D game was much harder than we expected, but solving technical problems together taught us a lot through hands-on experience.",
        credit: "Participant reflection",
        renderingLabel: "Translated full reflection",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
      {
        title: "From a big idea to a finishable game",
        summary:
          "A first attempt with Ren’Py meant scaling back the story, sharing the work, and seeing the effort behind a game.",
        text: "This was my first time making a game myself with Ren’Py. It felt new and genuinely rewarding. At first, I wanted a big game with a complete story, lots of characters, and different endings. I was dreaming big. Once I started, though, I realised how long writing the story took. There was constant debugging, and sometimes one small typo stopped everything from running. On the first evening, I really felt how limited our time was. I had to make a simpler version, and learned that making games wasn’t as easy as I had imagined.\n\nI also came to appreciate teamwork. Having one person write the story, another make the art, and another code was more efficient than struggling alone. We could discuss things and give each other feedback, which made problems less discouraging. It wasn’t perfect, but it was an exhausting and worthwhile experience that helped me understand the effort behind making a game.",
        credit: "Participant reflection",
        renderingLabel: "Translated full reflection",
        isVerbatim: false,
        titleAndSummaryAreEditorial: true,
      },
    ],
  };
  const displayExcerpt = (value) =>
    String(value).replace(/\*\*([^*]+)\*\*/g, "$1");
  // Editorial navigation labels, separate from the unchanged white-paper text.
  const MISSION_HEADINGS = {
    "zh-TW": {
      2: "由年輕 Builder 主導",
      3: "冒險式創造",
      4: "文化，不只是數量",
      5: "三種力量",
      7: "讓協作放大力量",
    },
    "zh-HK": {
      2: "由年輕 Builder 主導",
      3: "冒險式創造",
      4: "文化，不只是數量",
      5: "三種力量",
      7: "讓協作放大力量",
    },
    "zh-CN": {
      2: "由年轻 Builder 主导",
      3: "冒险式创造",
      4: "文化，不只是数量",
      5: "三种力量",
      7: "让协作放大力量",
    },
    en: {
      2: "Led by young Builders",
      3: "Adventure-based creation",
      4: "Culture, not counts",
      5: "Three strengths",
      7: "Amplified by collaboration",
    },
  };
  function missionBlocks(locale) {
    const d = D[valid(locale) || "zh-TW"],
      headings = MISSION_HEADINGS[valid(locale) || "zh-TW"],
      kinds = [
        "lead",
        "manifesto",
        "body",
        "body",
        "body",
        "forces",
        "conclusion",
        "equation",
        "final",
      ];
    return d.missionSections.flatMap((value, index) => {
      const blocks = [];
      if (headings[index])
        blocks.push({
          tag: "h3",
          className: "mission-section-title",
          text: headings[index],
          editorial: true,
        });
      blocks.push({
        tag: "p",
        className: "mission-paragraph mission-" + kinds[index],
        text: value,
        sectionIndex: index,
      });
      return blocks;
    });
  }
  function renderMissionBlock(document, block) {
    const node = document.createElement(block.tag);
    node.className = block.className;
    if (block.sectionIndex === 5) {
      block.text.split("\n").forEach((line, index) => {
        if (index) node.append(document.createTextNode("\n"));
        const row = document.createElement("span");
        row.className = "force-row";
        row.textContent = line;
        node.append(row);
      });
    } else if (block.sectionIndex === 7 && block.text.includes("^")) {
      const split = block.text.indexOf("^");
      node.append(document.createTextNode(block.text.slice(0, split)));
      const marker = document.createElement("span");
      marker.className = "formula-power-marker";
      marker.textContent = "^";
      const exponent = document.createElement("sup");
      exponent.className = "formula-exponent";
      exponent.textContent = block.text.slice(split + 1);
      node.append(marker, exponent);
    } else node.textContent = block.text;
    if (block.editorial) node.dataset.editorial = "true";
    return node;
  }
  function localizedStructuredData(graph, locale, canonical) {
    const selected = valid(locale) || "zh-TW",
      d = D[selected];
    const result = JSON.parse(JSON.stringify(graph));
    for (const node of result["@graph"] || []) {
      if (node["@type"] === "WebPage")
        Object.assign(node, {
          "@id": canonical + "#webpage",
          url: canonical,
          name: d.title,
          description: d.description,
          inLanguage: selected,
        });
      if (node["@type"] === "Organization") node.description = d.description;
    }
    return result;
  }
  const API = {
    localizedStructuredData,
    renderMissionBlock,
    MISSION_HEADINGS,
    missionBlocks,
    STORIES,
    displayExcerpt,
    LOCALES,
    D,
    QUOTES,
    QUOTE_CREDITS,
    PHOTO_ALTS,
    valid,
    pathLocale,
    localePathURL,
    localeCookie,
    browserLocale,
    countryLocale,
    resolveLocale,
    readSaved,
  };
  if (typeof module === "object" && module.exports) module.exports = API;
  if (!host.document) return;
  const doc = host.document;
  // Keep configured public metadata stable when viewed on a preview hostname.
  const canonicalOrigin = (() => {
    try {
      const initial = new URL(
        doc.querySelector('link[rel="canonical"]')?.href || host.location.href,
      );
      if (initial.protocol === "https:" || initial.protocol === "http:")
        return initial.origin;
    } catch {}
    return host.location.origin;
  })();
  let selected = "zh-TW",
    manualRevision = 0,
    activeStoryIndex = null;
  const query = () => new URL(host.location.href).searchParams.get("lang");
  function each(sel, fn) {
    doc.querySelectorAll(sel).forEach(fn);
  }
  function text(sel, value) {
    each(sel, (e) => {
      e.textContent = value;
    });
  }
  function attr(sel, name, value) {
    each(sel, (e) => e.setAttribute(name, value));
  }
  function lines(sel, values, spanSecond = false) {
    each(sel, (e) => {
      e.replaceChildren();
      values.forEach((v, i) => {
        if (i) e.append(doc.createElement("br"));
        if (i && spanSecond) {
          const s = doc.createElement("span");
          s.textContent = v;
          e.append(s);
        } else e.append(doc.createTextNode(v));
      });
    });
  }
  function wallTitle(values) {
    each(".wall-header h2", (e) => {
      e.replaceChildren(
        ...values.flatMap((v, index) => {
          const s = doc.createElement("span");
          s.textContent = v;
          return selected === "en" && index
            ? [doc.createTextNode(" "), s]
            : [s];
        }),
      );
    });
  }
  function renderStory(index) {
    const item = STORIES[selected]?.[index];
    if (!item) return false;
    activeStoryIndex = index;
    text("#story-dialog-title", item.title);
    text("#story-dialog-body", item.text);
    text("#story-dialog-credit", item.credit + " · " + item.renderingLabel);
    attr("#story-dialog", "lang", selected);
    return true;
  }
  function renderMission(container, locale) {
    container.replaceChildren(
      ...missionBlocks(locale).map((block) => renderMissionBlock(doc, block)),
    );
  }
  function apply(locale) {
    host.dispatchEvent(new Event("hackit:beforecontentchange"));
    selected = valid(locale) || "zh-TW";
    const d = D[selected];
    doc.documentElement.lang = selected;
    doc.documentElement.dataset.locale = selected;
    doc.title = d.title;
    attr('meta[name="description"]', "content", d.description);
    const canonical = new URL("/" + selected + "/", canonicalOrigin).href;
    attr("link[rel=canonical]", "href", canonical);
    attr('meta[property="og:url"]', "content", canonical);
    attr(
      'meta[property="og:title"],meta[name="twitter:title"]',
      "content",
      d.title,
    );
    attr(
      'meta[property="og:description"],meta[name="twitter:description"]',
      "content",
      d.description,
    );
    attr(
      'meta[property="og:locale"]',
      "content",
      { "zh-TW": "zh_TW", "zh-HK": "zh_HK", "zh-CN": "zh_CN", en: "en_US" }[
        selected
      ],
    );
    attr("#skip-story", "href", "/" + selected + "/#overview");
    each('script[type="application/ld+json"]', (e) => {
      try {
        e.textContent = JSON.stringify(
          localizedStructuredData(
            JSON.parse(e.textContent),
            selected,
            canonical,
          ),
        ).replace(/</g, "\\u003c");
      } catch {}
    });
    text("#skip-story", d.skip);
    attr(".map-scene", "aria-label", d.map);
    attr(".map-stage svg", "aria-label", d.mapDetail);
    attr(".reading-map", "alt", d.mapDetail);
    attr(".map-controls", "aria-label", d.mapView);
    text(".map-pan-hint", d.panWorld);
    attr(".map-viewport", "aria-label", d.panWorldLabel);
    text('[data-view="asia"]', d.asia);
    text('[data-view="world"]', d.world);
    attr(".map-activation", "aria-label", d.openTaiwan);
    attr(".panel-close", "aria-label", d.closeTaiwan);
    text(".taiwan-label text", d.taiwanLabel);
    text(".country-name span", selected === "en" ? "" : d.taiwan);
    text(".country-panel a", d.goTaiwan.replace(" ↗", ""));
    text(".reading-region a", d.taiwanLabel);
    wallTitle(d.wallTitle);
    text(".wall-header p", d.wallNote);
    lines(".photo-heading", d.photoHeading);
    text(".mission-scene .small-label", d.belief);
    lines("#mission-title", d.mission, true);
    each("div.mission-body", (e) => renderMission(e, selected));
    text(".join-scene .small-label", d.joinLabel);
    lines("#join-title", d.joinTitle);
    each(".join-open", (e) => {
      e.replaceChildren(doc.createTextNode(d.join + " "));
      const s = doc.createElement("span");
      s.setAttribute("aria-hidden", "true");
      s.className = "corner-arrow";
      e.append(s);
    });
    lines(".reading-view>h2", d.readingTitle);
    text(".reading-view>p:not(.reading-region)", d.readingCopy);
    attr("#join-dialog .dialog-close", "aria-label", d.closeJoin);
    text("#join-dialog .small-label", d.dialogLabel);
    text("#join-dialog-title", d.dialogTitle);
    text("#join-dialog>p:not(.small-label)", d.dialogCopy);
    text(".region-link small", selected === "en" ? "" : d.taiwan);
    text(".dialog-contact>span", d.collaborate);
    text('.no-js-links a[href="https://hackit.tw"]', d.goTaiwan);
    text('.no-js-links a[href^="mailto:"]', d.contact);
    each(".wall-quote", (e) => {
      const i = Number(e.dataset.quoteIndex);
      if (!Number.isInteger(i)) return;
      const q = QUOTES[selected]?.[i];
      if (q !== undefined) {
        e.querySelector("blockquote").textContent =
          d.quoteOpen + displayExcerpt(q) + d.quoteClose;
        e.querySelector("blockquote").lang = selected;
      }
      e.querySelector("figcaption").textContent =
        QUOTE_CREDITS[selected][i] || d.participant;
    });
    each(".wall-photo", (e) => {
      const i = Number(e.dataset.photoIndex),
        img = e.querySelector("img"),
        event = e.querySelector("figcaption").textContent;
      const description = PHOTO_ALTS[selected]?.[i];
      if (img) img.alt = event + " — " + (description || d.eventRecord);
    });
    each(".ssr-story-full[data-ssr-story-index]", (e) => {
      const item = STORIES[selected]?.[Number(e.dataset.ssrStoryIndex)];
      if (!item) return;
      const summary = doc.createElement("summary");
      summary.textContent = item.title;
      const credit = doc.createElement("p");
      credit.textContent = item.credit + " · " + item.renderingLabel;
      const paragraphs = item.text.split("\n\n").map((value) => {
        const p = doc.createElement("p");
        p.textContent = value;
        return p;
      });
      e.replaceChildren(summary, credit, ...paragraphs);
      e.lang = selected;
    });
    each(".story-read-more", (e) => {
      const index = Number(e.dataset.storyIndex),
        item = STORIES[selected]?.[index];
      e.textContent = d.readStory;
      if (item) e.setAttribute("aria-label", d.readStory + " — " + item.title);
    });
    attr(".story-dialog-close", "aria-label", d.closeStory);
    text("#story-dialog .small-label", d.storyLabel);
    each("[data-story-title-index]", (e) => {
      const item = STORIES[selected]?.[Number(e.dataset.storyTitleIndex)];
      if (item) e.textContent = item.title;
    });
    each("[data-story-preview-index]", (e) => {
      const item = STORIES[selected]?.[Number(e.dataset.storyPreviewIndex)];
      if (item) e.textContent = item.summary;
    });
    each("[data-story-credit-index]", (e) => {
      const item = STORIES[selected]?.[Number(e.dataset.storyCreditIndex)];
      if (item) e.textContent = item.credit + " · " + d.storySummaryLabel;
    });
    if (activeStoryIndex !== null) renderStory(activeStoryIndex);
    select.value = selected;
    select.setAttribute("aria-label", d.language);
    label.textContent = d.language;
    host.dispatchEvent(
      new CustomEvent("hackit:localechange", { detail: { locale: selected } }),
    );
    host.dispatchEvent(new Event("resize"));
  }
  const control = doc.createElement("label");
  control.className = "locale-control";
  const label = doc.createElement("span");
  label.className = "locale-label";
  const select = doc.createElement("select");
  select.id = "site-language";
  for (const [value, name] of [
    ["zh-TW", "繁體中文（台灣）"],
    ["zh-HK", "繁體中文（香港）"],
    ["zh-CN", "简体中文"],
    ["en", "English"],
  ]) {
    const o = doc.createElement("option");
    o.value = value;
    o.textContent = name;
    select.append(o);
  }
  control.append(label, select);
  doc.body.append(control);
  function placeLanguageControl() {
    const animated =
      doc.documentElement.classList.contains("animated") &&
      !doc.documentElement.classList.contains("reading-mode");
    const target = animated
      ? doc.querySelector(".map-scene")
      : doc.querySelector("main") || doc.body;
    if (target && control.parentElement !== target) target.append(control);
  }
  host.HackItI18n = Object.freeze({ renderStory, placeLanguageControl });
  placeLanguageControl();
  select.addEventListener("change", () => {
    manualRevision++;
    const locale = valid(select.value) || "zh-TW";
    try {
      host.localStorage.setItem("hackit-locale", locale);
    } catch {}
    try {
      doc.cookie = localeCookie(locale, host.location.protocol === "https:");
    } catch {}
    try {
      const u = localePathURL(host.location.href, locale);
      host.history.replaceState(host.history.state, "", u);
    } catch {}
    apply(locale);
  });
  let saved = null;
  try {
    saved = readSaved(host.localStorage);
  } catch {}
  if (saved) {
    try {
      doc.cookie = localeCookie(saved, host.location.protocol === "https:");
    } catch {}
  }
  const explicit = valid(query()),
    path = host.location.pathname,
    pathExplicit = pathLocale(path),
    languages = host.navigator.languages || [host.navigator.language];
  apply(resolveLocale({ url: explicit, path, saved, languages }));
  if (!explicit && !pathExplicit && !saved) {
    const revision = manualRevision,
      controller = new AbortController(),
      timer = host.setTimeout(() => controller.abort(), 900);
    host
      .fetch("/api/locale", {
        signal: controller.signal,
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (manualRevision === revision && data)
          apply(resolveLocale({ country: data.country, languages }));
      })
      .catch(() => {})
      .finally(() => host.clearTimeout(timer));
  }
})(typeof window !== "undefined" ? window : globalThis);
