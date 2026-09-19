import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

function Invite() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInvite = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        const { data, error: inviteError } = await supabase.rpc(
          "get_everly_invite",
          {
            invite_token: token,
          }
        );

        if (inviteError) throw inviteError;

        if (!data?.valid) {
          setError(
            data?.message ||
              "This invitation doesn't exist or is no longer available."
          );
          return;
        }

        setInvite(data);
      } catch (err) {
        console.error("Invite loading error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadInvite();
    }
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      sessionStorage.setItem("everly_invite_token", token);
      navigate("/auth");
      return;
    }

    try {
      setAccepting(true);
      setError("");

      const { data, error: acceptError } = await supabase.rpc(
        "accept_everly_invite",
        {
          invite_token: token,
        }
      );

      if (acceptError) throw acceptError;

      console.log("Invitation accepted:", data);

      sessionStorage.removeItem("everly_invite_token");

      navigate("/dashboard");
    } catch (err) {
      console.error("Invitation acceptance error:", err);
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-heart">♥</div>

          <h1>Loading invitation...</h1>

          <p>
            Please wait while Everly prepares your invitation.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-heart">♥</div>

          <h1>Invitation unavailable</h1>

          <p className="invite-error">{error}</p>

          <button
            className="invite-secondary-button"
            onClick={() => navigate("/")}
          >
            Go to Everly
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-card">

        <div className="invite-logo">
          <span>♥</span>
          <strong>Everly</strong>
        </div>

        <div className="invite-heart">♥</div>

        <p className="invite-eyebrow">
          YOU'VE BEEN INVITED
        </p>

        <h1>
          Join {invite?.inviter_name}'s Everly story
        </h1>

        <p className="invite-description">
          You've been invited to connect your relationship
          on Everly and build your story together.
        </p>

        <button
          className="invite-accept-button"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting
            ? "Joining Everly..."
            : user
            ? "Accept Invitation ❤️"
            : "Log in to Join ❤️"}
        </button>

        <p className="invite-note">
          Your relationship story, memories and important
          moments will be shared privately between the two
          accounts.
        </p>

      </div>
    </div>
  );
}

export default Invite;