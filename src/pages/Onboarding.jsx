import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

function Onboarding() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);

  const [displayName, setDisplayName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [startedAt, setStartedAt] = useState("");

  const [startOption, setStartOption] = useState("today");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // =========================================================
  // GET TODAY'S DATE + TIME
  // =========================================================

  const getTodayDateTime = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    const hours = String(
      now.getHours()
    ).padStart(2, "0");

    const minutes = String(
      now.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // =========================================================
  // LOAD USER + EXISTING DATA
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadOnboarding = async () => {
      try {
        setLoading(true);
        setMessage("");

        // =====================================================
        // CHECK AUTH SESSION
        // =====================================================

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        // No active session
        if (!session?.user) {
          navigate("/auth", {
            replace: true,
          });

          return;
        }

        const currentUser = session.user;

        if (!mounted) {
          return;
        }

        setUser(currentUser);

        // =====================================================
        // CHECK CONNECTED RELATIONSHIP
        // =====================================================

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

        // Already connected with a partner
        if (
          connectedRelationships &&
          connectedRelationships.length > 0
        ) {
          navigate("/dashboard", {
            replace: true,
          });

          return;
        }

        // =====================================================
        // CHECK MY OWN ACTIVE RELATIONSHIP
        // =====================================================

        const {
          data: ownRelationships,
          error: ownError,
        } = await supabase
          .from("relationships")
          .select("*")
          .eq(
            "user_one_id",
            currentUser.id
          )
          .eq("status", "active")
          .order("created_at", {
            ascending: false,
          })
          .limit(1);

        if (ownError) {
          throw ownError;
        }

        const existingRelationship =
          ownRelationships?.[0] || null;

        // =====================================================
        // ALREADY COMPLETED ONBOARDING
        // =====================================================

        if (
          existingRelationship?.partner_name &&
          existingRelationship?.started_at
        ) {
          navigate("/dashboard", {
            replace: true,
          });

          return;
        }

        // =====================================================
        // GET PROFILE
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

        const profile =
          profileRows?.[0] || null;

        setDisplayName(
          profile?.display_name ||
            currentUser.user_metadata?.full_name ||
            currentUser.email?.split("@")[0] ||
            ""
        );

        // =====================================================
        // PREFILL RELATIONSHIP
        // =====================================================

        if (existingRelationship) {
          setPartnerName(
            existingRelationship.partner_name ||
              ""
          );

          if (existingRelationship.started_at) {
            const date = new Date(
              existingRelationship.started_at
            );

            const year =
              date.getFullYear();

            const month = String(
              date.getMonth() + 1
            ).padStart(2, "0");

            const day = String(
              date.getDate()
            ).padStart(2, "0");

            const hours = String(
              date.getHours()
            ).padStart(2, "0");

            const minutes = String(
              date.getMinutes()
            ).padStart(2, "0");

            setStartedAt(
              `${year}-${month}-${day}T${hours}:${minutes}`
            );

            setStartOption("custom");
          } else {
            setStartedAt(
              getTodayDateTime()
            );

            setStartOption("today");
          }
        } else {
          setStartedAt(
            getTodayDateTime()
          );

          setStartOption("today");
        }
      } catch (error) {
        console.error(
          "Onboarding loading error:",
          error
        );

        // =====================================================
        // SESSION EXPIRED / MISSING
        // =====================================================

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

        if (mounted) {
          setMessage(
            error?.message ||
              "Something went wrong while preparing your Everly story."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOnboarding();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================================================
  // NEXT STEP
  // =========================================================

  const handleNext = () => {
    setMessage("");

    if (step === 1) {
      if (!displayName.trim()) {
        setMessage(
          "Please enter your name."
        );

        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!partnerName.trim()) {
        setMessage(
          "Please enter your partner's name."
        );

        return;
      }

      setStep(3);
      return;
    }

    if (step === 3) {
      handleFinish();
    }
  };

  // =========================================================
  // BACK
  // =========================================================

  const handleBack = () => {
    setMessage("");

    if (step <= 1) {
      return;
    }

    setStep(step - 1);
  };

  // =========================================================
  // FINISH ONBOARDING
  // =========================================================

  const handleFinish = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      // =====================================================
      // GET CURRENT SESSION AGAIN
      // =====================================================

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        await supabase.auth.signOut();

        navigate("/auth", {
          replace: true,
        });

        return;
      }

      const currentUser = session.user;

      setUser(currentUser);

      // =====================================================
      // VALIDATION
      // =====================================================

      if (!displayName.trim()) {
        setStep(1);

        setMessage(
          "Please enter your name."
        );

        return;
      }

      if (!partnerName.trim()) {
        setStep(2);

        setMessage(
          "Please enter your partner's name."
        );

        return;
      }

      if (!startedAt) {
        setStep(3);

        setMessage(
          "Please choose when your story began."
        );

        return;
      }

      // =====================================================
      // SAVE PROFILE
      // =====================================================

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: currentUser.id,
            display_name:
              displayName.trim(),
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        throw profileError;
      }

      // =====================================================
      // FIND MY ACTIVE RELATIONSHIP
      // =====================================================

      const {
        data: ownRelationships,
        error: relationshipSearchError,
      } = await supabase
        .from("relationships")
        .select("*")
        .eq(
          "user_one_id",
          currentUser.id
        )
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (relationshipSearchError) {
        throw relationshipSearchError;
      }

      const existingRelationship =
        ownRelationships?.[0] || null;

      // =====================================================
      // ALREADY COMPLETED
      // =====================================================

      if (
        existingRelationship?.partner_name &&
        existingRelationship?.started_at
      ) {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      // =====================================================
      // VALIDATE START DATE
      // =====================================================

      const parsedStartDate =
        new Date(startedAt);

      if (
        Number.isNaN(
          parsedStartDate.getTime()
        )
      ) {
        throw new Error(
          "The relationship start date is invalid."
        );
      }

      const officialStartedAt =
        parsedStartDate.toISOString();

      const cleanDisplayName =
        displayName.trim();

      const cleanPartnerName =
        partnerName.trim();

      // =====================================================
      // SAVE RELATIONSHIP
      // =====================================================

      let relationshipId = null;

      // =====================================================
      // UPDATE EXISTING EMPTY RELATIONSHIP
      // =====================================================

      if (existingRelationship) {
        relationshipId =
          existingRelationship.id;

        const {
          data: updateRows,
          error: updateError,
        } = await supabase
          .from("relationships")
          .update({
            partner_name:
              cleanPartnerName,

            started_at:
              officialStartedAt,

            status: "active",
          })
          .eq(
            "id",
            relationshipId
          )
          .eq(
            "user_one_id",
            currentUser.id
          )
          .select(
            "id, user_one_id, user_two_id, partner_name, started_at, ended_at, status"
          );

        if (updateError) {
          throw updateError;
        }

        const updatedRelationship =
          updateRows?.[0] || null;

        if (!updatedRelationship) {
          throw new Error(
            "Everly could not update your relationship. Please check your relationship update policy in Supabase."
          );
        }

        console.log(
          "✅ Relationship updated:",
          updatedRelationship
        );
      }

      // =====================================================
      // CREATE NEW RELATIONSHIP
      // =====================================================

      else {
        relationshipId =
          crypto.randomUUID();

        const {
          error: insertError,
        } = await supabase
          .from("relationships")
          .insert({
            id: relationshipId,

            user_one_id:
              currentUser.id,

            user_two_id: null,

            started_at:
              officialStartedAt,

            partner_name:
              cleanPartnerName,

            status: "active",
          });

        if (insertError) {
          throw insertError;
        }

        console.log(
          "✅ New relationship created:",
          relationshipId
        );
      }

      // =====================================================
      // VERIFY RELATIONSHIP
      // =====================================================

      const {
        data: verifiedRows,
        error: verifyError,
      } = await supabase
        .from("relationships")
        .select(
          "id, user_one_id, user_two_id, partner_name, started_at, ended_at, status"
        )
        .eq(
          "id",
          relationshipId
        )
        .eq(
          "user_one_id",
          currentUser.id
        )
        .limit(1);

      if (verifyError) {
        throw verifyError;
      }

      const verifiedRelationship =
        verifiedRows?.[0] || null;

      // =====================================================
      // VERIFY SAVE
      // =====================================================

      if (!verifiedRelationship) {
        throw new Error(
          "Everly saved your relationship but could not read it back. Please check your Supabase SELECT policy."
        );
      }

      if (
        !verifiedRelationship.partner_name
      ) {
        throw new Error(
          "Your relationship was saved without your partner's name."
        );
      }

      if (
        !verifiedRelationship.started_at
      ) {
        throw new Error(
          "Your relationship was saved without a start date."
        );
      }

      if (
        verifiedRelationship.status !==
        "active"
      ) {
        throw new Error(
          "Your relationship was saved but is not active."
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      console.log(
        "✅ EVERLY ONBOARDING COMPLETE",
        {
          user: currentUser.id,
          relationship:
            verifiedRelationship.id,
          partner:
            verifiedRelationship.partner_name,
          started:
            verifiedRelationship.started_at,
        }
      );

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Onboarding save error:",
        error
      );

      // =====================================================
      // AUTH SESSION ERROR
      // =====================================================

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
          "Could not save your Everly story."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="onboarding-page">

        <div className="onboarding-card">

          <div className="onboarding-heart">
            ♥
          </div>

          <p>
            Preparing your Everly story...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="onboarding-page">

      <div className="onboarding-card">

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="onboarding-logo">

          <span>
            ♥
          </span>

          <strong>
            Everly
          </strong>

        </div>

        {/* =================================================
            HEART
        ================================================= */}

        <div className="onboarding-heart">
          ♥
        </div>

        {/* =================================================
            HEADING
        ================================================= */}

        <div className="onboarding-heading">

          <p className="onboarding-eyebrow">
            YOUR STORY
          </p>

          <h1>
            Let's begin your story
          </h1>

          <p>
            Just a few details to
            personalize Everly.
          </p>

        </div>

        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 1 && (
          <div className="onboarding-step">

            <label>
              What's your name?
            </label>

            <input
              type="text"
              value={displayName}
              onChange={(e) =>
                setDisplayName(
                  e.target.value
                )
              }
              placeholder="Your name"
              autoFocus
            />

          </div>
        )}

        {/* =================================================
            STEP 2
        ================================================= */}

        {step === 2 && (
          <div className="onboarding-step">

            <label>
              What's your partner's name?
            </label>

            <input
              type="text"
              value={partnerName}
              onChange={(e) =>
                setPartnerName(
                  e.target.value
                )
              }
              placeholder="Your partner's name"
              autoFocus
            />

          </div>
        )}

        {/* =================================================
            STEP 3
        ================================================= */}

        {step === 3 && (
          <div className="onboarding-step">

            <label>
              When did your story begin?
            </label>

            <div className="start-options">

              {/* TODAY */}

              <button
                type="button"
                className={
                  startOption ===
                  "today"
                    ? "start-option selected"
                    : "start-option"
                }
                onClick={() => {
                  setStartOption(
                    "today"
                  );

                  setStartedAt(
                    getTodayDateTime()
                  );
                }}
              >

                <div className="option-icon">
                  ♥
                </div>

                <div className="option-content">

                  <strong>
                    Today
                  </strong>

                  <span>
                    We started today
                  </span>

                </div>

                <div className="radio">

                  {startOption ===
                  "today"
                    ? "●"
                    : ""}

                </div>

              </button>

              {/* CUSTOM DATE */}

              <button
                type="button"
                className={
                  startOption ===
                  "custom"
                    ? "start-option selected"
                    : "start-option"
                }
                onClick={() => {
                  setStartOption(
                    "custom"
                  );

                  if (!startedAt) {
                    setStartedAt(
                      getTodayDateTime()
                    );
                  }
                }}
              >

                <div className="option-icon">
                  ◷
                </div>

                <div className="option-content">

                  <strong>
                    Choose a date
                  </strong>

                  <span>
                    We started earlier
                  </span>

                </div>

                <div className="radio">

                  {startOption ===
                  "custom"
                    ? "●"
                    : ""}

                </div>

              </button>

            </div>

            {/* DATE INPUT */}

            {startOption ===
              "custom" && (
              <div className="custom-date-section">

                <input
                  className="date-field"
                  type="datetime-local"
                  value={startedAt}
                  onChange={(e) =>
                    setStartedAt(
                      e.target.value
                    )
                  }
                />

              </div>
            )}

          </div>
        )}

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="onboarding-message">
            {message}
          </div>
        )}

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="onboarding-actions">

          {step > 1 && (
            <button
              type="button"
              className="onboarding-back"
              onClick={
                handleBack
              }
              disabled={saving}
            >
              Back
            </button>
          )}

          <button
            type="button"
            className="onboarding-button"
            onClick={
              handleNext
            }
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : step === 3
              ? "Start Our Story ❤️"
              : "Continue"}
          </button>

        </div>

        {/* =================================================
            NOTE
        ================================================= */}

        <p className="onboarding-note">
          Your story is private and
          belongs only to you and your
          partner.
        </p>

      </div>

    </div>
  );
}

export default Onboarding;