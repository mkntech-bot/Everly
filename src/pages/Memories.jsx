import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

function Memories() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [relationship, setRelationship] =
    useState(null);
  const [memories, setMemories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [caption, setCaption] =
    useState("");

  const [memoryDate, setMemoryDate] =
    useState("");

  // =========================================================
  // DATE
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

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

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

  // =========================================================
  // LOAD MEMORIES
  // =========================================================

  const loadMemories =
    async (
      currentRelationshipId
    ) => {
      const {
        data: rows,
        error,
      } = await supabase
        .from(
          "relationship_memories"
        )
        .select("*")
        .eq(
          "relationship_id",
          currentRelationshipId
        )
        .order(
          "memory_date",
          {
            ascending: false,
          }
        );

      if (error) {
        throw error;
      }

      const memoriesWithUrls =
        await Promise.all(
          (rows || []).map(
            async (memory) => {
              const {
                data: signedUrlData,
                error: signedUrlError,
              } = await supabase.storage
                .from(
                  "everly-memories"
                )
                .createSignedUrl(
                  memory.image_path,
                  604800
                );

              if (signedUrlError) {
                console.error(
                  "Could not create image URL:",
                  signedUrlError
                );
              }

              return {
                ...memory,
                image_url:
                  signedUrlData
                    ?.signedUrl ||
                  "",
              };
            }
          )
        );

      setMemories(
        memoriesWithUrls
      );
    };

  // =========================================================
  // LOAD PAGE
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setMessage("");

        // =====================================================
        // USER
        // =====================================================

        const {
          data: {
            user: currentUser,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

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
          .eq(
            "id",
            currentUser.id
          )
          .limit(1);

        if (profileError) {
          throw profileError;
        }

        setProfile(
          profileRows?.[0] || null
        );

        // =====================================================
        // FIND RELATIONSHIP
        // =====================================================

        let selectedRelationship =
          null;

        // ACTIVE CONNECTED

        const {
          data: connected,
          error: connectedError,
        } = await supabase
          .from("relationships")
          .select("*")
          .eq(
            "user_two_id",
            currentUser.id
          )
          .eq(
            "status",
            "active"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1);

        if (connectedError) {
          throw connectedError;
        }

        if (
          connected?.length
        ) {
          selectedRelationship =
            connected[0];
        }

        // ACTIVE OWN

        if (!selectedRelationship) {
          const {
            data: own,
            error: ownError,
          } = await supabase
            .from("relationships")
            .select("*")
            .eq(
              "user_one_id",
              currentUser.id
            )
            .eq(
              "status",
              "active"
            )
            .not(
              "partner_name",
              "is",
              null
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(1);

          if (ownError) {
            throw ownError;
          }

          if (own?.length) {
            selectedRelationship =
              own[0];
          }
        }

        // ENDED CONNECTED

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
            .eq(
              "status",
              "ended"
            )
            .order(
              "ended_at",
              {
                ascending: false,
              }
            )
            .limit(1);

          if (endedConnectedError) {
            throw endedConnectedError;
          }

          if (
            endedConnected?.length
          ) {
            selectedRelationship =
              endedConnected[0];
          }
        }

        // ENDED OWN

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
            .eq(
              "status",
              "ended"
            )
            .not(
              "partner_name",
              "is",
              null
            )
            .order(
              "ended_at",
              {
                ascending: false,
              }
            )
            .limit(1);

          if (endedOwnError) {
            throw endedOwnError;
          }

          if (endedOwn?.length) {
            selectedRelationship =
              endedOwn[0];
          }
        }

        // NO RELATIONSHIP

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
        // MEMORIES
        // =====================================================

        await loadMemories(
          selectedRelationship.id
        );
      } catch (error) {
        console.error(
          "Memories loading error:",
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
            "Could not load your memories."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setShowForm(false);
    setSelectedFile(null);
    setPreviewUrl("");
    setTitle("");
    setCaption("");
    setMemoryDate(
      getTodayDateTime()
    );
    setMessage("");
  };

  // =========================================================
  // ADD MEMORY
  // =========================================================

  const handleAddMemory =
    () => {
      setTitle("");
      setCaption("");
      setSelectedFile(null);
      setPreviewUrl("");
      setMemoryDate(
        getTodayDateTime()
      );
      setMessage("");
      setShowForm(true);
    };

  // =========================================================
  // FILE SELECT
  // =========================================================

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // Basic image validation
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setMessage(
        "Please choose an image file."
      );

      return;
    }

    // 10 MB maximum
    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        "Please choose an image smaller than 10 MB."
      );

      return;
    }

    setSelectedFile(file);
    setMessage("");

    const objectUrl =
      URL.createObjectURL(file);

    setPreviewUrl(
      objectUrl
    );
  };

  // =========================================================
  // SAVE MEMORY
  // =========================================================

  const handleSaveMemory =
    async (event) => {
      event.preventDefault();

      if (saving) {
        return;
      }

      try {
        setSaving(true);
        setMessage("");

        if (!user?.id) {
          throw new Error(
            "We couldn't find your account."
          );
        }

        if (!relationship?.id) {
          throw new Error(
            "We couldn't find your relationship."
          );
        }

        if (!selectedFile) {
          setMessage(
            "Please choose a photo."
          );

          return;
        }

        if (!title.trim()) {
          setMessage(
            "Please give this memory a title."
          );

          return;
        }

        if (!memoryDate) {
          setMessage(
            "Please choose a date."
          );

          return;
        }

        const parsedDate =
          new Date(memoryDate);

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

        // ===================================================
        // FILE EXTENSION
        // ===================================================

        const extension =
          selectedFile.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const fileName =
          `${crypto.randomUUID()}.${extension}`;

        const filePath =
          `${relationship.id}/${user.id}/${fileName}`;

        // ===================================================
        // UPLOAD IMAGE
        // ===================================================

        const {
          error: uploadError,
        } = await supabase.storage
          .from(
            "everly-memories"
          )
          .upload(
            filePath,
            selectedFile,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                selectedFile.type,
            }
          );

        if (uploadError) {
          throw uploadError;
        }

        // ===================================================
        // CREATE MEMORY RECORD
        // ===================================================

        const {
          data: insertedRows,
          error: insertError,
        } = await supabase
          .from(
            "relationship_memories"
          )
          .insert({
            relationship_id:
              relationship.id,

            created_by:
              user.id,

            title:
              title.trim(),

            caption:
              caption.trim() ||
              null,

            memory_date:
              parsedDate.toISOString(),

            image_path:
              filePath,
          })
          .select("*");

        // ===================================================
        // CLEAN UP IMAGE IF DB SAVE FAILS
        // ===================================================

        if (insertError) {
          await supabase.storage
            .from(
              "everly-memories"
            )
            .remove([
              filePath,
            ]);

          throw insertError;
        }

        const newMemory =
          insertedRows?.[0];

        if (!newMemory) {
          await supabase.storage
            .from(
              "everly-memories"
            )
            .remove([
              filePath,
            ]);

          throw new Error(
            "The memory could not be created."
          );
        }

        // ===================================================
        // CREATE SIGNED URL
        // ===================================================

        const {
          data: signedUrlData,
          error: signedUrlError,
        } = await supabase.storage
          .from(
            "everly-memories"
          )
          .createSignedUrl(
            filePath,
            604800
          );

        if (signedUrlError) {
          throw signedUrlError;
        }

        const memoryWithUrl = {
          ...newMemory,
          image_url:
            signedUrlData?.signedUrl ||
            "",
        };

        setMemories(
          (current) => [
            memoryWithUrl,
            ...current,
          ]
        );

        alert(
          "Memory added to your story. ❤️"
        );

        resetForm();
      } catch (error) {
        console.error(
          "Memory save error:",
          error
        );

        setMessage(
          error?.message ||
            "Could not save this memory."
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================================
  // DELETE MEMORY
  // =========================================================

  const handleDeleteMemory =
    async (memory) => {
      const confirmed =
        window.confirm(
          "Delete this memory?\n\nThe photo and memory information will be permanently removed."
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          memory.id
        );

        // ===================================================
        // DELETE DATABASE ROW
        // ===================================================

        const {
          error: deleteError,
        } = await supabase
          .from(
            "relationship_memories"
          )
          .delete()
          .eq(
            "id",
            memory.id
          )
          .eq(
            "created_by",
            user.id
          );

        if (deleteError) {
          throw deleteError;
        }

        // ===================================================
        // DELETE IMAGE
        // ===================================================

        const {
          error: storageDeleteError,
        } = await supabase.storage
          .from(
            "everly-memories"
          )
          .remove([
            memory.image_path,
          ]);

        if (storageDeleteError) {
          console.warn(
            "Memory deleted but image removal failed:",
            storageDeleteError
          );
        }

        setMemories(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                memory.id
            )
        );
      } catch (error) {
        console.error(
          "Memory delete error:",
          error
        );

        alert(
          "Could not delete this memory:\n\n" +
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
  // MY NAME
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
          Loading your memories...
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
            className="dashboard-nav-item active"
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

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <p className="dashboard-eyebrow">
              YOUR MEMORIES
            </p>

            <h1>
              Memories
            </h1>

            <p className="dashboard-subtitle">
              Keep the moments you never
              want to forget.
            </p>

          </div>

          <div className="dashboard-avatar">
            {myName
              .charAt(0)
              .toUpperCase()}
          </div>

        </header>

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="memories-hero-card">

          <div className="memories-hero-icon">
            ▣
          </div>

          <p>
            YOUR MEMORIES
          </p>

          <h2>
            Moments worth keeping.
          </h2>

          <span>
            Add the photos and memories
            that make your story special.
          </span>

        </section>

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <div className="memories-toolbar">

          <div>

            <h2>
              Your Gallery
            </h2>

            <p>
              {memories.length === 0
                ? "Your first memory is waiting."
                : `${memories.length} ${
                    memories.length === 1
                      ? "memory"
                      : "memories"
                  }`}
            </p>

          </div>

          {!relationship?.ended_at && (
            <button
              type="button"
              className="memories-add-button"
              onClick={
                handleAddMemory
              }
            >
              <span>
                +
              </span>

              Add Memory
            </button>
          )}

        </div>

        {/* ===================================================
            MESSAGE
        =================================================== */}

        {message && (
          <div className="memories-message">
            {message}
          </div>
        )}

        {/* ===================================================
            FORM
        =================================================== */}

        {showForm && (
          <div className="memories-form-card">

            <div className="memories-form-header">

              <div>

                <p>
                  NEW MEMORY
                </p>

                <h2>
                  Add a special moment
                </h2>

              </div>

              <button
                type="button"
                className="memories-close-button"
                onClick={
                  resetForm
                }
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              className="memories-form"
              onSubmit={
                handleSaveMemory
              }
            >

              {/* PHOTO */}

              <div className="memory-upload-area">

                {previewUrl ? (
                  <div className="memory-preview">

                    <img
                      src={previewUrl}
                      alt="Memory preview"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(
                          null
                        );
                        setPreviewUrl(
                          ""
                        );
                      }}
                    >
                      Remove Photo
                    </button>

                  </div>
                ) : (
                  <label className="memory-upload-label">

                    <span>
                      +
                    </span>

                    <strong>
                      Choose a photo
                    </strong>

                    <small>
                      JPG, PNG, WEBP up to 10 MB
                    </small>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleFileChange
                      }
                    />

                  </label>
                )}

              </div>

              {/* TITLE */}

              <div className="memories-form-field">

                <label>
                  Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="Our first date"
                />

              </div>

              {/* DATE */}

              <div className="memories-form-field">

                <label>
                  Date
                </label>

                <input
                  type="datetime-local"
                  value={
                    memoryDate
                  }
                  onChange={(e) =>
                    setMemoryDate(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* CAPTION */}

              <div className="memories-form-field">

                <label>
                  Caption
                  <span>
                    Optional
                  </span>
                </label>

                <textarea
                  rows="4"
                  value={caption}
                  onChange={(e) =>
                    setCaption(
                      e.target.value
                    )
                  }
                  placeholder="Tell the story behind this photo..."
                />

              </div>

              {/* ACTIONS */}

              <div className="memories-form-actions">

                <button
                  type="button"
                  className="memories-cancel-button"
                  onClick={
                    resetForm
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="memories-save-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Memory"}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* ===================================================
            EMPTY
        =================================================== */}

        {memories.length === 0 &&
          !showForm && (
            <section className="memories-empty-card">

              <div className="memories-empty-icon">
                ▣
              </div>

              <h2>
                Your gallery is empty
              </h2>

              <p>
                Start collecting the
                photos that tell your
                story.
              </p>

              {!relationship?.ended_at && (
                <button
                  type="button"
                  className="memories-empty-button"
                  onClick={
                    handleAddMemory
                  }
                >
                  Add Your First Memory
                </button>
              )}

            </section>
          )}

        {/* ===================================================
            GALLERY
        =================================================== */}

        {memories.length > 0 && (
          <section className="memories-grid">

            {memories.map(
              (memory) => (
                <article
                  className="memory-card"
                  key={memory.id}
                >

                  <div className="memory-image-wrapper">

                    {memory.image_url ? (
                      <img
                        src={
                          memory.image_url
                        }
                        alt={
                          memory.title
                        }
                        className="memory-image"
                      />
                    ) : (
                      <div className="memory-image-placeholder">
                        ♥
                      </div>
                    )}

                  </div>

                  <div className="memory-card-content">

                    <div className="memory-card-date">
                      {formatDate(
                        memory.memory_date
                      )}
                    </div>

                    <h3>
                      {memory.title}
                    </h3>

                    {memory.caption && (
                      <p>
                        {memory.caption}
                      </p>
                    )}

                    <div className="memory-card-footer">

                      <span>
                        {memory.created_by ===
                        user?.id
                          ? "Added by you"
                          : "Added by your partner"}
                      </span>

                      {memory.created_by ===
                        user?.id && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteMemory(
                              memory
                            )
                          }
                          disabled={
                            deletingId ===
                            memory.id
                          }
                        >
                          {deletingId ===
                          memory.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}

                    </div>

                  </div>

                </article>
              )
            )}

          </section>
        )}

      </main>

    </div>
  );
}

export default Memories;