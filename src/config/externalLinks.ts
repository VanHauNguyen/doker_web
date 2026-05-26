export interface ExternalLink {
  label: string
  href: string
}

export const externalLinks = {
  shopee: {
    label: '官方蝦皮商城',
    href: 'https://shopee.tw/doker2018',
  },
  line: {
    label: 'LINE 官方',
    href: 'https://line.me/R/ti/p/@hsc5602h',
  },
  youtube: {
    label: 'YouTube',
    href: 'https://www.youtube.com/@doker2018',
  },
  facebook: {
    label: 'Facebook',
    href: 'https://www.facebook.com/doker2018',
  },
  supportPhone: {
    label: '客服電話',
    href: 'tel:0800300018',
    text: '0800-300-018',
  },
  map: {
    label: '地圖導航',
    href: 'https://maps.app.goo.gl/xHHAESHvXrCZSRsU9',
  },
} as const

export const footerLinks: ExternalLink[] = [
  externalLinks.shopee,
  externalLinks.line,
  externalLinks.youtube,
  externalLinks.facebook,
  { label: '客服資訊', href: externalLinks.supportPhone.href },
]
