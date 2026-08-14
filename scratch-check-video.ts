import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const v = await prisma.video.findFirst({ where: { providerRef: "FsSIoWKMJq4" } });
  console.log(JSON.stringify(v, null, 2));
  const featured = await prisma.video.findFirst({ where: { visibility: "PUBLIC" }, orderBy: { createdAt: "desc" } });
  console.log("featured (by createdAt desc):", featured?.providerRef, featured?.title);
  await prisma.$disconnect();
}
main();
