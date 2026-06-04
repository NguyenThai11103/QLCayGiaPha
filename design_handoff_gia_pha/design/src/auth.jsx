/* global window, React, Icon, VietOrnament */
// ============================================================
// Đăng nhập / Đăng ký — Login & Register Page
// ============================================================
const { useState: useAuthState, useEffect: useAuthEffect, useRef: useAuthRef } = React;

// ============================================================
// Decorative tree illustration for left panel
// ============================================================
function AuthTreeDecor() {
  return (
    <svg viewBox="0 0 400 500" width="100%" height="100%" fill="none" style={{ display: "block", opacity: 0.85 }}>
      <defs>
        <radialGradient id="authHalo" cx="50%" cy="35%" r="50%">
          <stop offset="0%" stopColor="rgba(255,245,210,0.35)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="180" r="160" fill="url(#authHalo)">
        <animate attributeName="r" values="155;170;155" dur="6s" repeatCount="indefinite" />
      </circle>
      {/* Decorative diamond frame */}
      <g opacity="0.3" stroke="rgba(255,240,200,0.5)" strokeWidth="0.6" fill="none">
        <rect x="40" y="40" width="320" height="420" rx="6" strokeDasharray="2 5">
          <animate attributeName="stroke-dashoffset" values="0;42" dur="14s" repeatCount="indefinite" />
        </rect>
        <path d="M200 28 L212 40 L200 52 L188 40 Z" fill="rgba(255,240,200,0.3)" />
        <path d="M200 472 L212 460 L200 448 L188 460 Z" fill="rgba(255,240,200,0.3)" />
      </g>
      {/* Simplified ancestor tree */}
      <g stroke="rgba(255,230,180,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round"
         style={{ strokeDasharray: 400, strokeDashoffset: 400, animation: "drawLine 2.5s cubic-bezier(0.22,1,0.36,1) 0.5s forwards" }}>
        <path d="M200 145 L200 175 L120 175 L120 205" />
        <path d="M200 175 L200 205" />
        <path d="M200 175 L280 175 L280 205" />
        <path d="M120 245 L120 280 L80 280 L80 310" />
        <path d="M120 280 L160 280 L160 310" />
        <path d="M200 245 L200 310" />
        <path d="M280 245 L280 280 L240 280 L240 310" />
        <path d="M280 280 L320 280 L320 310" />
      </g>
      {/* Bloodline */}
      <g stroke="rgba(255,220,150,0.6)" strokeWidth="2" fill="none" strokeLinecap="round"
         style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: "drawLine 2s cubic-bezier(0.22,1,0.36,1) 1.5s forwards" }}>
        <path d="M200 145 L200 205" />
        <path d="M200 245 L200 310" />
      </g>
      {/* Gen 1 — ancestor */}
      <g opacity="0" style={{ animation: "revealScale 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.3s forwards", transformOrigin: "200px 140px" }}>
        <circle cx="200" cy="140" r="30" fill="rgba(255,240,200,0.15)" stroke="rgba(255,220,150,0.5)" strokeWidth="1.5" />
        <circle cx="200" cy="140" r="22" fill="rgba(40,30,15,0.3)" stroke="rgba(255,220,150,0.3)" strokeWidth="0.8" />
        <text x="200" y="136" textAnchor="middle" fontSize="8" fill="rgba(255,240,200,0.7)" fontFamily="Be Vietnam Pro" letterSpacing="1.5">CỤ TỔ</text>
        <text x="200" y="148" textAnchor="middle" fontSize="10" fill="rgba(255,240,200,0.9)" fontFamily="Cormorant Garamond" fontWeight="600">Nguyễn</text>
      </g>
      {/* Gen 2 */}
      {[[120, 0], [200, 1], [280, 2]].map(([x, i]) => (
        <g key={i} opacity="0" style={{ animation: `revealScale 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.9 + i * 0.1}s forwards`, transformOrigin: `${x}px 225px` }}>
          <circle cx={x} cy={225} r="20" fill="rgba(40,30,15,0.25)" stroke="rgba(255,220,150,0.35)" strokeWidth="1" />
        </g>
      ))}
      {/* Gen 3 */}
      {[[80, 0], [160, 1], [200, 2], [240, 3], [320, 4]].map(([x, i]) => (
        <g key={i} opacity="0" style={{ animation: `revealScale 0.4s cubic-bezier(0.34,1.56,0.64,1) ${1.4 + i * 0.08}s forwards`, transformOrigin: `${x}px 330px` }}>
          <circle cx={x} cy={330} r="14" fill="rgba(40,30,15,0.2)" stroke="rgba(255,220,150,0.25)" strokeWidth="0.8" />
          {i === 2 && <>
            <circle cx={x} cy={330} r="14" fill="rgba(255,200,100,0.3)" stroke="rgba(255,220,150,0.6)" strokeWidth="1.5" />
            <circle cx={x} cy={330} r="20" fill="none" stroke="rgba(255,220,150,0.4)" strokeWidth="0.8">
              <animate attributeName="r" values="14;22;14" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </>}
        </g>
      ))}
      {/* Bottom motto */}
      <g opacity="0" style={{ animation: "revealUp 0.6s ease 2s forwards" }}>
        <text x="200" y="400" textAnchor="middle" fontSize="12" fill="rgba(255,240,200,0.5)" fontFamily="Cormorant Garamond" fontStyle="italic" fontWeight="500" letterSpacing="2">
          Trung · Hiếu · Nhân · Nghĩa
        </text>
      </g>
    </svg>
  );
}

// ============================================================
// Input component
// ============================================================
function AuthInput({ label, type = "text", icon, value, onChange, placeholder, error, autoFocus }) {
  const [focused, setFocused] = useAuthState(false);
  const [showPw, setShowPw] = useAuthState(false);
  const inputType = type === "password" ? (showPw ? "text" : "password") : type;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)",
        letterSpacing: 0.3,
      }}>{label}</label>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px",
        background: focused ? "var(--card)" : "var(--card-soft)",
        border: `1.5px solid ${error ? "var(--crimson)" : focused ? "var(--gold)" : "var(--card-border)"}`,
        borderRadius: 10,
        boxShadow: focused ? "0 0 0 3px var(--gold-glow)" : "none",
        transition: "all 0.2s ease",
      }}>
        {icon && <Icon name={icon} size={17} color={focused ? "var(--gold)" : "var(--ink-mute)"} />}
        <input
          autoFocus={autoFocus}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 0, outline: 0, background: "transparent",
            fontSize: 14, color: "var(--ink)", fontFamily: "inherit",
            letterSpacing: 0.2,
          }}
        />
        {type === "password" && (
          <button onClick={() => setShowPw(!showPw)} style={{
            background: "none", border: 0, cursor: "pointer", padding: 0,
            color: "var(--ink-mute)", display: "grid", placeItems: "center",
          }} type="button" tabIndex={-1}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              {showPw ? (
                <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
              ) : (
                <><path d="M17.9 17.9A10.1 10.1 0 0112 20C5 20 1 12 1 12a18.4 18.4 0 015.1-5.9" /><path d="M9.9 4.2A8.8 8.8 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.1" /><path d="M1 1l22 22" /><path d="M14.1 14.1a3 3 0 01-4.2-4.2" /></>
              )}
            </svg>
          </button>
        )}
      </div>
      {error && (
        <div style={{ fontSize: 11.5, color: "var(--crimson)", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Social / OAuth buttons
// ============================================================
function SocialButton({ provider, label, onClick }) {
  const icons = {
    google: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
    facebook: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12a12 12 0 10-13.87 11.86v-8.39H7.08V12h3.05V9.41c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.39A12 12 0 0024 12z" />
      </svg>
    ),
  };
  return (
    <button onClick={onClick} type="button" style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      padding: "11px 16px", borderRadius: 10,
      background: "var(--card)", border: "1.5px solid var(--card-border)",
      color: "var(--ink)", fontSize: 13, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit",
      transition: "all 0.2s ease",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
    >
      {icons[provider]}
      {label}
    </button>
  );
}

// ============================================================
// Main Auth Page
// ============================================================
function AuthPage({ onLogin }) {
  const [mode, setMode] = useAuthState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useAuthState("");
  const [password, setPassword] = useAuthState("");
  const [name, setName] = useAuthState("");
  const [clan, setClan] = useAuthState("");
  const [errors, setErrors] = useAuthState({});
  const [loading, setLoading] = useAuthState(false);
  const [success, setSuccess] = useAuthState(false);
  const [rememberMe, setRememberMe] = useAuthState(true);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email không hợp lệ";
    if (mode !== "forgot") {
      if (!password) e.password = "Vui lòng nhập mật khẩu";
      else if (password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
    }
    if (mode === "register") {
      if (!name.trim()) e.name = "Vui lòng nhập họ tên";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (mode === "forgot") {
        setSuccess(true);
      } else {
        onLogin && onLogin({ email, name });
      }
    }, 1500);
  }

  function switchMode(newMode) {
    setMode(newMode);
    setErrors({});
    setSuccess(false);
  }

  const titles = {
    login: { h: "Chào mừng trở lại", sub: "Đăng nhập để tiếp tục quản lý gia phả" },
    register: { h: "Tạo tài khoản mới", sub: "Bắt đầu hành trình số hoá dòng họ của bạn" },
    forgot: { h: "Quên mật khẩu?", sub: "Nhập email để nhận đường dẫn đặt lại mật khẩu" },
  };
  const t = titles[mode];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      minHeight: "100vh",
      background: "var(--bg)",
    }}>
      {/* ====== LEFT: Decorative panel ====== */}
      <div style={{
        background: "linear-gradient(160deg, #3A2714 0%, #1A120A 50%, #0F0A06 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "48px 40px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.08,
          backgroundImage:
            "linear-gradient(45deg, rgba(255,220,150,0.15) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,220,150,0.15) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,220,150,0.15) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,220,150,0.15) 75%)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
        }} />

        {/* Logo top-left */}
        <div style={{
          position: "absolute", top: 32, left: 32,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, rgba(255,220,150,0.9), rgba(180,120,50,0.9))",
            display: "grid", placeItems: "center",
            boxShadow: "0 4px 16px rgba(255,180,80,0.25)",
          }}>
            <Icon name="tree" size={18} color="#1A120A" />
          </div>
          <div>
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, fontWeight: 600, color: "rgba(255,240,200,0.9)", letterSpacing: 0.5 }}>Gia Phả</div>
            <div style={{ fontSize: 9, color: "rgba(255,240,200,0.4)", letterSpacing: 2, textTransform: "uppercase" }}>Nền tảng gia phả</div>
          </div>
        </div>

        {/* Tree illustration */}
        <div style={{ width: "80%", maxWidth: 400, position: "relative" }}>
          <AuthTreeDecor />
        </div>

        {/* Testimonial / quote area */}
        <div style={{
          position: "absolute", bottom: 48, left: 40, right: 40,
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: 22, fontWeight: 500, fontStyle: "italic",
            color: "rgba(255,240,200,0.6)",
            lineHeight: 1.35, marginBottom: 16,
            letterSpacing: 0.3,
          }}>
            "Cây có gốc mới nở cành xanh ngọn,<br />nước có nguồn mới bể rộng sông sâu."
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,240,200,0.3)", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Ca dao Việt Nam
          </div>
        </div>
      </div>

      {/* ====== RIGHT: Auth form ====== */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 56px",
        position: "relative",
      }}>
        {/* Language switch top-right */}
        <div style={{
          position: "absolute", top: 28, right: 36,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <button style={{
            padding: "5px 10px", borderRadius: 6,
            background: "var(--gold-glow)", border: "1px solid var(--gold-pale)",
            color: "var(--brown)", fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>VI</button>
          <button style={{
            padding: "5px 10px", borderRadius: 6,
            background: "transparent", border: "1px solid var(--line)",
            color: "var(--ink-mute)", fontSize: 11.5, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}>EN</button>
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 999,
              background: "var(--gold-glow)", border: "1px solid var(--gold-pale)",
              marginBottom: 20,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)" }} />
              <span style={{ fontSize: 11, color: "var(--brown)", fontWeight: 600, letterSpacing: 0.5 }}>
                {mode === "login" ? "Đăng nhập" : mode === "register" ? "Đăng ký" : "Khôi phục"}
              </span>
            </div>
            <h1 className="font-serif" style={{
              fontSize: 36, fontWeight: 600, color: "var(--ink)",
              lineHeight: 1.1, letterSpacing: "-0.3px", marginBottom: 8,
            }}>
              {t.h}
            </h1>
            <p style={{ fontSize: 14.5, color: "var(--ink-mute)", lineHeight: 1.45 }}>{t.sub}</p>
          </div>

          {/* Forgot password success */}
          {mode === "forgot" && success ? (
            <div style={{
              padding: 28, borderRadius: 14,
              background: "color-mix(in srgb, var(--jade) 8%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--jade) 25%, transparent)",
              textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px",
                background: "color-mix(in srgb, var(--jade) 14%, transparent)",
                display: "grid", placeItems: "center", color: "var(--jade)",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <div className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
                Email đã được gửi!
              </div>
              <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 20 }}>
                Kiểm tra hộp thư <strong>{email}</strong> để đặt lại mật khẩu. Liên kết có hiệu lực trong 24 giờ.
              </p>
              <button onClick={() => switchMode("login")} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* OAuth buttons */}
              {mode !== "forgot" && (
                <>
                  <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                    <SocialButton provider="google" label="Google" />
                    <SocialButton provider="facebook" label="Facebook" />
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
                    color: "var(--ink-faint)", fontSize: 12, letterSpacing: 0.5,
                  }}>
                    <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                    hoặc đăng {mode === "login" ? "nhập" : "ký"} bằng email
                    <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  </div>
                </>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {mode === "register" && (
                  <AuthInput
                    label="Họ và tên"
                    icon="users"
                    value={name}
                    onChange={setName}
                    placeholder="Nguyễn Văn A"
                    error={errors.name}
                    autoFocus
                  />
                )}

                <AuthInput
                  label="Email"
                  type="email"
                  icon="globe"
                  value={email}
                  onChange={setEmail}
                  placeholder="email@example.com"
                  error={errors.email}
                  autoFocus={mode !== "register"}
                />

                {mode !== "forgot" && (
                  <AuthInput
                    label="Mật khẩu"
                    type="password"
                    icon="settings"
                    value={password}
                    onChange={setPassword}
                    placeholder="Tối thiểu 6 ký tự"
                    error={errors.password}
                  />
                )}

                {mode === "register" && (
                  <AuthInput
                    label="Tên dòng họ (không bắt buộc)"
                    icon="branch"
                    value={clan}
                    onChange={setClan}
                    placeholder="vd: Họ Nguyễn — Tiên Điền, Hà Tĩnh"
                  />
                )}

                {/* Remember + forgot row */}
                {mode === "login" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, color: "var(--ink-soft)", cursor: "pointer",
                    }}>
                      <div onClick={() => setRememberMe(!rememberMe)} style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `1.5px solid ${rememberMe ? "var(--gold)" : "var(--card-border)"}`,
                        background: rememberMe ? "var(--gold)" : "var(--card)",
                        display: "grid", placeItems: "center",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                        {rememberMe && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      Ghi nhớ đăng nhập
                    </label>
                    <button type="button" onClick={() => switchMode("forgot")} style={{
                      background: "none", border: 0, color: "var(--gold)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit",
                    }}>
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-shimmer"
                style={{
                  width: "100%", justifyContent: "center",
                  padding: "14px 24px", fontSize: 15,
                  borderRadius: 10, marginTop: 24,
                  opacity: loading ? 0.7 : 1,
                  position: "relative",
                }}
              >
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      style={{ animation: "ornamentSpin 1s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    {mode === "login" ? "Đăng nhập" : mode === "register" ? "Tạo tài khoản" : "Gửi email khôi phục"}
                    <Icon name="arrow-right" size={16} />
                  </>
                )}
              </button>

              {/* Register terms */}
              {mode === "register" && (
                <p style={{
                  fontSize: 11.5, color: "var(--ink-mute)", textAlign: "center",
                  lineHeight: 1.5, marginTop: 16,
                }}>
                  Bằng việc tạo tài khoản, bạn đồng ý với{" "}
                  <a href="#" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>Điều khoản sử dụng</a>{" "}
                  và{" "}
                  <a href="#" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>Chính sách bảo mật</a>.
                </p>
              )}

              {/* Switch mode */}
              <div style={{
                textAlign: "center", marginTop: 28,
                paddingTop: 20, borderTop: "1px solid var(--line)",
                fontSize: 13.5, color: "var(--ink-mute)",
              }}>
                {mode === "login" ? (
                  <>
                    Chưa có tài khoản?{" "}
                    <button type="button" onClick={() => switchMode("register")} style={{
                      background: "none", border: 0, color: "var(--gold)",
                      fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit",
                    }}>Đăng ký ngay</button>
                  </>
                ) : mode === "register" ? (
                  <>
                    Đã có tài khoản?{" "}
                    <button type="button" onClick={() => switchMode("login")} style={{
                      background: "none", border: 0, color: "var(--gold)",
                      fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit",
                    }}>Đăng nhập</button>
                  </>
                ) : (
                  <>
                    Nhớ mật khẩu rồi?{" "}
                    <button type="button" onClick={() => switchMode("login")} style={{
                      background: "none", border: 0, color: "var(--gold)",
                      fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit",
                    }}>Đăng nhập</button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuthPage });
