import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

function OurStory() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [relationship, setRelationship] =
    useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingEvent, setEditingEvent] =
    useState(null);

  const [eventTitle, setEventTitle] =
    useState("");

  const [eventDescription, setEventDescription] =
    useState("");

  const [eventDate, setEventDate] =
    useState("");

  const [eventType, setEventType] =
    useState("moment");

  const [deletingId, setDeletingId] =
    useState(null);

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const getTodayDateTime = () => {
    const now = new Date();

    const year =
      now.getFullYear();

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

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

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

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // =========================================================
  // EVENT TYPE LABEL
  // =========================================================

  const getEventTypeLabel = (type) => {
    switch (type) {
      case "milestone":
        return "Milestone";

      case "date":
        return "Important Date";

      case "chapter":
        return "Chapter";

      default:
        return "Moment";
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "milestone":
        return "✦";

      case "date":
        return "◷";

      case "chapter":
        return "♡";

      default:
        return "♥";
    }
  };

  // =========================================================
  // LOAD STORY
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadStory = async () => {
      try {
        setLoading(true);
        setMessage("");

        // =====================================================
        // CURRENT USER
        // =====================================================

        const {
          data: {
            user: currentUser,
          },
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
        // PROFILE
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

        setProfile(
          profileRows?.[0] || null
        );

        // =====================================================
        // FIND RELATIONSHIP
        // =====================================================

        let selectedRelationship =
          null;

        // =====================================================
        // ACTIVE CONNECTED
        // =====================================================

        const {
          data: activeConnected,
          error: activeConnectedError,
        } = await supabase
          .from("relationships")
          .select("*")
          .eq(
            "user_two_id",
            currentUser.id
          )
          .eq("status", "active")
          .order("created_at", {
            ascending: false,
          })
          .limit(1);

        if (activeConnectedError) {
          throw activeConnectedError;
        }

        if (
          activeConnected &&
          activeConnected.length > 0
        ) {
          selectedRelationship =
            activeConnected[0];
        }

        // =====================================================
        // ACTIVE OWN
        // =====================================================

        if (!selectedRelationship) {
          const {
            data: activeOwn,
            error: activeOwnError,
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

          if (activeOwnError) {
            throw activeOwnError;
          }

          if (
            activeOwn &&
            activeOwn.length > 0
          ) {
            selectedRelationship =
              activeOwn[0];
          }
        }

        // =====================================================
        // ENDED CONNECTED
        // =====================================================

        if (!selectedRelationship) {
          const {
            data: endedConnected,
            error: endedConnectedError,
          } = await supabase
            .from("relationships")
            .select("*")
            .eq(
              "user_two_id",
              currentUser.id
            )
            .eq("status", "ended")
            .order("ended_at", {
              ascending: false,
            })
            .limit(1);

          if (endedConnectedError) {
            throw endedConnectedError;
          }

          if (
            endedConnected &&
            endedConnected.length > 0
          ) {
            selectedRelationship =
              endedConnected[0];
          }
        }

        // =====================================================
        // ENDED OWN
        // =====================================================

        if (!selectedRelationship) {
          const {
            data: endedOwn,
            error: endedOwnError,
          } = await supabase
            .from("relationships")
            .select("*")
            .eq(
              "user_one_id",
              currentUser.id
            )
            .eq("status", "ended")
            .not(
              "partner_name",
              "is",
              null
            )
            .order("ended_at", {
              ascending: false,
            })
            .limit(1);

          if (endedOwnError) {
            throw endedOwnError;
          }

          if (
            endedOwn &&
            endedOwn.length > 0
          ) {
            selectedRelationship =
              endedOwn[0];
          }
        }

        // =====================================================
        // NO RELATIONSHIP
        // =====================================================

        if (!selectedRelationship) {
          navigate(
            "/onboarding?new=true",
            {
              replace: true,
            }
          );

          return;
        }

        if (!mounted) {
          return;
        }

        setRelationship(
          selectedRelationship
        );

        // =====================================================
        // LOAD STORY EVENTS
        // =====================================================

        const {
          data: storyEvents,
          error: storyError,
        } = await supabase
          .from(
            "relationship_story_events"
          )
          .select("*")
          .eq(
            "relationship_id",
            selectedRelationship.id
          )
          .order("event_date", {
            ascending: true,
          });

        if (storyError) {
          throw storyError;
        }

        if (!mounted) {
          return;
        }

        setEvents(
          storyEvents || []
        );
      } catch (error) {
        console.error(
          "Our Story loading error:",
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
            "Something went wrong while loading your story."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStory();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================================================
  // SORT EVENTS
  // =========================================================

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        new Date(a.event_date) -
        new Date(b.event_date)
    );
  }, [events]);

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setEventTitle("");
    setEventDescription("");
    setEventDate(
      getTodayDateTime()
    );
    setEventType("moment");
    setEditingEvent(null);
    setShowForm(false);
    setMessage("");
  };

  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventTitle("");
    setEventDescription("");
    setEventDate(
      getTodayDateTime()
    );
    setEventType("moment");
    setMessage("");
    setShowForm(true);
  };

  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  const handleEditEvent = (event) => {
    setEditingEvent(event);

    setEventTitle(
      event.title || ""
    );

    setEventDescription(
      event.description || ""
    );

    setEventDate(
      formatDateTime(
        event.event_date
      )
    );

    setEventType(
      event.event_type ||
        "moment"
    );

    setMessage("");
    setShowForm(true);
  };

  // =========================================================
  // SAVE EVENT
  // =========================================================

  const handleSaveEvent = async (
    e
  ) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      if (!relationship?.id) {
        throw new Error(
          "We couldn't find your relationship."
        );
      }

      if (!user?.id) {
        throw new Error(
          "We couldn't find your account."
        );
      }

      if (!eventTitle.trim()) {
        setMessage(
          "Please give this moment a title."
        );

        return;
      }

      if (!eventDate) {
        setMessage(
          "Please choose a date."
        );

        return;
      }

      const parsedDate =
        new Date(eventDate);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        setMessage(
          "Please choose a valid date."
        );

        return;
      }

      // =====================================================
      // UPDATE
      // =====================================================

      if (editingEvent) {
        const {
          data: updatedRows,
          error: updateError,
        } = await supabase
          .from(
            "relationship_story_events"
          )
          .update({
            title:
              eventTitle.trim(),

            description:
              eventDescription.trim() ||
              null,

            event_date:
              parsedDate.toISOString(),

            event_type:
              eventType,
          })
          .eq(
            "id",
            editingEvent.id
          )
          .eq(
            "relationship_id",
            relationship.id
          )
          .select("*");

        if (updateError) {
          throw updateError;
        }

        const updatedEvent =
          updatedRows?.[0];

        if (!updatedEvent) {
          throw new Error(
            "The story moment could not be updated."
          );
        }

        setEvents(
          (currentEvents) =>
            currentEvents.map(
              (event) =>
                event.id ===
                updatedEvent.id
                  ? updatedEvent
                  : event
            )
        );

        alert(
          "Your story moment has been updated. ❤️"
        );
      }

      // =====================================================
      // CREATE
      // =====================================================

      else {
        const {
          data: insertedRows,
          error: insertError,
        } = await supabase
          .from(
            "relationship_story_events"
          )
          .insert({
            relationship_id:
              relationship.id,

            created_by:
              user.id,

            title:
              eventTitle.trim(),

            description:
              eventDescription.trim() ||
              null,

            event_date:
              parsedDate.toISOString(),

            event_type:
              eventType,
          })
          .select("*");

        if (insertError) {
          throw insertError;
        }

        const newEvent =
          insertedRows?.[0];

        if (!newEvent) {
          throw new Error(
            "The story moment could not be created."
          );
        }

        setEvents(
          (currentEvents) => [
            ...currentEvents,
            newEvent,
          ]
        );

        alert(
          "A new moment has been added to your story. ❤️"
        );
      }

      resetForm();
    } catch (error) {
      console.error(
        "Story event save error:",
        error
      );

      setMessage(
        error?.message ||
          "Could not save this story moment."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE EVENT
  // =========================================================

  const handleDeleteEvent =
    async (event) => {
      const confirmed =
        window.confirm(
          "Delete this story moment?\n\nThis cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          event.id
        );

        const {
          error: deleteError,
        } = await supabase
          .from(
            "relationship_story_events"
          )
          .delete()
          .eq(
            "id",
            event.id
          )
          .eq(
            "relationship_id",
            relationship.id
          );

        if (deleteError) {
          throw deleteError;
        }

        setEvents(
          (currentEvents) =>
            currentEvents.filter(
              (item) =>
                item.id !==
                event.id
            )
        );
      } catch (error) {
        console.error(
          "Story event delete error:",
          error
        );

        alert(
          "Could not delete this story moment:\n\n" +
            (
              error?.message ||
              "Unknown error"
            )
        );
      } finally {
        setDeletingId(null);
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
  // USER NAME
  // =========================================================

  const myName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    "You";

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
  // PAGE
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">

        <div className="dashboard-brand">

          <span>
            ♥
          </span>

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
          >
            <span>⏱</span>
            Our Time
          </button>

          <button
            className="dashboard-nav-item active"
            type="button"
          >
            <span>♡</span>
            Our Story
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
          >
            <span>▣</span>
            Memories
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
          >
            <span>◷</span>
            Important Dates
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
          >
            <span>✉</span>
            Love Notes
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
          >
            <span>✦</span>
            Milestones
          </button>

        </nav>

        <div className="dashboard-sidebar-bottom">

          <button
            className="dashboard-nav-item"
            type="button"
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

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="dashboard-header">

          <div>

            <p className="dashboard-eyebrow">
              YOUR STORY
            </p>

            <h1>
              Our Story
            </h1>

            <p className="dashboard-subtitle">
              Every chapter, every memory,
              every moment.
            </p>

          </div>

          <div className="dashboard-avatar">
            {myName
              .charAt(0)
              .toUpperCase()}
          </div>

        </header>

        {/* ===================================================
            STORY HERO
        =================================================== */}

        <section className="story-hero-card">

          <div className="story-hero-heart">
            ♥
          </div>

          <p>
            YOUR STORY
          </p>

          <h2>
            Every moment matters.
          </h2>

          <span>
            Keep the moments that make
            your story yours.
          </span>

        </section>

        {/* ===================================================
            ADD BUTTON
        =================================================== */}

        <div className="story-toolbar">

          <div>

            <h2>
              Your Timeline
            </h2>

            <p>
              {sortedEvents.length === 0
                ? "Your first story moment is waiting."
                : `${sortedEvents.length} ${
                    sortedEvents.length === 1
                      ? "moment"
                      : "moments"
                  } in your story`}
            </p>

          </div>

          {!relationship?.ended_at && (
            <button
              type="button"
              className="story-add-button"
              onClick={
                handleAddEvent
              }
            >
              <span>
                +
              </span>

              Add to Our Story
            </button>
          )}

        </div>

        {/* ===================================================
            MESSAGE
        =================================================== */}

        {message && (
          <div className="story-message">
            {message}
          </div>
        )}

        {/* ===================================================
            ADD / EDIT FORM
        =================================================== */}

        {showForm && (
          <div className="story-form-card">

            <div className="story-form-header">

              <div>

                <p className="story-form-eyebrow">
                  {editingEvent
                    ? "EDIT MOMENT"
                    : "NEW MOMENT"}
                </p>

                <h2>
                  {editingEvent
                    ? "Edit your story"
                    : "Add to your story"}
                </h2>

              </div>

              <button
                type="button"
                className="story-close-button"
                onClick={
                  resetForm
                }
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              className="story-form"
              onSubmit={
                handleSaveEvent
              }
            >

              <div className="story-form-field">

                <label>
                  Title
                </label>

                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) =>
                    setEventTitle(
                      e.target.value
                    )
                  }
                  placeholder="First Date"
                  autoFocus
                />

              </div>

              <div className="story-form-row">

                <div className="story-form-field">

                  <label>
                    Type
                  </label>

                  <select
                    value={
                      eventType
                    }
                    onChange={(e) =>
                      setEventType(
                        e.target.value
                      )
                    }
                  >
                    <option value="moment">
                      Moment
                    </option>

                    <option value="milestone">
                      Milestone
                    </option>

                    <option value="date">
                      Important Date
                    </option>

                    <option value="chapter">
                      Chapter
                    </option>

                  </select>

                </div>

                <div className="story-form-field">

                  <label>
                    Date
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      eventDate
                    }
                    onChange={(e) =>
                      setEventDate(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              <div className="story-form-field">

                <label>
                  Tell your story
                  <span>
                    Optional
                  </span>
                </label>

                <textarea
                  value={
                    eventDescription
                  }
                  onChange={(e) =>
                    setEventDescription(
                      e.target.value
                    )
                  }
                  placeholder="Tell us what made this moment special..."
                  rows="5"
                />

              </div>

              <div className="story-form-actions">

                <button
                  type="button"
                  className="story-cancel-button"
                  onClick={
                    resetForm
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="story-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingEvent
                    ? "Save Changes"
                    : "Add to Our Story"}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* ===================================================
            EMPTY STORY
        =================================================== */}

        {sortedEvents.length === 0 && (
          <section className="story-empty-card">

            <div className="story-empty-icon">
              ♥
            </div>

            <h2>
              Your story starts here
            </h2>

            <p>
              Add your first special
              moment and start building
              your Everly timeline
              together.
            </p>

            {!relationship?.ended_at && (
              <button
                type="button"
                className="story-empty-button"
                onClick={
                  handleAddEvent
                }
              >
                Add Your First Moment
              </button>
            )}

          </section>
        )}

        {/* ===================================================
            TIMELINE
        =================================================== */}

        {sortedEvents.length > 0 && (
          <section className="story-timeline">

            {/* =================================================
                RELATIONSHIP BEGINNING
            ================================================= */}

            <div className="story-timeline-item">

              <div className="story-timeline-line" />

              <div className="story-timeline-dot start">
                ♥
              </div>

              <div className="story-timeline-card">

                <span className="story-event-type">
                  THE BEGINNING
                </span>

                <h3>
                  Your Story Began
                </h3>

                <p>
                  {formatDate(
                    relationship.started_at
                  )}
                </p>

              </div>

            </div>

            {/* =================================================
                STORY EVENTS
            ================================================= */}

            {sortedEvents.map(
              (event) => (
                <div
                  className="story-timeline-item"
                  key={event.id}
                >

                  <div className="story-timeline-line" />

                  <div className="story-timeline-dot">
                    {getEventIcon(
                      event.event_type
                    )}
                  </div>

                  <article className="story-timeline-card">

                    <div className="story-event-top">

                      <span className="story-event-type">
                        {getEventTypeLabel(
                          event.event_type
                        )}
                      </span>

                      <span className="story-event-date">
                        {formatDate(
                          event.event_date
                        )}
                      </span>

                    </div>

                    <h3>
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="story-event-description">
                        {event.description}
                      </p>
                    )}

                    <div className="story-event-footer">

                      <span>
                        Added to your story
                      </span>

                      {event.created_by ===
                        user?.id && (
                        <div className="story-event-actions">

                          <button
                            type="button"
                            onClick={() =>
                              handleEditEvent(
                                event
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteEvent(
                                event
                              )
                            }
                            disabled={
                              deletingId ===
                              event.id
                            }
                          >
                            {deletingId ===
                            event.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>
                      )}

                    </div>

                  </article>

                </div>
              )
            )}

            {/* =================================================
                ENDING
            ================================================= */}

            {relationship?.ended_at && (
              <div className="story-timeline-item">

                <div className="story-timeline-dot ended">
                  ♥
                </div>

                <div className="story-timeline-card story-ending-card">

                  <span className="story-event-type">
                    CHAPTER ENDED
                  </span>

                  <h3>
                    This Chapter Has Ended
                  </h3>

                  <p>
                    {formatDate(
                      relationship.ended_at
                    )}
                  </p>

                </div>

              </div>
            )}

          </section>
        )}

      </main>

    </div>
  );
}

export default OurStory;