import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { requireAuth, prisma, hashPassword, comparePassword, hashPin, comparePin, createToken } from "./lib/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

function generateReferralCode() {
  return `ALI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function getUserPortfolioData(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      investments: true,
      dividends: true,
      rewards: true,
      invitedUsers: {
        select: {
          id: true,
          name: true,
          email: true,
          referralCode: true,
          createdAt: true
        }
      }
    }
  });
}

app.get("/api/health", (_, res) => {
  res.json({ ok: true, service: "Ali Asset Bank Investment API" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone, pin, inviteCode } = req.body;

    if (!name || !email || !password || !phone || !pin) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!inviteCode) {
      return res.status(403).json({ message: "Registration requires a valid invitation link." });
    }

    const referralUser = await prisma.user.findUnique({
      where: { referralCode: inviteCode.toUpperCase() }
    });

    if (!referralUser) {
      return res.status(403).json({ message: "This invite code is invalid or expired." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const passwordHash = await hashPassword(password);
    const pinHash = await hashPin(String(pin));

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        pinHash,
        referralCode: generateReferralCode(),
        invitedByUserId: referralUser.id,
        accounts: {
          create: [
            { accountNumber: `AA${Math.floor(100000 + Math.random() * 900000)}`, currency: "USD", balance: 0 },
            { accountNumber: `AA${Math.floor(100000 + Math.random() * 900000)}`, currency: "EUR", balance: 0 }
          ]
        }
      }
    });

    const token = createToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        biometricEnabled: false
      },
      inviter: {
        id: referralUser.id,
        name: referralUser.name,
        referralCode: referralUser.referralCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, pin } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (pin) {
      const pinMatches = await comparePin(String(pin), user.pinHash);
      if (!pinMatches) {
        const failedAttempts = user.failedPinAttempts + 1;

        if (failedAttempts >= 3) {
          const lockedUntil = new Date(Date.now() + 1000 * 60 * 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { failedPinAttempts: 3, isLocked: true, lockedUntil }
          });
          return res.status(423).json({ message: "PIN locked for 10 minutes." });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedPinAttempts }
        });

        return res.status(401).json({ message: `Incorrect PIN. ${3 - failedAttempts} attempts remaining.` });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedPinAttempts: 0, isLocked: false, lockedUntil: null }
      });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        biometricEnabled: user.isBiometricEnabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed." });
  }
});

app.post("/api/auth/biometric", requireAuth, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { isBiometricEnabled: !req.user.isBiometricEnabled }
  });

  res.json({ biometricEnabled: user.isBiometricEnabled });
});

app.get("/api/dashboard", requireAuth, async (req, res) => {
  const user = await getUserPortfolioData(req.user.id);

  const accountBalance = user.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalInvestments = user.investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalDividends = user.dividends.reduce((sum, dividend) => sum + dividend.amount, 0);
  const totalRewards = user.rewards.reduce((sum, reward) => sum + reward.amount, 0);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      referralCode: user.referralCode,
      biometricEnabled: user.isBiometricEnabled,
      inviteLink: `http://localhost:5173/register?invite=${user.referralCode}`
    },
    accounts: user.accounts,
    balance: accountBalance,
    investments: user.investments.map((inv) => ({
      id: inv.id,
      planType: inv.planType,
      amount: inv.amount,
      yieldRate: inv.yieldRate,
      monthlyYield: inv.monthlyYield,
      expectedReturn: inv.expectedReturn,
      status: inv.status,
      nextPayoutDate: inv.nextPayoutDate
    })),
    dividends: user.dividends.map((div) => ({
      id: div.id,
      amount: div.amount,
      period: div.period,
      status: div.status,
      payoutDate: div.payoutDate,
      investmentId: div.investmentId
    })),
    rewards: user.rewards.map((reward) => ({
      id: reward.id,
      type: reward.type,
      amount: reward.amount,
      percentage: reward.percentage,
      createdAt: reward.createdAt
    })),
    invitedUsers: user.invitedUsers,
    totals: {
      investments: totalInvestments,
      dividends: totalDividends,
      rewards: totalRewards
    }
  });
});

app.post("/api/invest", requireAuth, async (req, res) => {
  try {
    const { amount, planType, yieldRate } = req.body;

    if (!amount || !planType || !yieldRate) {
      return res.status(400).json({ message: "Investment details are required." });
    }

    const account = await prisma.account.findFirst({
      where: { userId: req.user.id, currency: "USD" }
    });

    if (!account) {
      return res.status(404).json({ message: "USD account not found." });
    }

    if (Number(amount) > Number(account.balance)) {
      return res.status(400).json({ message: "Insufficient balance for investment." });
    }

    const monthlyYield = Number(amount) * (Number(yieldRate) / 100) / 12;
    const expectedReturn = Number(amount) * (Number(yieldRate) / 100);

    const investment = await prisma.investment.create({
      data: {
        userId: req.user.id,
        amount: Number(amount),
        planType,
        yieldRate: Number(yieldRate),
        monthlyYield,
        expectedReturn,
        nextPayoutDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });

    await prisma.transaction.create({
      data: {
        userId: req.user.id,
        accountId: account.id,
        type: "DEBIT",
        amount: Number(amount),
        currency: "USD",
        description: `Investment in ${planType}`,
        reference: `INV-${Date.now()}`,
        status: "COMPLETED"
      }
    });

    await prisma.account.update({
      where: { id: account.id },
      data: { balance: Number(account.balance) - Number(amount) }
    });

    const dividend = await prisma.dividend.create({
      data: {
        userId: req.user.id,
        investmentId: investment.id,
        amount: monthlyYield,
        period: "Monthly",
        payoutDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        status: "PENDING"
      }
    });

    const inviter = await prisma.user.findUnique({
      where: { id: req.user.invitedByUserId }
    });

    if (inviter) {
      const referralCommission = Number(amount) * 0.08;

      await prisma.reward.create({
        data: {
          userId: inviter.id,
          sourceUserId: req.user.id,
          type: "REFERRAL_PROMOTION",
          amount: referralCommission,
          percentage: 8
        }
      });

      const inviterAccount = await prisma.account.findFirst({
        where: { userId: inviter.id, currency: "USD" }
      });

      if (inviterAccount) {
        await prisma.account.update({
          where: { id: inviterAccount.id },
          data: { balance: Number(inviterAccount.balance) + referralCommission }
        });

        await prisma.transaction.create({
          data: {
            userId: inviter.id,
            accountId: inviterAccount.id,
            type: "CREDIT",
            amount: referralCommission,
            currency: "USD",
            description: `Referral bonus from ${req.user.name}`,
            reference: `REF-${Date.now()}`,
            status: "COMPLETED"
          }
        });
      }
    }

    res.status(201).json({
      message: "Investment created successfully.",
      investment,
      dividend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Investment creation failed." });
  }
});

app.get("/api/transactions", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      accounts: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  const transactions = user.accounts.flatMap((account) => account.transactions);
  res.json({ transactions: transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.get("/api/invite/:code", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { referralCode: req.params.code.toUpperCase() }
  });

  if (!user) {
    return res.status(404).json({ message: "Invite code not found." });
  }

  res.json({ valid: true, invite: user.referralCode, inviter: user.name });
});

app.listen(PORT, () => {
  console.log(`Ali Asset Bank Investment API running on http://localhost:${PORT}`);
});
