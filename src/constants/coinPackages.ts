export interface CoinPackage {
  id: string;
  label: string;
  price: number; // VND
  coins: number; // xu credited
  bonus: number; // bonus percentage displayed
  popular?: boolean;
}

export const MIN_WITHDRAW_COINS = 50_000;

export const COIN_PACKAGES: CoinPackage[] = [
  { id: "coin_20k", label: "Gói Nhỏ", price: 20_000, coins: 20, bonus: 0 },
  {
    id: "coin_50k",
    label: "Gói Cơ Bản",
    price: 50_000,
    coins: 60,
    bonus: 20,
  },
  {
    id: "coin_100k",
    label: "Gói Phổ Biến",
    price: 100_000,
    coins: 130,
    bonus: 30,
    popular: true,
  },
  {
    id: "coin_200k",
    label: "Gói Cao Cấp",
    price: 200_000,
    coins: 280,
    bonus: 40,
  },
  { id: "coin_500k", label: "Gói Bậc", price: 500_000, coins: 750, bonus: 50 },
  {
    id: "coin_1m",
    label: "Gói Elite",
    price: 1_000_000,
    coins: 1_600,
    bonus: 60,
  },
];

export function getPackageById(id: string): CoinPackage | undefined {
  return COIN_PACKAGES.find((p) => p.id === id);
}
