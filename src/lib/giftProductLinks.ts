const RAW_GIFT_PRODUCT_LINKS = `
https://s.shopee.vn/1123eTibxZ https://s.shopee.vn/19WSdmPzT https://s.shopee.vn/1BLTqmhyca https://s.shopee.vn/1Leu35hLHr
https://s.shopee.vn/1VyKFOghws https://s.shopee.vn/1gHkRhg4bt https://s.shopee.vn/1qbAe0fRGu https://s.shopee.vn/20uaqJenvv
https://s.shopee.vn/2BE12ceAaw https://s.shopee.vn/2LXREvdXFx https://s.shopee.vn/2VqrREctuy https://s.shopee.vn/2gAHdXcGZj
https://s.shopee.vn/2gAHdXcGak https://s.shopee.vn/2qThpqbdEk https://s.shopee.vn/2qThpqbdFn https://s.shopee.vn/30n829aztl
https://s.shopee.vn/30n829azum https://s.shopee.vn/3B6YESaMYm https://s.shopee.vn/3B6YESaMZp https://s.shopee.vn/3LPyQlZjDn
https://s.shopee.vn/3LPyQlZjEo https://s.shopee.vn/3VjOd4Z5so https://s.shopee.vn/3VjOd4Z5tr https://s.shopee.vn/3g2opNYSXp
https://s.shopee.vn/3g2opNYSYq https://s.shopee.vn/3qMF1gXpCq https://s.shopee.vn/3qMF1gXpDt https://s.shopee.vn/40ffDzXBs7
https://s.shopee.vn/4Az5QIWYX8 https://s.shopee.vn/4LIVcbVvC9 https://s.shopee.vn/4LIVcbVvDA https://s.shopee.vn/4VbvouVHrA
https://s.shopee.vn/4fvM1DUeWB https://s.shopee.vn/4fvM1DUeXC https://s.shopee.vn/4qEmDWU1BC https://s.shopee.vn/4qEmDWU1CF
https://s.shopee.vn/50YCPpTNqD https://s.shopee.vn/50YCPpTNrE https://s.shopee.vn/5Arcc8SkVE https://s.shopee.vn/5Arcc8SkWH
https://s.shopee.vn/5LB2oRS79z https://s.shopee.vn/5LB2oRS7B0 https://s.shopee.vn/5VUT0kRTp0 https://s.shopee.vn/5VUT0kRTq3
https://s.shopee.vn/5fntD3QqU1 https://s.shopee.vn/5fntD3QqV2 https://s.shopee.vn/5q7JPMQD92 https://s.shopee.vn/5q7JPMQDA5
https://s.shopee.vn/60QjbfPZo3 https://s.shopee.vn/60QjbfPZp4 https://s.shopee.vn/6Ak9nyOwT4 https://s.shopee.vn/6Ak9nyOwU7
https://s.shopee.vn/6L3a0HOJ85 https://s.shopee.vn/6L3a0HOJ96 https://s.shopee.vn/6VN0CaNfn6 https://s.shopee.vn/6VN0CaNfo9
https://s.shopee.vn/6fgQOtN2SN https://s.shopee.vn/6fgQOtN2TO https://s.shopee.vn/6pzqbCMP7O https://s.shopee.vn/6pzqbCMP8R
https://s.shopee.vn/70JGnVLlmP https://s.shopee.vn/70JGnVLlnQ https://s.shopee.vn/7AcgzoL8RQ https://s.shopee.vn/7AcgzoL8ST
https://s.shopee.vn/7Kw7C7KV6R https://s.shopee.vn/7Kw7C7KV7S https://s.shopee.vn/7VFXOQJrlS https://s.shopee.vn/7VFXOQJrmV
https://s.shopee.vn/7fYxajJEQT https://s.shopee.vn/7fYxajJERU https://s.shopee.vn/7psNn2Ib5U https://s.shopee.vn/7psNn2Ib6X
https://s.shopee.vn/80BnzLHxlG https://s.shopee.vn/8AVEBeHKQJ https://s.shopee.vn/8KoeNxGh5I https://s.shopee.vn/8V84aGG3kL
https://s.shopee.vn/8fRUmZFQPK https://s.shopee.vn/8pkuysEn4N https://s.shopee.vn/904LBBE9jM https://s.shopee.vn/9ANlNUDWOP
https://s.shopee.vn/9KhBZnCt2d https://s.shopee.vn/9KhBZnCt3e https://s.shopee.vn/9V0bm6CFhe https://s.shopee.vn/9V0bm6CFih
https://s.shopee.vn/9fK1yPBcMf https://s.shopee.vn/9fK1yPBcNg https://s.shopee.vn/9pdSAiAz1g https://s.shopee.vn/9pdSAiAz2j
https://s.shopee.vn/9zwsN1ALgh https://s.shopee.vn/9zwsN1ALhi https://s.shopee.vn/AAGIZK9iLi https://s.shopee.vn/AAGIZK9iMl
https://s.shopee.vn/AKZild950j https://s.shopee.vn/AKZild951k https://s.shopee.vn/AUt8xw8Rgn https://s.shopee.vn/BSwewlmeU
https://s.shopee.vn/LmMrFl9JV https://s.shopee.vn/W5n3YkVyW https://s.shopee.vn/gPDFrjsdX https://s.shopee.vn/qidSAjFIY
`;

export const GIFT_PRODUCT_LINKS = Object.freeze(
  RAW_GIFT_PRODUCT_LINKS.trim().split(/\s+/),
);

export function getRandomGiftProductLink(): string | null {
  if (!GIFT_PRODUCT_LINKS.length) return null;
  return GIFT_PRODUCT_LINKS[Math.floor(Math.random() * GIFT_PRODUCT_LINKS.length)];
}
