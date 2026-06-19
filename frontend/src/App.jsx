import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Copy,
  Crown,
  DoorOpen,
  HandHeart,
  LogOut,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { apiRequest } from "./api.js";
import { demoFavors, demoGroups, demoUser } from "./demoData.js";

const TOKEN_KEY = "favor-token";
const USER_KEY = "favor-user";
const statusText = {
  posted: "Posted",
  in_progress: "In progress",
  complete: "Complete",
};

function idOf(value) {
  return value?._id || value?.id || value || "";
}

function formatDate(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function initials(username = "?") {
  return username.slice(0, 2).toUpperCase();
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [isDemo, setIsDemo] = useState(false);
  const [groups, setGroups] = useState([]);
  const [favors, setFavors] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState("");
  const [selectedFavorId, setSelectedFavorId] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewFavor, setShowNewFavor] = useState(false);

  const activeGroup = groups.find((group) => group._id === activeGroupId) || groups[0];
  const groupFavors = favors.filter((favor) => idOf(favor.group) === activeGroup?._id);
  const selectedFavor = favors.find((favor) => favor._id === selectedFavorId);

  const visibleFavors = useMemo(() => {
    return groupFavors.filter((favor) => {
      const matchesFilter = filter === "all" || favor.status === filter;
      const searchText = `${favor.title} ${favor.details} ${favor.postedBy?.username}`.toLowerCase();
      return matchesFilter && searchText.includes(query.trim().toLowerCase());
    });
  }, [groupFavors, filter, query]);

  useEffect(() => {
    if (token && user && !isDemo) loadGroups();
  }, [token, user, isDemo]);

  useEffect(() => {
    if (activeGroup && token && !isDemo) loadFavors(activeGroup._id);
  }, [activeGroup?._id, token, isDemo]);

  useEffect(() => {
    if (!activeGroupId && groups.length) {
      setActiveGroupId(groups[0]._id);
    }
  }, [groups, activeGroupId]);

  async function request(path, options = {}) {
    return apiRequest(path, options, token);
  }

  async function loadGroups() {
    setLoading(true);
    try {
      const data = await request("/groups");
      setGroups(data);
      setActiveGroupId((current) =>
        data.some((group) => group._id === current) ? current : data[0]?._id || ""
      );
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadFavors(groupId) {
    setLoading(true);
    try {
      const data = await request(`/groups/${groupId}/favors`);
      setFavors((current) => [
        ...current.filter((favor) => idOf(favor.group) !== groupId),
        ...data,
      ]);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  function saveAuth(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setIsDemo(false);
    setNotice("");
  }

  function openDemo() {
    setIsDemo(true);
    setUser(demoUser);
    setGroups(demoGroups);
    setFavors(demoFavors);
    setActiveGroupId(demoGroups[0]._id);
    setNotice("");
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
    setIsDemo(false);
    setGroups([]);
    setFavors([]);
    setActiveGroupId("");
    setSelectedFavorId("");
    setNotice("");
  }

  function updateFavor(updated) {
    setFavors((current) =>
      current.map((favor) => (favor._id === updated._id ? updated : favor))
    );
  }

  async function createGroup(name) {
    if (isDemo) {
      const group = {
        _id: `group-${Date.now()}`,
        name,
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        leader: { _id: user.id, username: user.username },
        members: [{ user: { _id: user.id, username: user.username } }],
      };
      setGroups((current) => [group, ...current]);
      setActiveGroupId(group._id);
      setNotice(`Created ${group.name}. Share code ${group.code}.`);
      return;
    }

    const group = await request("/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setGroups((current) => [group, ...current]);
    setActiveGroupId(group._id);
    setNotice(`Created ${group.name}. Share code ${group.code}.`);
  }

  async function joinGroup(code) {
    if (isDemo) {
      setNotice("Demo mode cannot look up a real invite code.");
      return;
    }

    const group = await request("/groups/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    setGroups((current) => {
      const rest = current.filter((item) => item._id !== group._id);
      return [group, ...rest];
    });
    setActiveGroupId(group._id);
    setNotice(`You joined ${group.name}.`);
  }

  async function createFavor(form) {
    if (isDemo) {
      const favor = {
        _id: `favor-${Date.now()}`,
        group: activeGroup._id,
        ...form,
        dueDate: form.dueDate || null,
        status: "posted",
        postedBy: { _id: user.id, username: user.username },
        helper: null,
        pickupRequests: [],
        createdAt: new Date().toISOString(),
      };
      setFavors((current) => [favor, ...current]);
      setNotice("Favor posted.");
      setShowNewFavor(false);
      return;
    }

    const favor = await request("/favors", {
      method: "POST",
      body: JSON.stringify({ ...form, groupId: activeGroup._id }),
    });
    setFavors((current) => [favor, ...current]);
    setNotice("Favor posted.");
    setShowNewFavor(false);
  }

  async function pickupFavor(favor) {
    if (isDemo) {
      if (!favor.helper) {
        updateFavor({
          ...favor,
          helper: { _id: user.id, username: user.username },
          status: "in_progress",
          completedAt: null,
          pickupRequests: favor.pickupRequests.filter(
            (request) => idOf(request.user) !== user.id
          ),
        });
        setNotice("You picked up the favor.");
      } else {
        updateFavor({
          ...favor,
          pickupRequests: [
            ...favor.pickupRequests,
            {
              user: { _id: user.id, username: user.username },
              requestedAt: new Date().toISOString(),
            },
          ],
        });
        setNotice("Transfer request sent.");
      }
      return;
    }

    updateFavor(await request(`/favors/${favor._id}/pickup`, { method: "PATCH" }));
  }

  async function withdrawRequest(favor) {
    if (isDemo) {
      updateFavor({
        ...favor,
        pickupRequests: favor.pickupRequests.filter(
          (item) => idOf(item.user) !== user.id
        ),
      });
      return;
    }

    updateFavor(
      await request(`/favors/${favor._id}/pickup-request`, { method: "DELETE" })
    );
  }

  async function acceptRequest(favor, requestUser) {
    if (isDemo) {
      updateFavor({
        ...favor,
        helper: requestUser,
        status: "in_progress",
        completedAt: null,
        pickupRequests: favor.pickupRequests.filter(
          (request) => idOf(request.user) !== idOf(requestUser)
        ),
      });
      setNotice(`Transferred to @${requestUser.username}.`);
      return;
    }

    updateFavor(
      await request(`/favors/${favor._id}/requests/${idOf(requestUser)}/accept`, {
        method: "PATCH",
      })
    );
  }

  async function changeFavorStatus(favor, nextStatus) {
    if (isDemo) {
      updateFavor({
        ...favor,
        status: nextStatus,
        helper:
          nextStatus === "in_progress" && !favor.helper
            ? { _id: user.id, username: user.username }
            : favor.helper,
        completedAt: nextStatus === "complete" ? new Date().toISOString() : null,
      });
      return;
    }

    updateFavor(
      await request(`/favors/${favor._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      })
    );
  }

  async function dropFavor(favor) {
    if (isDemo) {
      updateFavor({
        ...favor,
        helper: null,
        status: "posted",
        completedAt: null,
      });
    } else {
      updateFavor(
        await request(`/favors/${favor._id}/drop`, {
          method: "PATCH",
        })
      );
    }
    setNotice("Favor dropped.");
  }

  async function deleteFavor(favor) {
    if (isDemo) {
      setFavors((current) => current.filter((item) => item._id !== favor._id));
    } else {
      await request(`/favors/${favor._id}`, { method: "DELETE" });
      setFavors((current) => current.filter((item) => item._id !== favor._id));
    }
    setSelectedFavorId("");
    setNotice("Favor deleted.");
  }

  async function deleteGroup(group) {
    if (isDemo) {
      setGroups((current) => current.filter((item) => item._id !== group._id));
      setFavors((current) => current.filter((favor) => idOf(favor.group) !== group._id));
    } else {
      await request(`/groups/${group._id}`, { method: "DELETE" });
      setGroups((current) => current.filter((item) => item._id !== group._id));
    }
    setActiveGroupId("");
    setNotice("Group deleted.");
  }

  if (!user || (!token && !isDemo)) {
    return <AuthScreen onAuth={saveAuth} onDemo={openDemo} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        groups={groups}
        activeGroup={activeGroup}
        onSelect={setActiveGroupId}
        onCreate={createGroup}
        onJoin={joinGroup}
        onLogout={logout}
      />

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="overline">Group workspace</p>
            <div className="title-row">
              <h1>{activeGroup?.name || "Your groups"}</h1>
              {activeGroup && idOf(activeGroup.leader) === user.id && (
                <span className="leader-chip">
                  <Crown size={13} /> Leader
                </span>
              )}
            </div>
            {activeGroup && (
              <p className="header-subtitle">
                {activeGroup.members.length} members · invite code{" "}
                <button
                  className="copy-code"
                  onClick={() => {
                    navigator.clipboard?.writeText(activeGroup.code);
                    setNotice("Invite code copied.");
                  }}
                >
                  {activeGroup.code} <Copy size={13} />
                </button>
              </p>
            )}
          </div>
          <div className="header-actions">
            {activeGroup && idOf(activeGroup.leader) === user.id && (
              <button
                className="icon-quiet danger-text"
                title="Delete group"
                onClick={() => {
                  if (window.confirm(`Delete ${activeGroup.name} and all of its favors?`)) {
                    deleteGroup(activeGroup).catch((error) => setNotice(error.message));
                  }
                }}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button className="primary-button" onClick={() => setShowNewFavor(true)}>
              <Plus size={18} /> Post a favor
            </button>
          </div>
        </header>

        {notice && (
          <div className="notice-bar">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Close message">
              <X size={16} />
            </button>
          </div>
        )}

        {isDemo && (
          <div className="demo-notice">
            Demo workspace — changes are temporary and are not saved.
          </div>
        )}

        {activeGroup ? (
          <>
            <Stats favors={groupFavors} user={user} />
            <section className="board-section">
              <div className="board-toolbar">
                <div className="filter-tabs">
                  {[
                    ["all", "All"],
                    ["posted", "Posted"],
                    ["in_progress", "In progress"],
                    ["complete", "Complete"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      className={filter === value ? "active" : ""}
                      onClick={() => setFilter(value)}
                    >
                      {label}
                      <span>
                        {value === "all"
                          ? groupFavors.length
                          : groupFavors.filter((favor) => favor.status === value).length}
                      </span>
                    </button>
                  ))}
                </div>
                <label className="search-box">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search favors"
                  />
                </label>
              </div>

              {visibleFavors.length ? (
                <div className="favor-grid">
                  {visibleFavors.map((favor) => (
                    <FavorCard
                      key={favor._id}
                      favor={favor}
                      user={user}
                      onOpen={() => setSelectedFavorId(favor._id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBoard loading={loading} onPost={() => setShowNewFavor(true)} />
              )}
            </section>
          </>
        ) : (
          <NoGroups />
        )}
      </main>

      {showNewFavor && activeGroup && (
        <NewFavorModal
          group={activeGroup}
          onClose={() => setShowNewFavor(false)}
          onSubmit={createFavor}
          onError={(error) => setNotice(error.message)}
        />
      )}

      {selectedFavor && (
        <FavorDetailModal
          favor={selectedFavor}
          group={activeGroup}
          user={user}
          onClose={() => setSelectedFavorId("")}
          onPickup={() => pickupFavor(selectedFavor).catch((error) => setNotice(error.message))}
          onWithdraw={() =>
            withdrawRequest(selectedFavor).catch((error) => setNotice(error.message))
          }
          onAccept={(requestUser) =>
            acceptRequest(selectedFavor, requestUser).catch((error) =>
              setNotice(error.message)
            )
          }
          onChangeStatus={(status) =>
            changeFavorStatus(selectedFavor, status).catch((error) =>
              setNotice(error.message)
            )
          }
          onDrop={() =>
            dropFavor(selectedFavor).catch((error) => setNotice(error.message))
          }
          onDelete={() => {
            if (window.confirm("Delete this favor?")) {
              deleteFavor(selectedFavor).catch((error) => setNotice(error.message));
            }
          }}
        />
      )}
    </div>
  );
}

function AuthScreen({ onAuth, onDemo }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onAuth(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="brand-lockup">
          <span className="brand-mark">
            <HandHeart size={27} strokeWidth={2.2} />
          </span>
          <span>Favor</span>
        </div>
        <div className="intro-copy">
          <p className="overline">For the people you count on</p>
          <h1>Give a little.<br />Get a little help.</h1>
          <p>
            A simple place for roommates, classmates, and close groups to ask,
            help, and keep their word.
          </p>
        </div>
        <div className="sample-card-stack" aria-hidden="true">
          <div className="sample-card rear">
            <span />
          </div>
          <div className="sample-card">
            <div className="sample-top">
              <span className="sample-avatar">JM</span>
              <span className="sample-status">In progress</span>
            </div>
            <strong>Pick up the grocery order</strong>
            <p>Today, before 6:30 PM</p>
            <div className="sample-helper">
              <Check size={14} /> Jules has this
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="overline">{mode === "login" ? "Welcome back" : "Join Favor"}</p>
          <h2>{mode === "login" ? "Sign in to your groups" : "Create your account"}</h2>
          <p className="auth-copy">
            {mode === "login"
              ? "Your favors and groups are waiting."
              : "Pick a username people in your groups will recognize."}
          </p>
          <form onSubmit={submit}>
            <label>
              Username
              <div className="input-wrap">
                <UserRound size={17} />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  placeholder="your_username"
                  autoComplete="username"
                />
              </div>
            </label>
            <label>
              Password
              <div className="input-wrap">
                <span className="password-dot">••</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="6 or more characters"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button auth-submit" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              <ArrowRight size={17} />
            </button>
          </form>
          <button className="text-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
          <div className="demo-divider"><span>or</span></div>
          <button className="demo-button" onClick={onDemo}>
            Explore the demo workspace <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
}

function Sidebar({ user, groups, activeGroup, onSelect, onCreate, onJoin, onLogout }) {
  const [panel, setPanel] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      if (panel === "create") await onCreate(value);
      else await onJoin(value);
      setValue("");
      setPanel("");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand-lockup small">
        <span className="brand-mark">
          <HandHeart size={22} />
        </span>
        <span>Favor</span>
      </div>

      <div className="groups-heading">
        <span>Your groups</span>
        <button onClick={() => setPanel(panel === "create" ? "" : "create")} title="Create group">
          <Plus size={17} />
        </button>
      </div>

      {panel && (
        <form className="group-form" onSubmit={submit}>
          <div className="mini-switch">
            <button
              type="button"
              className={panel === "create" ? "active" : ""}
              onClick={() => {
                setPanel("create");
                setValue("");
              }}
            >
              Create
            </button>
            <button
              type="button"
              className={panel === "join" ? "active" : ""}
              onClick={() => {
                setPanel("join");
                setValue("");
              }}
            >
              Join
            </button>
          </div>
          <input
            value={value}
            onChange={(event) =>
              setValue(panel === "join" ? event.target.value.toUpperCase() : event.target.value)
            }
            placeholder={panel === "create" ? "Group name" : "Invite code"}
            autoFocus
          />
          {error && <p>{error}</p>}
          <button className="small-submit">
            {panel === "create" ? "Create group" : "Join group"}
          </button>
        </form>
      )}

      {!panel && (
        <button className="join-link" onClick={() => setPanel("join")}>
          <DoorOpen size={16} /> Join with a code
        </button>
      )}

      <div className="group-list">
        {groups.map((group) => (
          <button
            key={group._id}
            className={`group-row ${activeGroup?._id === group._id ? "active" : ""}`}
            onClick={() => onSelect(group._id)}
          >
            <span className="group-avatar">{initials(group.name.replace(/\s/g, ""))}</span>
            <span className="group-name">
              <strong>{group.name}</strong>
              <small>{group.members.length} members</small>
            </span>
            {idOf(group.leader) === user.id && <Crown size={14} />}
          </button>
        ))}
      </div>

      <div className="profile-menu">
        <span className="user-avatar">{initials(user.username)}</span>
        <span>
          <strong>@{user.username}</strong>
          <small>Member</small>
        </span>
        <button onClick={onLogout} title="Log out">
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}

function Stats({ favors, user }) {
  const stats = [
    {
      label: "Ready to help",
      value: favors.filter((favor) => favor.status === "posted").length,
      icon: <ClipboardList size={19} />,
      tone: "blue",
    },
    {
      label: "In progress",
      value: favors.filter((favor) => favor.status === "in_progress").length,
      icon: <Clock3 size={19} />,
      tone: "purple",
    },
    {
      label: "You've picked up",
      value: favors.filter(
        (favor) => idOf(favor.helper) === user.id && favor.status !== "complete"
      ).length,
      icon: <HandHeart size={19} />,
      tone: "deep",
    },
    {
      label: "Completed",
      value: favors.filter((favor) => favor.status === "complete").length,
      icon: <CheckCircle2 size={19} />,
      tone: "mauve",
    },
  ];

  return (
    <section className="stats-grid">
      {stats.map((stat) => (
        <article className={`stat-card ${stat.tone}`} key={stat.label}>
          <span className="stat-icon">{stat.icon}</span>
          <div>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function FavorCard({ favor, user, onOpen }) {
  const requested = favor.pickupRequests?.some((item) => idOf(item.user) === user.id);

  return (
    <button className={`favor-card status-${favor.status}`} onClick={onOpen}>
      <div className="card-top">
        <span className={`status-badge ${favor.status}`}>
          <span />
          {statusText[favor.status]}
        </span>
      </div>
      <div className="category-row">
        <span>{favor.category}</span>
        <span className="due-date">
          <CalendarDays size={14} /> {formatDate(favor.dueDate)}
        </span>
      </div>
      <h3>{favor.title}</h3>
      <p>{favor.details || "No extra details were added."}</p>
      <div className="card-footer">
        <div className="posted-by">
          <span className="mini-avatar">{initials(favor.postedBy?.username)}</span>
          <span>
            <small>Posted by</small>
            <strong>@{favor.postedBy?.username}</strong>
          </span>
        </div>
        {favor.helper ? (
          <span className="helper-label">
            <HandHeart size={15} />
            {idOf(favor.helper) === user.id ? "You have this" : `@${favor.helper.username}`}
          </span>
        ) : (
          <span className="helper-label open">Needs a hand</span>
        )}
      </div>
      {(favor.pickupRequests?.length > 0 || requested) && (
        <div className="request-strip">
          <Users size={14} />
          {requested
            ? "Your transfer request is waiting"
            : `${favor.pickupRequests.length} pickup request${favor.pickupRequests.length === 1 ? "" : "s"}`}
        </div>
      )}
    </button>
  );
}

function NewFavorModal({ group, onClose, onSubmit, onError }) {
  const [form, setForm] = useState({
    title: "",
    details: "",
    category: "Errand",
    dueDate: "",
  });
  const [busy, setBusy] = useState(false);

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <form className="new-favor-form" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <p className="overline">New favor · {group.name}</p>
            <h2>What could you use a hand with?</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <label>
          Short title
          <input
            value={form.title}
            onChange={(event) => change("title", event.target.value)}
            placeholder="e.g. Grab oat milk on your way home"
            maxLength={90}
            required
            autoFocus
          />
        </label>
        <label>
          Details
          <textarea
            value={form.details}
            onChange={(event) => change("details", event.target.value)}
            placeholder="Add any timing, location, or other useful details."
            maxLength={600}
          />
          <small className="character-count">{form.details.length}/600</small>
        </label>
        <div className="form-row">
          <label>
            Category
            <span className="select-wrap">
              <select
                value={form.category}
                onChange={(event) => change("category", event.target.value)}
              >
                {["Errand", "Study", "Ride", "Home", "Other"].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <ChevronDown size={16} />
            </span>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => change("dueDate", event.target.value)}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            <Send size={16} /> {busy ? "Posting..." : "Post favor"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function FavorDetailModal({
  favor,
  group,
  user,
  onClose,
  onPickup,
  onWithdraw,
  onAccept,
  onChangeStatus,
  onDrop,
  onDelete,
}) {
  const isPoster = idOf(favor.postedBy) === user.id;
  const isHelper = idOf(favor.helper) === user.id;
  const isLeader = idOf(group?.leader) === user.id;
  const ownRequest = favor.pickupRequests?.find((item) => idOf(item.user) === user.id);
  const canChangeStatus = isPoster || isHelper;
  const canAccept = (isPoster || isHelper) && favor.status !== "complete";
  const canDelete = isPoster || isLeader;

  return (
    <ModalShell onClose={onClose} wide>
      <article className="detail-modal">
        <header className="detail-header">
          <div className="detail-badges">
            <span className={`status-badge ${favor.status}`}>
              <span /> {statusText[favor.status]}
            </span>
            <span className="category-chip">{favor.category}</span>
          </div>
          <div className="detail-header-actions">
            {canDelete && (
              <button className="icon-quiet danger-text" onClick={onDelete} title="Delete favor">
                <Trash2 size={18} />
              </button>
            )}
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="detail-body">
          <section className="detail-main">
            <p className="overline">Favor details</p>
            <h2>{favor.title}</h2>
            <p className="detail-description">
              {favor.details || "No extra details were added for this favor."}
            </p>

            <div className="people-grid">
              <PersonBlock label="Posted by" person={favor.postedBy} />
              <PersonBlock
                label="Current helper"
                person={favor.helper}
                empty="Nobody yet"
              />
            </div>

            {favor.pickupRequests?.length > 0 && (
              <section className="requests-section">
                <div className="section-heading">
                  <div>
                    <h3>Pickup requests</h3>
                    <p>Requests stay here until each person withdraws theirs.</p>
                  </div>
                  <span>{favor.pickupRequests.length}</span>
                </div>
                <div className="request-list">
                  {favor.pickupRequests.map((request) => (
                    <div className="request-row" key={idOf(request.user)}>
                      <span className="user-avatar compact">
                        {initials(request.user.username)}
                      </span>
                      <span>
                        <strong>@{request.user.username}</strong>
                        <small>Wants to take this favor</small>
                      </span>
                      {canAccept && idOf(request.user) !== idOf(favor.helper) && (
                        <button onClick={() => onAccept(request.user)}>
                          Transfer <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>

          <aside className="detail-side">
            <div className="detail-fact">
              <CalendarDays size={18} />
              <span>
                <small>Due date</small>
                <strong>{formatDate(favor.dueDate)}</strong>
              </span>
            </div>
            <div className="detail-fact">
              <Users size={18} />
              <span>
                <small>Group</small>
                <strong>{group?.name}</strong>
              </span>
            </div>

            <div className="status-path">
              {["posted", "in_progress", "complete"].map((status, index) => {
                const order = ["posted", "in_progress", "complete"];
                const reached = order.indexOf(favor.status) >= index;
                return (
                  <div className={reached ? "reached" : ""} key={status}>
                    <span>{reached ? <Check size={13} /> : index + 1}</span>
                    <strong>{statusText[status]}</strong>
                  </div>
                );
              })}
            </div>

            <div className="detail-actions">
              {!favor.helper && favor.status === "posted" && !isPoster && (
                <button className="primary-button" onClick={onPickup}>
                  <HandHeart size={17} /> Pick this up
                </button>
              )}
              {favor.helper && !isHelper && favor.status !== "complete" && !ownRequest && (
                <button className="primary-button" onClick={onPickup}>
                  <Send size={16} /> Request to take over
                </button>
              )}
              {ownRequest && (
                <button className="secondary-button" onClick={onWithdraw}>
                  Withdraw my request
                </button>
              )}
              {canChangeStatus && favor.status !== "posted" && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    onChangeStatus(
                      favor.status === "complete" ? "in_progress" : "posted"
                    )
                  }
                >
                  <ArrowLeft size={16} />
                  {favor.status === "complete" ? "Back to in progress" : "Back to posted"}
                </button>
              )}
              {canChangeStatus && favor.status !== "complete" && (
                <button
                  className="advance-button"
                  onClick={() =>
                    onChangeStatus(
                      favor.status === "posted" ? "in_progress" : "complete"
                    )
                  }
                >
                  {favor.status === "posted" ? "Start it myself" : "Mark complete"}
                  <ArrowRight size={16} />
                </button>
              )}
              {isHelper && favor.status !== "complete" && (
                <button className="drop-button" onClick={onDrop}>
                  Drop this favor
                </button>
              )}
              {favor.status === "complete" && (
                <div className="complete-note">
                  <CheckCircle2 size={18} /> This favor is finished.
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    </ModalShell>
  );
}

function PersonBlock({ label, person, empty }) {
  return (
    <div className="person-block">
      <span className="user-avatar">{person ? initials(person.username) : "—"}</span>
      <span>
        <small>{label}</small>
        <strong>{person ? `@${person.username}` : empty}</strong>
      </span>
    </div>
  );
}

function ModalShell({ children, onClose, wide = false }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`modal-card ${wide ? "wide" : ""}`}>{children}</div>
    </div>
  );
}

function EmptyBoard({ loading, onPost }) {
  return (
    <div className="empty-board">
      <span><ClipboardList size={28} /></span>
      <h3>{loading ? "Loading favors..." : "No favors match this view"}</h3>
      <p>Clear your filters or post the first favor for this group.</p>
      {!loading && (
        <button className="secondary-button" onClick={onPost}>
          <Plus size={16} /> Post a favor
        </button>
      )}
    </div>
  );
}

function NoGroups() {
  return (
    <div className="no-groups">
      <span><Users size={30} /></span>
      <h2>Start with your people.</h2>
      <p>Create a group from the sidebar, or join one using an invite code.</p>
    </div>
  );
}
