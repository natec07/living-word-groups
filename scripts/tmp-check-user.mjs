import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const requests = await prisma.accountChangeRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } });
console.log(requests.map(r => ({ type: r.type, newValue: r.newValue, currentEmail: r.user.email, expiresAt: r.expiresAt, expired: r.expiresAt < new Date() })));
await prisma.$disconnect();
