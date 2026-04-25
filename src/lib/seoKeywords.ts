/**
 * SEO Optimization Utilities - Từ Khóa Phim Ngắn Việt Nam
 * Tập trung: phim ngắn, phim ngắn trung quốc, xem phim ngắn, phim ngắn hay, phim ngắn tổng tài
 */

export const SEO_KEYWORDS = {
  primary: {
    "phim-ngan": {
      title: "Phim Ngắn - Xem Phim Ngắn Hay Nhất Miễn Phí Tại Việt Nam",
      description:
        "Xem phim ngắn hay nhất tại Vibe Drama. Phim ngắn trung quốc, hàn quốc, thái lan. Cập nhật liên tục, chất lượng HD, hoàn toàn miễn phí.",
      keywords: [
        "phim ngắn",
        "xem phim ngắn",
        "phim ngắn hay",
        "phim ngắn hay nhất",
        "phim ngắn miễn phí",
      ],
    },
    "phim-ngan-trung-quoc": {
      title: "Phim Ngắn Trung Quốc - Xem Phim Trung Quốc Hay 2026",
      description:
        "Phim ngắn trung quốc hay nhất - Xem phim trung quốc chất lượng HD, cập nhật liên tục, phim ngắn trung quốc hot 2026 tại Vibe Drama.",
      keywords: [
        "phim ngắn trung quốc",
        "phim trung quốc hay",
        "phim ngắn trung quốc hay",
        "phim trung quốc hay nhất",
      ],
    },
    "xem-phim-ngan": {
      title: "Xem Phim Ngắn Online - Phim Ngắn Hay Miễn Phí",
      description:
        "Xem phim ngắn online miễn phí tại Vibe Drama. Phim ngắn hay từ trung quốc, hàn quốc, thái lan. Cập nhật liên tục, chất lượng HD.",
      keywords: [
        "xem phim ngắn",
        "xem phim ngắn online",
        "xem phim ngắn miễn phí",
        "xem phim online",
      ],
    },
    "phim-ngan-hay": {
      title: "Phim Ngắn Hay - Top Phim Ngắn Hot 2026",
      description:
        "Phim ngắn hay nhất 2026 - Tuyển tập phim ngắn chất lượng cao, diễn viên nổi tiếng, kịch tính hấp dẫn. Cập nhật hằng ngày tại Vibe Drama.",
      keywords: [
        "phim ngắn hay",
        "phim ngắn hay nhất",
        "phim ngắn hot",
        "phim ngắn 2026",
      ],
    },
    "phim-ngan-tong-tai": {
      title: "Phim Ngắn Tổng Tài - Xem Phim Tài Phiệt Trung Quốc Hay",
      description:
        "Phim ngắn tổng tài - Xem phim tổng tài, phim tài phiệt trung quốc hay nhất. Câu chuyện về những nhà tài phiệt, tổng giám đốc quyền lực giàu có. Cập nhật tại Vibe Drama.",
      keywords: [
        "phim ngắn tổng tài",
        "phim tài phiệt",
        "phim tổng tài",
        "phim tài phiệt trung quốc",
        "phim tổng tài hay",
      ],
    },
  },
  faqSchema: {
    "phim-ngan-la-gi": {
      question: "Phim ngắn là gì?",
      answer:
        "Phim ngắn là những bộ phim có thời lượng ngắn, thường từ 15 phút đến 30 phút mỗi tập, với nội dung kịch tính, hấp dẫn. Phim ngắn phổ biến ở Trung Quốc, Hàn Quốc, Thái Lan và rất được yêu thích tại Việt Nam. Đây là định dạng phim lý tưởng để xem vào lúc rảnh rỗi.",
    },
    "phim-tong-tai-la-gi": {
      question: "Phim tổng tài là gì?",
      answer:
        "Phim tổng tài là thể loại phim tập trung vào cuộc sống của những nhân vật quyền lực, giàu có, thường là những tổng giám đốc, chủ tịch công ty. Phim thường xoay quanh tình yêu, quyền lực và thương trường. Đây là thể loại phim rất được yêu thích tại Việt Nam.",
    },
    "phim-ngan-trung-quoc-hay-nhat": {
      question:
        "Phim ngắn trung quốc hay nhất là gì? Gợi ý một số phim ngắn trung quốc hot",
      answer:
        "Có rất nhiều phim ngắn trung quốc hay nhất như những bộ phim tổng tài, phim tình cảm, phim hành động. Bạn có thể tìm kiếm phim ngắn trung quốc hay nhất trên Vibe Drama, được cập nhật hằng ngày với các bộ phim mới nhất.",
    },
    "xem-phim-ngan-o-dau": {
      question: "Xem phim ngắn ở đâu miễn phí?",
      answer:
        "Bạn có thể xem phim ngắn miễn phí tại Vibe Drama. Chúng tôi cung cấp hàng trăm bộ phim ngắn từ các quốc gia khác nhau, chất lượng HD, cập nhật liên tục, hoàn toàn miễn phí.",
    },
  },
};

/**
 * Generate FAQ Schema for SEO
 * Use in your pages for Rich Results
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Breadcrumb Schema for Tag Pages - Vietnam-focused
 */
export function generateBreadcrumbSchema(
  tagName: string,
  tagSlug: string,
  baseUrl: string = "https://vibedramas.com",
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Danh mục",
        item: `${baseUrl}/tags`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tagName,
        item: `${baseUrl}/tag/${tagSlug}`,
      },
    ],
  };
}

/**
 * Internal Links Strategy - Add to navigation/home page
 */
export const INTERNAL_LINKS = [
  { href: "/tag/tong-tai", text: "Phim Ngắn Tổng Tài" },
  { href: "/tag/trung-quoc", text: "Phim Ngắn Trung Quốc Hay" },
  { href: "/tag/han-quoc", text: "Phim Ngắn Hàn Quốc" },
  { href: "/tag/thai-lan", text: "Phim Ngắn Thái Lan" },
  { href: "/all", text: "Xem Phim Ngắn" },
  { href: "/search", text: "Tìm Phim Ngắn" },
];

/**
 * Cấu trúc H1/H2 được khuyến cáo cho các trang
 *
 * H1: "Xem Phim Ngắn [Quốc gia] Hay Nhất - [Thể loại]"
 * H2: "Phim Ngắn [Quốc gia] 2026"
 * H2: "Tại Sao Phim Ngắn [Quốc gia] Lại Được Yêu Thích Tại Việt Nam?"
 * H2: "Danh Sách Phim Ngắn [Thể loại] Hot Nhất Hiện Nay"
 * H3: Tên phim từng bộ
 */
export const HEADING_TEMPLATES = {
  h1: (category: string) =>
    `Xem Phim Ngắn ${category} Hay Nhất 2026 | Vibe Drama`,
  h2Section1: (category: string) => `Phim Ngắn ${category} Hot 2026`,
  h2Section2: () => `Tại Sao Nên Xem Phim Ngắn Tại Vibe Drama Việt Nam?`,
  h2Section3: (category: string) =>
    `Danh Sách Phim Ngắn ${category} Được Yêu Thích Nhất Hiện Nay`,
};

/**
 * Mẫu mô tả Meta cho các trang khác nhau
 */
export const META_DESCRIPTIONS = {
  home: "Xem phim ngắn trung quốc, xem phim ngắn hay 2026. Phim ngắn tổng tài, phim hàn, phim thái. Chất lượng HD miễn phí tại Vibe Drama.",
  tongtai:
    "Phim ngắn tổng tài - Xem phim tài phiệt trung quốc hay nhất. Những câu chuyện về nhà tài phiệt, tổng giám đốc quyền lực giàu có. Cập nhật liên tục tại Vibe Drama.",
  trungquoc:
    "Phim ngắn trung quốc hay nhất - Xem phim trung quốc chất lượng HD. Cập nhật liên tục, phim ngắn trung quốc hot 2026 tại Vibe Drama.",
  hanquoc:
    "Phim ngắn hàn quốc hay - Xem phim hàn quốc 2026. Phim bộ hàn hot, phim ngắn hàn lý tưởng, tình cảm tại Vibe Drama.",
  thailand:
    "Phim ngắn thái lan hay - Xem phim thái lan 2026. Phim bộ thái hay, phim ngắn thái lý tưởng tại Vibe Drama.",
};
