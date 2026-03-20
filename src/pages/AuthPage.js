import { useState, useEffect, useRef } from "react";
import { useAuth } from "contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { toast } from "sonner";
import { Loader2, Languages, User, Lock } from "lucide-react";

const appLogo = `${process.env.PUBLIC_URL}/logo.png`;

const copy = {
  en: {
    brand: "Sotima",
    brandAccent: "Built",        // portion to colour teal
    tagline: "Stationery shop management",
    signIn: "Welcome back",
    signInSub: "Sign in to your shop dashboard",
    username: "Username",
    password: "Password",
    loginCta: "Sign In to Dashboard",
    welcome: "Welcome back!",
    loginFailed: "Login failed",
    loginPlaceholder: "Enter your username",
    passPlaceholder: "Enter your password",
    hint: "New accounts are created by the admin.",
  },
  ur: {
    brand: "Sotima",
    brandAccent: "Built",
    tagline: "اسٹیشنری شاپ مینجمنٹ",
    signIn: "خوش آمدید",
    signInSub: "اپنے شاپ ڈیش بورڈ میں سائن ان کریں",
    username: "صارف نام",
    password: "پاس ورڈ",
    loginCta: "سائن ان کریں",
    welcome: "خوش آمدید!",
    loginFailed: "لاگ ان ناکام ہوا",
    loginPlaceholder: "صارف نام درج کریں",
    passPlaceholder: "پاس ورڈ درج کریں",
    hint: "نیا اکاؤنٹ بنانے کے لئے ایڈمن سے رابطہ کریں۔",
  },
};

// ── Stationery canvas background ──────────────────────────────
function useAuthCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Stationery objects: pencils (0), rulers (1), pens (2)
    const OBJ_COUNT = 24;
    const objects = Array.from({ length: OBJ_COUNT }, () => ({
      x:       Math.random(),
      y:       Math.random(),
      angle:   Math.random() * Math.PI * 2,
      speed:   0.00012 + Math.random() * 0.00022,
      drift:   (Math.random() - 0.5) * 0.00007,
      type:    Math.floor(Math.random() * 3),
      len:     38 + Math.random() * 58,
      opacity: 0.04 + Math.random() * 0.09,
      color:   Math.random() < 0.5 ? "teal" : Math.random() < 0.5 ? "orange" : "white",
    }));

    const particles = Array.from({ length: 60 }, () => ({
      x:       Math.random(),
      y:       Math.random(),
      r:       0.5 + Math.random() * 1.5,
      speed:   0.00004 + Math.random() * 0.00009,
      opacity: 0.05 + Math.random() * 0.16,
    }));

    const colorOf = (c) =>
      c === "teal"   ? "rgba(0,212,161," :
      c === "orange" ? "rgba(249,115,22," :
                       "rgba(255,255,255,";

    function drawPencil(len, op, c) {
      ctx.save(); ctx.globalAlpha = op;
      ctx.strokeStyle = colorOf(c) + "1)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-len/2, 0); ctx.lineTo(len/2 - 9, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len/2-9,-3); ctx.lineTo(len/2,0); ctx.lineTo(len/2-9,3); ctx.closePath();
      ctx.fillStyle = colorOf(c) + "0.75)"; ctx.fill();
      ctx.fillStyle = colorOf(c) + "0.4)"; ctx.fillRect(-len/2, -3, 7, 6);
      ctx.restore();
    }

    function drawRuler(len, op, c) {
      ctx.save(); ctx.globalAlpha = op;
      ctx.strokeStyle = colorOf(c) + "1)"; ctx.lineWidth = 1;
      ctx.strokeRect(-len/2, -4, len, 8);
      const ticks = Math.floor(len / 8);
      for (let i = 0; i <= ticks; i++) {
        const tx = -len/2 + i * (len/ticks);
        const th = i % 2 === 0 ? 4 : 2.5;
        ctx.beginPath(); ctx.moveTo(tx, -4); ctx.lineTo(tx, -4 + th); ctx.stroke();
      }
      ctx.restore();
    }

    function drawPen(len, op, c) {
      ctx.save(); ctx.globalAlpha = op;
      ctx.strokeStyle = colorOf(c) + "1)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-len/2, 0); ctx.lineTo(-len/2 + len*0.55, 0); ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-len/2 + len*0.55, 0); ctx.lineTo(len/2-12, 0); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(len/2-12,-2.5); ctx.lineTo(len/2,0); ctx.lineTo(len/2-12,2.5); ctx.stroke();
      ctx.restore();
    }

    let raf;
    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Radial gradient wash
      const g = ctx.createRadialGradient(W*0.2, H*0.15, 0, W*0.5, H*0.5, W*0.85);
      g.addColorStop(0,   "rgba(0,60,50,0.38)");
      g.addColorStop(0.5, "rgba(0,20,15,0.1)");
      g.addColorStop(1,   "rgba(249,80,22,0.07)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // Dot grid
      ctx.globalAlpha = 0.045;
      ctx.fillStyle = "#00D4A1";
      for (let gx = 0; gx < W; gx += 32)
        for (let gy = 0; gy < H; gy += 32) {
          ctx.beginPath(); ctx.arc(gx, gy, 0.8, 0, Math.PI*2); ctx.fill();
        }
      ctx.globalAlpha = 1;

      // Particles
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(0,212,161,${p.opacity})`;
        ctx.fill();
      });

      // Stationery objects
      objects.forEach(o => {
        o.y -= o.speed; o.angle += o.drift;
        if (o.y < -0.15) { o.y = 1.1; o.x = Math.random(); }
        ctx.save();
        ctx.translate(o.x * W, o.y * H);
        ctx.rotate(o.angle);
        if (o.type === 0) drawPencil(o.len, o.opacity, o.color);
        else if (o.type === 1) drawRuler(o.len, o.opacity, o.color);
        else drawPen(o.len, o.opacity, o.color);
        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

// ── Component ─────────────────────────────────────────────────
export default function AuthPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const canvasRef   = useRef(null);
  const [loading, setLoading] = useState(false);
  const [lang,    setLang]    = useState("en");
  const t = copy[lang];

  const [loginData, setLoginData] = useState({ username: "", password: "" });

  useAuthCanvas(canvasRef);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.username, loginData.password);
      toast.success(t.welcome);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`auth-page ${lang === "ur" ? "lang-ur" : ""}`}
      dir={lang === "ur" ? "rtl" : "ltr"}
      data-testid="auth-page"
    >
      {/* Animated canvas background */}
      <canvas id="auth-bg" ref={canvasRef} />

      <div className="auth-shell">
        {/* ── Brand header ── */}
        <div className="auth-header">
          <div className="brand-mark">
            <img src={appLogo} alt="Sotima logo" className="brand-logo-img" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title font-heading">
              {t.brand.replace(t.brandAccent, "")}
              <span className="brand-accent">{t.brandAccent}</span>
            </h1>
            <p className="brand-subtitle">{t.tagline}</p>
          </div>

          <button
            className="lang-toggle"
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            aria-label="Toggle language"
          >
            <Languages className="lang-icon" />
            {lang === "en" ? "اردو" : "English"}
          </button>
        </div>

        {/* ── Card ── */}
        <Card className="auth-card">
          <CardHeader className="pb-3">
            <div className="auth-tabs single">
              <span className="auth-tab-label font-heading">{t.signIn}</span>
            </div>
            <p className="auth-card-sub">{t.signInSub}</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="form-stack">
              {/* Username */}
              <div className="field">
                <Label htmlFor="login-username">{t.username}</Label>
                <div className="input-icon-wrap">
                  <User className="field-icon" />
                  <Input
                    id="login-username"
                    data-testid="login-username"
                    placeholder={t.loginPlaceholder}
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <Label htmlFor="login-password">{t.password}</Label>
                <div className="input-icon-wrap">
                  <Lock className="field-icon" />
                  <Input
                    id="login-password"
                    data-testid="login-password"
                    type="password"
                    placeholder={t.passPlaceholder}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.loginCta}
              </Button>
            </form>

            <div className="auth-divider" />
            <div className="auth-hint">{t.hint}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
