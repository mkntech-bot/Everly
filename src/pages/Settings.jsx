import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [displayName, setDisplayName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  // =========================================================
  // LOAD SETTINGS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoading(true);
        setMessage("");

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          navigate("/auth", {
            replace: true,
          });

          return;
        }

        if (!mounted) {
          return;
        }

        setUser(currentUser);

        const {
          data: profileRows,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .limit(1);

        if (profileError) {
          throw profileError;
        }

        const currentProfile =
          profileRows?.[0] || null;

        if (!mounted) {
          return;
        }

        setProfile(
          currentProfile
        );

        setDisplayName(
          currentProfile?.display_name ||
            currentUser?.user_metadata
              ?.full_name ||
            ""
        );
      } catch (error) {
        console.error(
          "Settings loading error:",
          error
        );

        if (!mounted) {
          return;
        }

        if (
          error?.name ===
            "AuthSessionMissingError" ||
          error?.message?.includes(
            "Auth session missing"
          ) ||
          error?.message?.includes(
            "User from sub claim in JWT does not exist"
          )
        ) {
          await supabase.auth.signOut();

          navigate("/auth", {
            replace: true,
          });

          return;
        }

        setMessage(
          error?.message ||
            "Could not load your settings."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveProfile =
    async (event) => {
      event.preventDefault();

      const cleanName =
        displayName.trim();

      if (!cleanName) {
        setMessage(
          "Please enter your display name."
        );

        return;
      }

      if (!user?.id) {
        setMessage(
          "We couldn't find your account."
        );

        return;
      }

      try {
        setSaving(true);
        setMessage("");

        const {
          error,
        } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              display_name:
                cleanName,
            },
            {
              onConflict: "id",
            }
          );

        if (error) {
          throw error;
        }

        setProfile(
          (current) => ({
            ...(current || {}),
            id: user.id,
            display_name:
              cleanName,
          })
        );

        setMessage(
          "Your profile has been updated."
        );
      } catch (error) {
        console.error(
          "Profile update error:",
          error
        );

        setMessage(
          error?.message ||
            "Could not update your profile."
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      sessionStorage.removeItem(
        "everly_invite_token"
      );

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const handlePasswordReset =
    async () => {
      if (!user?.email) {
        return;
      }

      try {
        const {
          error,
        } = await supabase.auth.resetPasswordForEmail(
          user.email,
          {
            redirectTo:
              `${window.location.origin}/auth`,
          }
        );

        if (error) {
          throw error;
        }

        alert(
          "Password reset instructions have been sent to your email."
        );
      } catch (error) {
        console.error(
          "Password reset error:",
          error
        );

        alert(
          "Could not send password reset email:\n\n" +
            (
              error?.message ||
              "Unknown error"
            )
        );
      }
    };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="dashboard-loading">

        <div className="dashboard-loader-heart">
          ♥
        </div>

        <p>
          Loading your settings...
        </p>

      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">

        <div className="dashboard-brand">
          <span>♥</span>

          <strong>
            Everly
          </strong>
        </div>

        <nav className="dashboard-nav">

          <button
            className="dashboard-nav-item"
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>⌂</span>
            Home
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
            onClick={() =>
              navigate("/our-time")
            }
          >
            <span>⏱</span>
            Our Time
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
            onClick={() =>
              navigate("/our-story")
            }
          >
            <span>♡</span>
            Our Story
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
            onClick={() =>
              navigate("/memories")
            }
          >
            <span>▣</span>
            Memories
          </button>

        </nav>

        <div className="dashboard-sidebar-bottom">

          <button
            className="dashboard-nav-item active"
            type="button"
            onClick={() =>
              navigate("/settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>

          <button
            className="dashboard-logout"
            type="button"
            onClick={
              handleLogout
            }
          >
            <span>↪</span>
            Log out
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <p className="dashboard-eyebrow">
              EVERLY SETTINGS
            </p>

            <h1>
              Settings
            </h1>

            <p className="dashboard-subtitle">
              Manage your Everly account and
              preferences.
            </p>

          </div>

          <div className="dashboard-avatar">
            {(profile?.display_name ||
              user?.email ||
              "U")
              .charAt(0)
              .toUpperCase()}
          </div>

        </header>

        {/* ===================================================
            PROFILE
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              ◉
            </div>

            <div>
              <p>
                PROFILE
              </p>

              <h2>
                Your profile
              </h2>

              <span>
                Update the name shown
                throughout Everly.
              </span>
            </div>

          </div>

          <form
            className="settings-form"
            onSubmit={
              handleSaveProfile
            }
          >

            <div className="settings-field">

              <label>
                Display name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value
                  )
                }
                placeholder="Your name"
              />

            </div>

            <div className="settings-field">

              <label>
                Email address
              </label>

              <input
                type="email"
                value={
                  user?.email || ""
                }
                disabled
              />

              <small>
                Your email address is
                managed by your Everly
                account.
              </small>

            </div>

            <button
              type="submit"
              className="settings-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </form>

        </section>

        {/* ===================================================
            ACCOUNT
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              🔒
            </div>

            <div>
              <p>
                ACCOUNT SECURITY
              </p>

              <h2>
                Security
              </h2>

              <span>
                Manage access to your
                Everly account.
              </span>
            </div>

          </div>

          <div className="settings-option">

            <div>

              <strong>
                Reset password
              </strong>

              <p>
                Receive a password reset
                email for your account.
              </p>

            </div>

            <button
              type="button"
              className="settings-secondary-button"
              onClick={
                handlePasswordReset
              }
            >
              Reset Password
            </button>

          </div>

        </section>

        {/* ===================================================
            ABOUT
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              ♥
            </div>

            <div>
              <p>
                ABOUT EVERLY
              </p>

              <h2>
                Every moment, together.
              </h2>

              <span>
                Everly helps you keep track
                of the moments that matter.
              </span>
            </div>

          </div>

          <div className="settings-about">

            <div>
              <span>
                Application
              </span>

              <strong>
                Everly
              </strong>
            </div>

            <div>
              <span>
                Version
              </span>

              <strong>
                1.0
              </strong>
            </div>

          </div>

        </section>

        {/* ===================================================
            MESSAGE
        =================================================== */}

        {message && (
          <div className="settings-message">
            {message}
          </div>
        )}

        {/* ===================================================
            LOGOUT
        =================================================== */}

        <section className="settings-danger-card">

          <div>

            <p>
              ACCOUNT
            </p>

            <h2>
              Sign out
            </h2>

            <span>
              Sign out of your Everly
              account on this device.
            </span>

          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
          >
            Log out
          </button>

        </section>

      </main>

    </div>
  );
}

export default Settings;