import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, BookOpen, CalendarDays,
  LogOut, Menu, X, Sun, Moon, ShieldCheck, Code2, BarChart3
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink to={to} onClick={onClick} style={({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderRadius: 10,
    color: isActive ? 'var(--accent)' : 'var(--text2)',
    background: isActive ? 'var(--accent-glow)' : 'transparent',
    fontWeight: 600, fontSize: 14,
    transition: 'all 0.2s',
    textDecoration: 'none',
    border: isActive ? '1px solid rgba(124,92,252,0.3)' : '1px solid transparent'
  })}>
    <Icon size={18} />
    {label}
  </NavLink>
);

export default function Layout({ children, theme, toggleTheme }) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const closeMobile = () => setMobileOpen(false);

  const avatar = profile?.avatar_url;
  const initials = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  const Sidebar = ({ mobile = false }) => (
    <aside style={{
      width: mobile ? '100%' : 240,
      minHeight: mobile ? 'auto' : '100vh',
      background: 'var(--bg2)',
      borderRight: mobile ? 'none' : '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
      gap: 4,
      position: mobile ? 'relative' : 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <div style={{ background: 'var(--accent)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Code2 size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>DSA Tracker</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>grind daily</div>
        </div>
      </div>

      <NavItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={closeMobile} />
      <NavItem to="/questions" icon={BookOpen} label="Questions" onClick={closeMobile} />
      <NavItem to="/history" icon={CalendarDays} label="History" onClick={closeMobile} />
      <NavItem to="/progress" icon={BarChart3} label="Leaderboard" onClick={closeMobile} />
      {isAdmin && <NavItem to="/admin" icon={ShieldCheck} label="Admin Panel" onClick={closeMobile} />}

      <div style={{ flex: 1 }} />

      {/* User section */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
          {avatar
            ? <img src={avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'white' }}>{initials}</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'User'}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>

        <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, width: '100%', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--red)', fontSize: 13, fontWeight: 600, width: '100%', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile nav bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }} className="mobile-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'var(--accent)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code2 size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15 }}>DSA Tracker</span>
        </div>
        <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)', padding: 6, borderRadius: 8, cursor: 'pointer' }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)' }} onClick={closeMobile}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 280, height: '100%', background: 'var(--bg2)', borderRight: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div style={{ marginTop: 60 }}>
              <Sidebar mobile />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '24px', paddingTop: 'max(24px, env(safe-area-inset-top))' }} className="main-content">
        {children}
      </main>

      <style>{`
        @media (min-width: 769px) {
          .desktop-sidebar { display: block !important; }
          .mobile-nav { display: none !important; }
          .main-content { padding: 32px 40px !important; }
        }
        @media (max-width: 768px) {
          .main-content { padding-top: 72px !important; }
        }
      `}</style>
    </div>
  );
}
