import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generateReferralCode() {
  return `ALI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const seed = async () => {
  const existing = await prisma.user.findUnique({ where: { email: "admin@aliassetbank.com" } });
  if (existing) {
    console.log("Seed already exists.");
    return;
  }

  const adminPasswordHash = await bcrypt.hash("Password123!", 10);
  const adminPinHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Ali Asset Admin",
      email: "admin@aliassetbank.com",
      phone: "+1 415 555 1028",
      passwordHash: adminPasswordHash,
      pinHash: adminPinHash,
      referralCode: generateReferralCode(),
      accounts: {
        create: [
          { accountNumber: "AA1000001", currency: "USD", balance: 48250.5 },
          { accountNumber: "AA1000002", currency: "SDG", balance: 9000000 },
          { accountNumber: "AA1000003", currency: "EUR", balance: 12000 }
        ]
      }
    }
  });

  const firstAccount = await prisma.account.findFirst({ where: { userId: admin.id } });

  await prisma.transaction.createMany({
    data: [
      {
        userId: admin.id,
        accountId: firstAccount.id,
        type: "CREDIT",
        amount: 5000,
        currency: "USD",
        description: "Primary deposit",
        reference: "AAB-INV-1001",
        status: "COMPLETED"
      },
      {
        userId: admin.id,
        accountId: firstAccount.id,
        type: "DEBIT",
        amount: 420,
        currency: "USD",
        description: "Monthly investment income",
        reference: "AAB-INV-1002",
        status: "COMPLETED"
      }
    ]
  });

  const investment = await prisma.investment.create({
    data: {
      userId: admin.id,
      amount: 15000,
      planType: "Growth Yield",
      yieldRate: 12.5,
      monthlyYield: 156.25,
      expectedReturn: 1875,
      nextPayoutDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      dividends: {
        create: [
          {
            userId: admin.id,
            amount: 156.25,
            period: "Monthly",
            payoutDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
            status: "PAID"
          }
        ]
      }
    }
  });

  await prisma.reward.create({
    data: {
      userId: admin.id,
      type: "REFERRAL_PROMOTION",
      amount: 245,
      percentage: 8,
      sourceUserId: admin.id
    }
  });

  const referralUser = await prisma.user.create({
    data: {
      name: "Naila Amina",
      email: "naila@example.com",
      phone: "+966 500 123 456",
      passwordHash: await bcrypt.hash("Password123!", 10),
      pinHash: await bcrypt.hash("111111", 10),
      referralCode: generateReferralCode(),
      invitedByUserId: admin.id,
      accounts: {
        create: [
          { accountNumber: "AA2000011", currency: "USD", balance: 8500 }
        ]
      }
    }
  });

  await prisma.reward.create({
    data: {
      userId: admin.id,
      sourceUserId: referralUser.id,
      type: "REFERRAL_BONUS",
      amount: 680,
      percentage: 8
    }
  });

  await prisma.investment.create({
    data: {
      userId: referralUser.id,
      amount: 8500,
      planType: "Premium Yield",
      yieldRate: 15,
      monthlyYield: 106.25,
      expectedReturn: 1275,
      nextPayoutDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      dividends: {
        create: [
          {
            userId: referralUser.id,
            amount: 106.25,
            period: "Monthly",
            payoutDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
            status: "PAID"
          }
        ]
      }
    }
  });

  console.log("Seed data created with demo users and investment data.");
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
