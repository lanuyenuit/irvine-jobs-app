import { LogOut, Menu, Search, User, X } from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Discover", to: "/" },
  { label: "Applications", to: "/applications" },
  { label: "Resume", to: "/resume" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  }

  async function handleLogout() {
    setUserMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex w-full items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="shrink-0">
          <Link to="/" className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-[-0.02em] text-indigo-600 sm:text-xl">Huyen Vo</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Career Hub</span>
          </Link>
        </div>

        {/* Search */}
        <div className="min-w-0 flex-1">
          <form onSubmit={handleSearch} className="hidden h-11 w-full items-center gap-3 rounded-2xl bg-slate-100 px-4 md:flex">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs… (press / to focus)"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => inputRef.current?.focus()} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 md:hidden">
            <Search className="h-5 w-5" />
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 xl:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  ["relative text-sm font-medium transition-colors", isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"].join(" ")
                }
              >
                {({ isActive }) => (
                  <span className="relative inline-block">
                    {item.label}
                    {isActive && <span className="absolute -bottom-[10px] left-0 h-[2px] w-full rounded-full bg-indigo-600" />}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
              aria-label="User menu"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-slate-100 py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 xl:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-slate-100 px-4 pb-3 md:hidden sm:px-6">
        <form onSubmit={handleSearch} className="flex h-11 w-full items-center gap-3 rounded-2xl bg-slate-100 px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, companies, skills..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </form>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 xl:hidden sm:px-6">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
