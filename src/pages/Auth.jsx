import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

function Auth() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  // ==========================================
  // INVITE TOKEN
  // ==========================================

  const getInviteToken = () => {
    return sessionStorage.getItem(
      "everly_invite_token"
    );
  };

  // ==========================================
  // ROUTE USER AFTER LOGIN
  // ==========================================

  const routeUser = async (currentUser) => {
    try {
      if (!currentUser) {
        navigate("/auth", {
          replace: true,
        });

        return;
      }

      // ========================================
      // INVITATION HAS PRIORITY
      // ========================================

      const inviteToken =
        getInviteToken();

      if (inviteToken) {
        navigate(
          `/invite/${inviteToken}`,
          {
            replace: true,
          }
        );

        return;
      }

      // ========================================
      // CHECK CONNECTED RELATIONSHIP
      // ========================================
      // If this user accepted an invitation,
      // they already belong to a relationship.

      const {
        data: connectedRelationships,
        error: connectedError,
      } = await supabase
        .from("relationships")
        .select("*")
        .eq("user_two_id", currentUser.id)
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (connectedError) {
        throw connectedError;
      }

      if (
        connectedRelationships &&
        connectedRelationships.length > 0
      ) {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      // ========================================
      // CHECK COMPLETED OWN RELATIONSHIP
      // ========================================
      // IMPORTANT:
      // We only consider a relationship completed
      // when partner_name has been saved.

      const {
        data: completedRelationships,
        error: completedError,
      } = await supabase
        .from("relationships")
        .select("*")
        .eq(
          "user_one_id",
          currentUser.id
        )
        .eq("status", "active")
        .not(
          "partner_name",
          "is",
          null
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (completedError) {
        throw completedError;
      }

      if (
        completedRelationships &&
        completedRelationships.length > 0
      ) {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      // ========================================
      // USER HAS NOT COMPLETED ONBOARDING
      // ========================================

      navigate("/onboarding", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Routing error:",
        error
      );

      setMessage(
        error.message ||
          "Something went wrong."
      );
    }
  };

  // ==========================================
  // CHECK EXISTING SESSION
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (
        !mounted ||
        !session?.user
      ) {
        return;
      }

      await routeUser(
        session.user
      );
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================
  // EMAIL LOGIN / SIGNUP
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      // ========================================
      // LOGIN
      // ========================================

      if (isLogin) {
        const {
          data,
          error,
        } =
          await supabase.auth.signInWithPassword(
            {
              email,
              password,
            }
          );

        if (error) {
          throw error;
        }

        await routeUser(
          data.user
        );

        return;
      }

      // ========================================
      // SIGNUP
      // ========================================

      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // ========================================
      // EMAIL CONFIRMATION
      // ========================================

      if (!data.session) {
        setMessage(
          "Account created ❤️ Please check your email to confirm your account."
        );

        return;
      }

      await routeUser(
        data.user
      );
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      setMessage(
        error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GOOGLE LOGIN
  // ==========================================

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        error,
      } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "google",

            options: {
              redirectTo:
                `${window.location.origin}/auth`,
            },
          }
        );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      setMessage(
        error.message ||
          "Google login failed."
      );

      setLoading(false);
    }
  };

  // ==========================================
  // SWITCH LOGIN / SIGNUP
  // ==========================================

  const switchMode = () => {
    setMode(
      isLogin
        ? "signup"
        : "login"
    );

    setMessage("");
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          <span>♥</span>
          <strong>Everly</strong>
        </div>

        <div className="auth-heading">

          <h1>
            {isLogin
              ? "Welcome back"
              : "Create your Everly"}
          </h1>

          <p>
            {isLogin
              ? "Continue your story together."
              : "Start your relationship story."}
          </p>

        </div>

        {/* GOOGLE */}

        <button
          type="button"
          className="google-button"
          onClick={
            handleGoogleLogin
          }
          disabled={loading}
        >
          <span className="google-icon">
            G
          </span>

          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          <div className="auth-field">

            <label>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="you@example.com"
              required
            />

          </div>

          <div className="auth-field">

            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Enter your password"
              minLength={6}
              required
            />

          </div>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Log in"
              : "Create Account"}
          </button>

        </form>

        <div className="auth-switch">

          <span>
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <button
            type="button"
            onClick={switchMode}
          >
            {isLogin
              ? "Create one"
              : "Log in"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default Auth;