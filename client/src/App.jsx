import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Landmark,
  Menu,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import { WORLD_CURRENCIES } from "./data/currencies";
import { request } from "./lib/api";

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

const investmentPlans = [
  { name: "Starter Yield", rate: 8, description: "Balanced income plan" },
  { name: "Growth Yield", rate: 12.5, description: "Long-term capital gain" },
  { name: "Premium Yield", rate: 15, description: "High return strategy" }
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("ali-token") || "");
  const [dashboard, setDashboard] = useState(null);
  const [view, setView] = useState("home");
  const [showBalance, setShowBalance] = useState(true);
  const [toast, setToast] = useState("");
  const [auth, setAuth] = useState({
    name: "",
    email: "admin@aliassetbank.com",
    password: "Password123!",
    phone: "+1 415 555 1028",
    pin: "123456",
    inviteCode: "ALI-..." 
  });
  const [investmentForm, setInvestmentForm] = useState({
    amount: "2000",
    planType: "Growth Yield",
    yieldRate: 12.5
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  async function loadDashboard() {
    try {
      const data = await request("/dashboard");
      setDashboard(data);
    } catch (error) {
      setToast(error.message || "Unable to load dashboard");
      localStorage.removeItem("ali-token");
      setToken("");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: auth.email,
          password: auth.password,
          pin: auth.pin
        })
      });

      localStorage.setItem("ali-token", data.token);
      setToken(data.token);
      setToast("Welcome back");
    } catch (error) {
      setToast(error.message || "Login failed");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: auth.name,
          email: auth.email,
          password: auth.password,
          phone: auth.phone,
          pin: auth.pin,
          inviteCode: auth.inviteCode
        })
      });

      localStorage.setItem("ali-token", data.token);
      setToken(data.token);
      setToast("Account created successfully");
    } catch (error) {
      setToast(error.message || "Registration failed");
    }
  }

  async function handleInvestment(e) {
    e.preventDefault();
    try {
      const selectedPlan = investmentPlans.find((plan) => plan.name === investmentForm.planType) || investmentPlans[1];
      const data = await request("/invest", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(investmentForm.amount),
          planType: selectedPlan.name,
          yieldRate: selectedPlan.rate
        })
      });

      setToast(data.message || "Investment started");
      loadDashboard();
      setView("home");
    } catch (error) {
      setToast(error.message || "Investment failed");
    }
  }

  async function toggleBiometric() {
    try {
      const data = await request("/auth/biometric", {
        method: "POST",
        body: JSON.stringify({ enabled: !dashboard.user.biometricEnabled })
      });
      setDashboard({ ...dashboard, user: { ...dashboard.user, biometricEnabled: data.biometricEnabled } });
      setToast("Biometric option updated");
    } catch (error) {
      setToast(error.message || "Biometric update failed");
    }
  }

  const renderAuth = () => (
    <div className="app-shell flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-sky-600">Ali Asset</div>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Bank</h1>
          </div>
          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
            <Landmark size={24} />
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-slate-900 p-4 text-white">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Invite-only access</div>
          <div className="mt-2 text-sm text-slate-200">Use a valid referral link to join</div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={auth.email}
              onChange={(e) => setAuth({ ...auth, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={auth.password}
              onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">PIN</label>
            <input
              type="password"
              maxLength={6}
              value={auth.pin}
              onChange={(e) => setAuth({ ...auth, pin: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <button className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-lg shadow-sky-200">
            Sign In
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input
              value={auth.name}
              onChange={(e) => setAuth({ ...auth, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input
              value={auth.phone}
              onChange={(e) => setAuth({ ...auth, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Invite code / referral link</label>
            <input
              value={auth.inviteCode}
              onChange={(e) => setAuth({ ...auth, inviteCode: e.target.value })}
              placeholder="ALI-XXXXXX or invite link"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            />
          </div>

          <button className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 font-semibold text-slate-800">
            Create account
          </button>
        </form>
      </div>
    </div>
  );

  if (!token || !dashboard) return renderAuth();

  const renderHome = () => (
    <div className="app-shell pb-24">
      <div className="bg-slate-900 px-4 pb-24 pt-6 text-white">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <button className="rounded-full border border-white/20 p-2">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-300">3</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-300">Good morning</div>
              <h2 className="mt-1 text-2xl font-bold">{dashboard.user.name}</h2>
            </div>
            <button onClick={toggleBiometric} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              {dashboard.user.biometricEnabled ? "Biometric on" : "Biometric off"}
            </button>
          </div>

          <div className="mt-8 rounded-[28px] bg-gradient-to-br from-brand-500 to-brand-700 p-5 shadow-2xl shadow-sky-900/30">
            <div className="flex items-center justify-between text-sm text-sky-100">
              <span>Portfolio balance</span>
              <button onClick={() => setShowBalance((v) => !v)}>
                {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-sky-100">Available funds</div>
            <div className="mt-2 text-4xl font-extrabold">
              {showBalance ? formatCurrency(dashboard.balance, "USD") : "••••••"}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-sky-100">
              <span>{dashboard.user.referralCode}</span>
              <span>USD</span>
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-14 mx-auto max-w-md px-4">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setView("invest")} className="mobile-card rounded-2xl p-4 text-left shadow-soft">
            <div className="mb-3 inline-flex rounded-xl bg-brand-100 p-2 text-brand-700">
              <TrendingUp size={18} />
            </div>
            <div className="font-semibold text-slate-800">Invest</div>
          </button>

          <button onClick={() => setView("referrals")} className="mobile-card rounded-2xl p-4 text-left shadow-soft">
            <div className="mb-3 inline-flex rounded-xl bg-violet-100 p-2 text-violet-700">
              <Users size={18} />
            </div>
            <div className="font-semibold text-slate-800">Referrals</div>
          </button>

          <button onClick={() => setView("transactions")} className="mobile-card rounded-2xl p-4 text-left shadow-soft">
            <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <ReceiptText size={18} />
            </div>
            <div className="font-semibold text-slate-800">Transactions</div>
          </button>

          <button onClick={() => setView("portfolio")} className="mobile-card rounded-2xl p-4 text-left shadow-soft">
            <div className="mb-3 inline-flex rounded-xl bg-amber-100 p-2 text-amber-700">
              <BriefcaseBusiness size={18} />
            </div>
            <div className="font-semibold text-slate-800">Portfolio</div>
          </button>
        </div>

        <div className="mobile-card mt-5 rounded-[26px] p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Investment overview</h3>
            <div className="text-sm font-medium text-brand-600">8% referral reward</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Invested</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(dashboard.totals.investments, "USD")}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Yield</div>
              <div className="mt-2 text-lg font-bold text-emerald-600">{formatCurrency(dashboard.totals.dividends, "USD")}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Rewards</div>
              <div className="mt-2 text-lg font-bold text-violet-600">{formatCurrency(dashboard.totals.rewards, "USD")}</div>
            </div>
          </div>
        </div>

        <div className="mobile-card mt-5 rounded-[26px] p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Recent dividends</h3>
            <button onClick={() => setView("portfolio")} className="text-sm font-medium text-sky-600">View all</button>
          </div>

          <div className="space-y-3">
            {(dashboard.dividends || []).slice(0, 4).map((div) => (
              <div key={div.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <div>
                  <div className="font-medium text-slate-800">{div.period} Dividend</div>
                  <div className="text-xs text-slate-500">{new Date(div.payoutDate).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-600">+{formatCurrency(div.amount, "USD")}</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{div.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvest = () => (
    <div className="app-shell p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setView("home")} className="rounded-full bg-white p-2 text-slate-700 shadow-sm">←</button>
        <h2 className="text-xl font-bold text-slate-800">Invest</h2>
        <div className="w-10" />
      </div>

      <form onSubmit={handleInvestment} className="space-y-4">
        <div className="mobile-card rounded-2xl p-4 shadow-soft">
          <div className="mb-3 text-sm font-medium text-slate-700">Choose plan</div>
          <div className="space-y-3">
            {investmentPlans.map((plan) => (
              <button
                type="button"
                key={plan.name}
                onClick={() => setInvestmentForm({ ...investmentForm, planType: plan.name, yieldRate: plan.rate })}
                className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${
                  investmentForm.planType === plan.name ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-800">{plan.name}</div>
                  <div className="text-xs text-slate-500">{plan.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-brand-600">{plan.rate}%</div>
                  <div className="text-xs text-slate-500">annual</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mobile-card rounded-2xl p-4 shadow-soft">
          <label className="mb-1 block text-sm font-medium text-slate-700">Investment amount</label>
          <input
            type="number"
            min="100"
            value={investmentForm.amount}
            onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
          />

          <div className="mt-3 rounded-2xl bg-brand-50 p-3 text-sm">
            <div className="flex items-center justify-between text-slate-700">
              <span>Monthly yield</span>
              <span className="font-bold text-brand-700">
                {formatCurrency((Number(investmentForm.amount || 0) * (Number(investmentForm.yieldRate || 0) / 100)) / 12, "USD")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-slate-700">
              <span>Projected annual return</span>
              <span className="font-bold text-brand-700">
                {formatCurrency(Number(investmentForm.amount || 0) * (Number(investmentForm.yieldRate || 0) / 100), "USD")}
              </span>
            </div>
          </div>
        </div>

        <button className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-lg shadow-brand-200">
          Start investment
        </button>
      </form>
    </div>
  );

  const renderReferrals = () => (
    <div className="app-shell p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setView("home")} className="rounded-full bg-white p-2 text-slate-700 shadow-sm">←</button>
        <h2 className="text-xl font-bold text-slate-800">Referrals</h2>
        <div className="w-10" />
      </div>

      <div className="mobile-card rounded-2xl p-4 shadow-soft">
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Your referral code</div>
        <div className="text-2xl font-black text-slate-900">{dashboard.user.referralCode}</div>
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          {dashboard.user.inviteLink}
        </div>
      </div>

      <div className="mobile-card mt-4 rounded-2xl p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Referral rewards</h3>
          <div className="text-sm font-medium text-violet-600">8% promotion</div>
        </div>

        <div className="space-y-3">
          {(dashboard.rewards || []).map((reward) => (
            <div key={reward.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <div>
                <div className="font-medium text-slate-800">{reward.type}</div>
                <div className="text-xs text-slate-500">{new Date(reward.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-violet-600">+{formatCurrency(reward.amount, "USD")}</div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{reward.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mobile-card mt-4 rounded-2xl p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Invited users</h3>
          <div className="text-sm font-medium text-slate-600">{(dashboard.invitedUsers || []).length}</div>
        </div>

        <div className="space-y-3">
          {(dashboard.invitedUsers || []).map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <div>
                <div className="font-medium text-slate-800">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="app-shell p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setView("home")} className="rounded-full bg-white p-2 text-slate-700 shadow-sm">←</button>
        <h2 className="text-xl font-bold text-slate-800">Portfolio</h2>
        <div className="w-10" />
      </div>

      <div className="space-y-4">
        {(dashboard.investments || []).map((item) => (
          <div key={item.id} className="mobile-card rounded-2xl p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">{item.planType}</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(item.amount, "USD")}</div>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{item.status}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Yield</div>
                <div className="mt-2 font-bold">{item.yieldRate}%</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Monthly</div>
                <div className="mt-2 font-bold">{formatCurrency(item.monthlyYield, "USD")}</div>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Next payout: {new Date(item.nextPayoutDate).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="app-shell p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setView("home")} className="rounded-full bg-white p-2 text-slate-700 shadow-sm">←</button>
        <h2 className="text-xl font-bold text-slate-800">Transactions</h2>
        <div className="w-10" />
      </div>

      <div className="space-y-3">
        {(dashboard.transactions || []).map((tx) => (
          <div key={tx.id} className="mobile-card rounded-2xl p-3 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800">{tx.description}</div>
                <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</div>
              </div>
              <div className={`font-semibold ${tx.type === "CREDIT" ? "text-emerald-600" : "text-slate-800"}`}>
                {tx.type === "CREDIT" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  let content = renderHome();
  if (view === "invest") content = renderInvest();
  if (view === "referrals") content = renderReferrals();
  if (view === "portfolio") content = renderPortfolio();
  if (view === "transactions") content = renderTransactions();

  return (
    <>
      {content}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
