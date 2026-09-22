import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [relationship, setRelationship] = useState(null);

  const [time, setTime] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // EDIT DISPLAY NAME
  // =========================================================

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  // =========================================================
  // INVITATION
  // =========================================================

  const [inviting, setInviting] = useState(false);
  const [inviteCreated, setInviteCreated] = useState(false);

  // =========================================================
  // MUTUAL ENDING SYSTEM
  // =========================================================

  const [endRequest, setEndRequest] = useState(null);
  const [requestingEnd, setRequestingEnd] = useState(false);
  const [respondingEnd, setRespondingEnd] = useState(false);
  const [cancellingEnd, setCancellingEnd] = useState(false);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        // =====================================================
        // CURRENT USER
        // =====================================================

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

        // =====================================================
        // MY PROFILE
        // =====================================================

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

        if (!mounted) {
          return;
        }

        setProfile(profileRows?.[0] || null);

        // =====================================================
        // FIND RELATIONSHIP
        // =====================================================

        let selectedRelationship = null;

        // =====================================================
        // 1. ACTIVE CONNECTED RELATIONSHIP
        // =====================================================

        const {
          data: activeConnectedRelationships,
          error: activeConnectedError,
        } = await supabase
          .from("relationships")
          .select("*")
          .eq("user_two_id", currentUser.id)
          .eq("status", "active")
          .order("created_at", {
            ascending: false,
          })
          .limit(1);

        if (activeConnectedError) {
          throw activeConnectedError;
        }

        if (
          activeConnectedRelationships &&
          activeConnectedRelationships.length > 0
        ) {
          selectedRelationship =
            activeConnectedRelationships[0];
        }

        // =====================================================
        // 2. ACTIVE OWN RELATIONSHIP
        // =====================================================

        if (!selectedRelationship) {
          const {
            data: activeOwnRelationships,
            error: activeOwnError,
          } = await supabase
            .from("relationships")
            .select("*")
            .eq("user_one_id", currentUser.id)
            .eq("status", "active")
            .not("partner_name", "is", null)
            .order("created_at", {
              ascending: false,
            })
            .limit(1);

          if (activeOwnError) {
            throw activeOwnError;
          }

          if (
            activeOwnRelationships &&
            activeOwnRelationships.length > 0
          ) {
            selectedRelationship =
              activeOwnRelationships[0];
          }
        }

        // =====================================================
        // 3. LATEST ENDED CONNECTED RELATIONSHIP
        // =====================================================

        if (!selectedRelationship) {
          const {
            data: endedConnectedRelationships,
            error: endedConnectedError,
          } = await supabase
            .from("relationships")
            .select("*")
            .eq("user_two_id", currentUser.id)
            .eq("status", "ended")
            .order("ended_at", {
              ascending: false,
            })
            .limit(1);

          if (endedConnectedError) {
            throw endedConnectedError;
          }

          if (
            endedConnectedRelationships &&
            endedConnectedRelationships.length > 0
          ) {
            selectedRelationship =
              endedConnectedRelationships[0];
          }
        }

        // =====================================================
        // 4. LATEST ENDED OWN RELATIONSHIP
        // =====================================================

        if (!selectedRelationship) {
          const {
            data: endedOwnRelationships,
            error: endedOwnError,
          } = await supabase
            .from("relationships")
            .select("*")
            .eq("user_one_id", currentUser.id)
            .eq("status", "ended")
            .not("partner_name", "is", null)
            .order("ended_at", {
              ascending: false,
            })
            .limit(1);

          if (endedOwnError) {
            throw endedOwnError;
          }

          if (
            endedOwnRelationships &&
            endedOwnRelationships.length > 0
          ) {
            selectedRelationship =
              endedOwnRelationships[0];
          }
        }

        // =====================================================
        // NO RELATIONSHIP
        // =====================================================

        if (!selectedRelationship) {
          navigate("/onboarding?new=true", {
            replace: true,
          });

          return;
        }

        if (!mounted) {
          return;
        }

        setRelationship(selectedRelationship);

        // =====================================================
        // LOAD PENDING END REQUEST
        // =====================================================

        if (selectedRelationship.status === "active") {
          const {
            data: pendingRequests,
            error: pendingRequestError,
          } = await supabase
            .from("relationship_end_requests")
            .select("*")
            .eq(
              "relationship_id",
              selectedRelationship.id
            )
            .eq("status", "pending")
            .order("created_at", {
              ascending: false,
            })
            .limit(1);

          if (pendingRequestError) {
            throw pendingRequestError;
          }

          if (!mounted) {
            return;
          }

          setEndRequest(
            pendingRequests?.[0] || null
          );
        } else {
          setEndRequest(null);
        }

        // =====================================================
        // GET PARTNER PROFILE
        // =====================================================

        const partnerId =
          selectedRelationship.user_one_id ===
          currentUser.id
            ? selectedRelationship.user_two_id
            : selectedRelationship.user_one_id;

        if (partnerId) {
          const {
            data: partnerRows,
            error: partnerError,
          } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", partnerId)
            .limit(1);

          if (partnerError) {
            throw partnerError;
          }

          if (!mounted) {
            return;
          }

          setPartnerProfile(
            partnerRows?.[0] || null
          );
        } else {
          setPartnerProfile(null);
        }
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        if (!mounted) {
          return;
        }

        if (
          err?.name ===
            "AuthSessionMissingError" ||
          err?.message?.includes(
            "Auth session missing"
          ) ||
          err?.message?.includes(
            "User from sub claim in JWT does not exist"
          )
        ) {
          await supabase.auth.signOut();

          navigate("/auth", {
            replace: true,
          });

          return;
        }

        setError(
          err?.message ||
            "Something went wrong while loading your Everly dashboard."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================================================
  // LIVE RELATIONSHIP / END REQUEST SYNC
  // =========================================================

  useEffect(() => {
    if (!relationship?.id) {
      return;
    }

    let mounted = true;

    const syncRelationshipState = async () => {
      try {
        const {
          data: relationshipRows,
          error: relationshipError,
        } = await supabase
          .from("relationships")
          .select("*")
          .eq("id", relationship.id)
          .limit(1);

        if (relationshipError) {
          console.error(
            "Relationship sync error:",
            relationshipError
          );

          return;
        }

        if (!mounted) {
          return;
        }

        const latestRelationship =
          relationshipRows?.[0] || null;

        if (!latestRelationship) {
          return;
        }

        setRelationship((current) => {
          if (!current) {
            return latestRelationship;
          }

          return {
            ...current,
            ...latestRelationship,
          };
        });

        if (
          latestRelationship.status === "ended" ||
          latestRelationship.ended_at
        ) {
          setEndRequest(null);
          return;
        }

        const {
          data: pendingRequests,
          error: pendingError,
        } = await supabase
          .from("relationship_end_requests")
          .select("*")
          .eq(
            "relationship_id",
            latestRelationship.id
          )
          .eq("status", "pending")
          .order("created_at", {
            ascending: false,
          })
          .limit(1);

        if (pendingError) {
          console.error(
            "End request sync error:",
            pendingError
          );

          return;
        }

        if (!mounted) {
          return;
        }

        setEndRequest(
          pendingRequests?.[0] || null
        );
      } catch (error) {
        console.error(
          "Live relationship sync error:",
          error
        );
      }
    };

    syncRelationshipState();

    const interval = setInterval(
      syncRelationshipState,
      2000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [relationship?.id]);

  // =========================================================
  // CALCULATE RELATIONSHIP TIME
  // =========================================================

  useEffect(() => {
    if (!relationship?.started_at) {
      return;
    }

    const calculateTime = () => {
      const start = new Date(
        relationship.started_at
      );

      const end = relationship.ended_at
        ? new Date(
            relationship.ended_at
          )
        : new Date();

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return;
      }

      if (end < start) {
        setTime({
          years: 0,
          months: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        return;
      }

      let years =
        end.getFullYear() -
        start.getFullYear();

      let anniversary = new Date(start);

      anniversary.setFullYear(
        start.getFullYear() + years
      );

      if (anniversary > end) {
        years--;

        anniversary = new Date(start);

        anniversary.setFullYear(
          start.getFullYear() + years
        );
      }

      let months =
        end.getMonth() -
        anniversary.getMonth();

      if (months < 0) {
        months += 12;
      }

      let monthPoint =
        new Date(anniversary);

      monthPoint.setMonth(
        anniversary.getMonth() + months
      );

      if (monthPoint > end) {
        months--;

        monthPoint = new Date(
          anniversary
        );

        monthPoint.setMonth(
          anniversary.getMonth() + months
        );
      }

      const remainingMs =
        end - monthPoint;

      const days = Math.floor(
        remainingMs /
          (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (remainingMs /
          (1000 * 60 * 60)) %
          24
      );

      const minutes = Math.floor(
        (remainingMs /
          (1000 * 60)) %
          60
      );

      const seconds = Math.floor(
        (remainingMs / 1000) % 60
      );

      setTime({
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
      });
    };

    calculateTime();

    if (relationship.ended_at) {
      return;
    }

    const interval = setInterval(
      calculateTime,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [relationship]);

  // =========================================================
  // CREATE PARTNER INVITATION
  // =========================================================

  const handleInvitePartner =
    async () => {
      try {
        if (!relationship?.id) {
          alert(
            "We couldn't find your relationship."
          );
          return;
        }

        if (!user?.id) {
          alert(
            "We couldn't find your account."
          );
          return;
        }

        if (relationship.user_two_id) {
          alert(
            "Your partner is already connected to Everly. ❤️"
          );
          return;
        }

        if (
          relationship.status === "ended" ||
          relationship.ended_at
        ) {
          alert(
            "This relationship has ended, so a new invitation cannot be created."
          );
          return;
        }

        setInviting(true);
        setInviteCreated(false);

        const {
          data,
          error: inviteError,
        } = await supabase
          .from("relationship_invites")
          .insert({
            relationship_id:
              relationship.id,
            invited_by: user.id,
          })
          .select("token")
          .limit(1);

        if (inviteError) {
          throw inviteError;
        }

        const token =
          data?.[0]?.token;

        if (!token) {
          throw new Error(
            "The invitation token could not be created."
          );
        }

        const inviteLink =
          `${window.location.origin}/invite/${token}`;

        console.log(
          "Everly invitation link:",
          inviteLink
        );

        try {
          await navigator.clipboard.writeText(
            inviteLink
          );
        } catch (clipboardError) {
          console.warn(
            "Could not copy invitation link:",
            clipboardError
          );
        }

        setInviteCreated(true);

        alert(
          "Invitation link created! ❤️\n\n" +
            "The link has been copied to your clipboard.\n\n" +
            "Send it to your partner."
        );
      } catch (err) {
        console.error(
          "Invitation error:",
          err
        );

        alert(
          "Could not create invitation:\n\n" +
            (err?.message ||
              "Unknown error")
        );
      } finally {
        setInviting(false);
      }
    };

  // =========================================================
  // REQUEST TO END RELATIONSHIP
  // =========================================================

  const handleEndRelationship =
    async () => {
      if (!relationship?.id) {
        alert(
          "We couldn't find your relationship."
        );
        return;
      }

      if (
        relationship.status !== "active"
      ) {
        return;
      }

      if (!relationship.user_two_id) {
        alert(
          "Your partner has not connected to this Everly story yet."
        );
        return;
      }

      if (endRequest) {
        alert(
          "There is already a pending end request. You can respond to it below."
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Request to end this relationship?\n\n" +
            "Your relationship will NOT end yet. " +
            "Your partner must agree first."
        );

      if (!confirmed) {
        return;
      }

      try {
        setRequestingEnd(true);

        const {
          data,
          error: requestError,
        } = await supabase.rpc(
          "request_everly_relationship_end",
          {
            p_relationship_id:
              relationship.id,
          }
        );

        if (requestError) {
          if (
            requestError.message?.includes(
              "already a pending end request"
            )
          ) {
            const {
              data: pendingRequests,
              error: pendingError,
            } = await supabase
              .from(
                "relationship_end_requests"
              )
              .select("*")
              .eq(
                "relationship_id",
                relationship.id
              )
              .eq(
                "status",
                "pending"
              )
              .order("created_at", {
                ascending: false,
              })
              .limit(1);

            if (pendingError) {
              throw pendingError;
            }

            setEndRequest(
              pendingRequests?.[0] ||
                null
            );

            alert(
              "There is already a pending request from your partner. You can now review it."
            );

            return;
          }

          throw requestError;
        }

        console.log(
          "End request created:",
          data
        );

        const {
          data: pendingRequests,
          error: pendingRequestError,
        } = await supabase
          .from(
            "relationship_end_requests"
          )
          .select("*")
          .eq(
            "relationship_id",
            relationship.id
          )
          .eq(
            "status",
            "pending"
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(1);

        if (pendingRequestError) {
          throw pendingRequestError;
        }

        setEndRequest(
          pendingRequests?.[0] || null
        );

        alert(
          "Your request has been sent.\n\n" +
            "The relationship will only end after your partner agrees."
        );
      } catch (err) {
        console.error(
          "End request error:",
          err
        );

        alert(
          "Could not send the request:\n\n" +
            (err?.message ||
              "Unknown error")
        );
      } finally {
        setRequestingEnd(false);
      }
    };

  // =========================================================
  // RESPOND TO END REQUEST
  // =========================================================

  const handleEndRequestResponse =
    async (approve) => {
      if (!endRequest?.id) {
        return;
      }

      try {
        setRespondingEnd(true);

        const {
          data,
          error: responseError,
        } = await supabase.rpc(
          "respond_everly_relationship_end",
          {
            p_request_id:
              endRequest.id,
            p_approve_request:
              approve,
          }
        );

        if (responseError) {
          throw responseError;
        }

        console.log(
          "End request response:",
          data
        );

        if (approve) {
          const endedAt =
            data?.ended_at ||
            new Date().toISOString();

          setRelationship(
            (current) => ({
              ...current,
              status: "ended",
              ended_at: endedAt,
            })
          );

          setEndRequest(null);

          alert(
            "Both partners agreed. The relationship has now ended and the timer is frozen."
          );

          return;
        }

        setEndRequest(null);

        alert(
          "The ending request was declined. Your relationship remains active."
        );
      } catch (err) {
        console.error(
          "End request response error:",
          err
        );

        alert(
          "Could not process the request:\n\n" +
            (err?.message ||
              "Unknown error")
        );
      } finally {
        setRespondingEnd(false);
      }
    };

  // =========================================================
  // CANCEL END REQUEST
  // =========================================================

  const handleCancelEndRequest =
    async () => {
      if (!endRequest?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          "Cancel your request to end the relationship?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setCancellingEnd(true);

        const {
          error: cancelError,
        } = await supabase.rpc(
          "cancel_everly_relationship_end",
          {
            p_request_id:
              endRequest.id,
          }
        );

        if (cancelError) {
          throw cancelError;
        }

        setEndRequest(null);

        alert(
          "Your request has been cancelled."
        );
      } catch (err) {
        console.error(
          "Cancel request error:",
          err
        );

        alert(
          "Could not cancel the request:\n\n" +
            (err?.message ||
              "Unknown error")
        );
      } finally {
        setCancellingEnd(false);
      }
    };

  // =========================================================
  // START NEW RELATIONSHIP
  // =========================================================

  const handleStartNewRelationship =
    () => {
      navigate(
        "/onboarding?new=true",
        {
          replace: true,
        }
      );
    };

  // =========================================================
  // EDIT DISPLAY NAME
  // =========================================================

  const handleEditName = () => {
    setNameDraft(profile?.display_name || "");
    setEditingName(true);
  };

  const handleCancelEditName = () => {
    setNameDraft(profile?.display_name || "");
    setEditingName(false);
  };

  const handleSaveName = async () => {
    const trimmedName = nameDraft.trim();

    if (!trimmedName) {
      alert("Please enter your name.");
      return;
    }

    if (!user?.id) {
      alert("We couldn't find your account.");
      return;
    }

    try {
      setSavingName(true);

      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          display_name: trimmedName,
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(updatedProfile);
      setNameDraft(updatedProfile?.display_name || trimmedName);
      setEditingName(false);
    } catch (err) {
      console.error("Name update error:", err);

      alert(
        "Could not update your name:\n\n" +
          (err?.message || "Unknown error")
      );
    } finally {
      setSavingName(false);
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
  // FORMAT NUMBERS
  // =========================================================

  const formatNumber = (number) =>
    String(number).padStart(2, "0");

  // =========================================================
  // NAMES
  // =========================================================

  const myName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    "You";

  const partnerName =
    partnerProfile?.display_name ||
    relationship?.partner_name ||
    "Your Partner";

  // =========================================================
  // RELATIONSHIP STATUS
  // =========================================================

  const relationshipEnded =
    relationship?.status === "ended" ||
    Boolean(relationship?.ended_at);

  const hasPendingEndRequest =
    Boolean(endRequest);

  const myEndRequest =
    endRequest &&
    user &&
    endRequest.requested_by ===
      user.id;

  const partnerEndRequest =
    endRequest &&
    user &&
    endRequest.requested_by !==
      user.id;

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
          Loading your story...
        </p>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-error">
          <div className="dashboard-loader-heart">
            ♥
          </div>

          <h2>
            Something went wrong
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/auth", {
                replace: true,
              })
            }
          >
            Return to Everly
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
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
            className="dashboard-nav-item active"
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
            className="dashboard-nav-item"
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
              YOUR STORY
            </p>

            <h1 className="dashboard-welcome-title">
              Welcome back,{" "}

              {!editingName ? (
                <>
                  <span className="dashboard-name">
                    {myName}
                  </span>

                  <button
                    type="button"
                    className="dashboard-edit-name-button"
                    onClick={handleEditName}
                    aria-label="Edit your name"
                    title="Edit your name"
                  >
                    ✎
                  </button>
                </>
              ) : (
                <span className="dashboard-name-editor">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(event) =>
                      setNameDraft(event.target.value)
                    }
                    className="dashboard-name-input"
                    maxLength={50}
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSaveName();
                      }

                      if (event.key === "Escape") {
                        handleCancelEditName();
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="dashboard-name-save"
                    onClick={handleSaveName}
                    disabled={savingName}
                    aria-label="Save name"
                    title="Save name"
                  >
                    {savingName ? "..." : "✓"}
                  </button>

                  <button
                    type="button"
                    className="dashboard-name-cancel"
                    onClick={handleCancelEditName}
                    disabled={savingName}
                    aria-label="Cancel editing"
                    title="Cancel"
                  >
                    ×
                  </button>
                </span>
              )}
            </h1>

            <p className="dashboard-subtitle">
              Every moment, together.
            </p>

          </div>

          <div className="dashboard-avatar">
            {myName
              .charAt(0)
              .toUpperCase()}
          </div>

        </header>

        {/* ===================================================
            COUPLE NAMES
        =================================================== */}

        <section className="couple-names-card">

          <div className="couple-person">

            <div className="couple-avatar">
              {myName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <span>
                You
              </span>

              <strong>
                {myName}
              </strong>

            </div>

          </div>

          <div className="couple-heart">
            ♥
          </div>

          <div className="couple-person">

            <div className="couple-avatar">
              {partnerName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <span>
                Partner
              </span>

              <strong>
                {partnerName}
              </strong>

            </div>

          </div>

        </section>

        {/* ===================================================
            INVITE PARTNER
        =================================================== */}

        {!relationship.user_two_id &&
          !relationshipEnded &&
          !hasPendingEndRequest && (
            <div className="partner-invite-card">

              <div>

                <span className="partner-invite-icon">
                  ♡
                </span>

                <div>

                  <h3>
                    Invite your partner
                  </h3>

                  <p>
                    Connect your partner to
                    your Everly story and
                    experience it together.
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="partner-invite-button"
                onClick={
                  handleInvitePartner
                }
                disabled={inviting}
              >
                {inviting
                  ? "Creating..."
                  : inviteCreated
                  ? "Invite Created ✓"
                  : "Invite Partner"}

                <span>
                  →
                </span>
              </button>

            </div>
          )}

        {/* ===================================================
            MY END REQUEST
        =================================================== */}

        {relationship.status ===
          "active" &&
          myEndRequest && (
            <div className="end-request-card">

              <div className="end-request-icon">
                ⏳
              </div>

              <div className="end-request-content">

                <h3>
                  Waiting for your partner
                </h3>

                <p>
                  You requested to end this
                  relationship. The timer will
                  continue until your partner
                  agrees.
                </p>

              </div>

              <button
                type="button"
                className="end-request-cancel"
                onClick={
                  handleCancelEndRequest
                }
                disabled={
                  cancellingEnd
                }
              >
                {cancellingEnd
                  ? "Cancelling..."
                  : "Cancel Request"}
              </button>

            </div>
          )}

        {/* ===================================================
            PARTNER END REQUEST
        =================================================== */}

        {relationship.status ===
          "active" &&
          partnerEndRequest && (
            <div className="end-request-card">

              <div className="end-request-icon">
                !
              </div>

              <div className="end-request-content">

                <h3>
                  Your partner wants to end
                  the relationship
                </h3>

                <p>
                  The relationship will only
                  end if you both agree.
                </p>

              </div>

              <div className="end-request-actions">

                <button
                  type="button"
                  className="keep-relationship-button"
                  onClick={() =>
                    handleEndRequestResponse(
                      false
                    )
                  }
                  disabled={
                    respondingEnd
                  }
                >
                  Keep Relationship
                </button>

                <button
                  type="button"
                  className="confirm-end-button"
                  onClick={() =>
                    handleEndRequestResponse(
                      true
                    )
                  }
                  disabled={
                    respondingEnd
                  }
                >
                  {respondingEnd
                    ? "Processing..."
                    : "Agree to End"}
                </button>

              </div>

            </div>
          )}

        {/* ===================================================
            ENDED STORY
        =================================================== */}

        {relationshipEnded && (
          <div className="partner-invite-card">

            <div>

              <span className="partner-invite-icon">
                ♥
              </span>

              <div>

                <h3>
                  This chapter has ended
                </h3>

                <p>
                  Your Everly story has been
                  preserved. The timer is
                  frozen at the moment your
                  relationship ended.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="partner-invite-button"
              onClick={
                handleStartNewRelationship
              }
            >
              Start New Relationship

              <span>
                →
              </span>

            </button>

          </div>
        )}

        {/* ===================================================
            TIMER
        =================================================== */}

        <section className="timer-card">

          <div className="timer-heart">
            ♥
          </div>

          <p className="timer-label">
            TOGETHER FOR
          </p>

          <div className="timer-values">

            <div className="timer-unit">
              <strong>
                {time.years}
              </strong>

              <span>
                {time.years === 1
                  ? "Year"
                  : "Years"}
              </span>
            </div>

            <div className="timer-separator">
              :
            </div>

            <div className="timer-unit">
              <strong>
                {time.months}
              </strong>

              <span>
                {time.months === 1
                  ? "Month"
                  : "Months"}
              </span>
            </div>

            <div className="timer-separator">
              :
            </div>

            <div className="timer-unit">
              <strong>
                {time.days}
              </strong>

              <span>
                {time.days === 1
                  ? "Day"
                  : "Days"}
              </span>
            </div>

          </div>

          <div className="timer-small-values">

            <div>
              <strong>
                {formatNumber(
                  time.hours
                )}
              </strong>

              <span>
                Hours
              </span>
            </div>

            <div>
              <strong>
                {formatNumber(
                  time.minutes
                )}
              </strong>

              <span>
                Minutes
              </span>
            </div>

            <div>
              <strong>
                {formatNumber(
                  time.seconds
                )}
              </strong>

              <span>
                Seconds
              </span>
            </div>

          </div>

          <p className="timer-started">
            Your story began{" "}
            {new Date(
              relationship.started_at
            ).toLocaleDateString(
              undefined,
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
          </p>

          <button
            type="button"
            className="our-time-dashboard-button"
            onClick={() =>
              navigate("/our-time")
            }
          >
            Open Our Time →
          </button>

          {relationship.status ===
            "active" &&
            relationship.user_two_id &&
            !endRequest && (
              <button
                type="button"
                className="end-relationship-button"
                onClick={
                  handleEndRelationship
                }
                disabled={
                  requestingEnd
                }
              >
                {requestingEnd
                  ? "Sending Request..."
                  : "Request to End Relationship"}
              </button>
            )}

        </section>

        {/* ===================================================
            QUICK SECTIONS
        =================================================== */}

        <section className="dashboard-grid">

          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() =>
              navigate("/our-time")
            }
          >
            <div className="feature-card-icon">
              ⏱
            </div>

            <div>
              <h3>
                Our Time
              </h3>

              <p>
                See every second of your
                journey together.
              </p>
            </div>

            <span>
              →
            </span>
          </button>

          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() =>
              navigate("/our-story")
            }
          >
            <div className="feature-card-icon">
              ♡
            </div>

            <div>
              <h3>
                Our Story
              </h3>

              <p>
                Build your relationship
                timeline together.
              </p>
            </div>

            <span>
              →
            </span>
          </button>

          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() =>
              navigate("/memories")
            }
          >
            <div className="feature-card-icon">
              ▣
            </div>

            <div>
              <h3>
                Memories
              </h3>

              <p>
                Keep the moments you
                never want to forget.
              </p>
            </div>

            <span>
              →
            </span>
          </button>

          <div className="dashboard-feature-card">
            <div className="feature-card-icon">
              ◷
            </div>

            <div>
              <h3>
                Important Dates
              </h3>

              <p>
                Never forget the moments
                that matter.
              </p>
            </div>

            <span>
              →
            </span>
          </div>

          <div className="dashboard-feature-card">
            <div className="feature-card-icon">
              ✉
            </div>

            <div>
              <h3>
                Love Notes
              </h3>

              <p>
                Leave something special
                for your partner.
              </p>
            </div>

            <span>
              →
            </span>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
