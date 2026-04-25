import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import { MIN_WITHDRAW_COINS } from "@/constants/coinPackages";

const CONFIG_PATH = path.join(process.cwd(), "src/constants/coinPackages.ts");

// GET /api/admin/wallet - Lấy cấu hình gói nạp xu
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fileContent = await fs.readFile(CONFIG_PATH, "utf-8");

    const packagesMatch = fileContent.match(
      /export const COIN_PACKAGES: CoinPackage\[\] = (\[[\s\S]*?\]);/,
    );

    if (!packagesMatch) {
      return NextResponse.json(
        { error: "Không tìm thấy config" },
        { status: 500 },
      );
    }

    const packagesStr = packagesMatch[1]
      .replace(/\/\/.*/g, "")
      .replace(/,(\s*[}\]])/g, "$1");

    const packages = eval(`(${packagesStr})`);

    const minWithdrawMatch = fileContent.match(
      /export const MIN_WITHDRAW_COINS = (\d+[_\d]*)\s*;/,
    );
    const minWithdrawAmount = minWithdrawMatch
      ? Number(minWithdrawMatch[1].replaceAll("_", ""))
      : MIN_WITHDRAW_COINS;

    return NextResponse.json({ packages, minWithdrawAmount });
  } catch (error) {
    console.error("Error reading wallet config:", error);
    return NextResponse.json(
      { error: "Không thể đọc cấu hình" },
      { status: 500 },
    );
  }
}

// POST /api/admin/wallet - Cập nhật cấu hình gói nạp xu
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { packages, minWithdrawAmount } = await req.json();

    if (!Array.isArray(packages)) {
      return NextResponse.json(
        { error: "Invalid packages data" },
        { status: 400 },
      );
    }

    const minWithdraw = Number(minWithdrawAmount ?? MIN_WITHDRAW_COINS);
    if (!Number.isInteger(minWithdraw) || minWithdraw <= 0) {
      return NextResponse.json(
        { error: "Số tiền rút tối thiểu không hợp lệ" },
        { status: 400 },
      );
    }

    const packagesCode = packages
      .map((pkg) => {
        const parts = [
          `id: "${pkg.id}"`,
          `label: "${pkg.label}"`,
          `price: ${pkg.price}`,
          `coins: ${pkg.coins}`,
          `bonus: ${pkg.bonus}`,
        ];
        if (pkg.popular) {
          parts.push("popular: true");
        }
        return `  { ${parts.join(", ")} }`;
      })
      .join(",\n");

    const newContent = `export interface CoinPackage {
  id: string;
  label: string;
  price: number; // VND
  coins: number; // xu credited
  bonus: number; // bonus percentage displayed
  popular?: boolean;
}

export const MIN_WITHDRAW_COINS = ${minWithdraw};

export const COIN_PACKAGES: CoinPackage[] = [
${packagesCode},
];

export function getPackageById(id: string): CoinPackage | undefined {
  return COIN_PACKAGES.find((p) => p.id === id);
}
`;

    await fs.writeFile(CONFIG_PATH, newContent, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating wallet config:", error);
    return NextResponse.json(
      { error: "Không thể lưu cấu hình" },
      { status: 500 },
    );
  }
}
