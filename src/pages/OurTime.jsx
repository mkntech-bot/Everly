import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

function getDuration(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalHours: 0,
    };
  }

  if (end < start) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalHours: 0,
    };
  }

  let cursor = new Date(start);

  let years = end.getFullYear() - cursor.getFullYear();

  const yearCheck = new Date(cursor);
  yearCheck.setFullYear(cursor.getFullYear() + years);

  if (yearCheck > end) {
    years -= 1;
    yearCheck.setFullYear(cursor.getFullYear() + years);
  }

  cursor = yearCheck;

  let months = end.getMonth() - cursor.getMonth();

  if (months < 0) {
    months += 12;
  }

  const monthCheck = new Date(cursor);
  monthCheck.setMonth(cursor.getMonth() + months);

  if (monthCheck > end) {
    months -= 1;

    if (months < 0) {
      months = 11;
    }

    monthCheck.setMonth(cursor.getMonth() + months);
  }

  cursor = monthCheck;

  const remainingMilliseconds = end.getTime() - cursor.getTime();

  const totalSeconds = Math.floor(remainingMilliseconds / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalDays = Math.floor(
    (end.getTime() - start.getTime()) / 86400000
  );

  const totalHours = Math.floor(
    (end.getTime() - start.getTime()) / 3600000
  );

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalHours,
  };
}

function addMonths(dateValue, months) {
  const date = new Date(dateValue);
  const originalDay = date.getDate();

  date.setDate(1);
  date.setMonth(date.getMonth() + months);

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  date.setDate(Math.min(originalDay, lastDay));

  return date;
}

function addYears(dateValue, years) {
  const date = new Date(dateValue);
  const month = date.getMonth();
  const day = date.getDate();

  date.setDate(1);
  date.setFullYear(date.getFullYear() + years);
  date.setMonth(month);

  const lastDay = new Date(
    date.getFullYear(),
    month + 1,
    0
  ).getDate();

  date.setDate(Math.min(day, lastDay));

  return date;
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateValue) {
  return new Date(dateValue).toLocaleString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function OurTime() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [relationship, setRelationship] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOurTime();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function loadOurTime() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        navigate("/auth");
        return;
      }

      setUser(currentUser);

      const { data: relationships, error: relationshipError } =
        await supabase
          .from("relationships")
          .select("*")
          .or(
            `user_one_id.eq.${currentUser.id},user_two_id.eq.${currentUser.id}`
          )
          .order("created_at", {
            ascending: false,
          });

      if (relationshipError) {
        throw relationshipError;
      }

      if (!relationships || relationships.length === 0) {
        setError("We couldn't find your Everly relationship.");
        setLoading(false);
        return;
      }

      const activeConnected = relationships.find(
        (item) =>
          item.status === "active" &&
          item.user_two_id !== null &&
          (item.user_one_id === currentUser.id ||
            item.user_two_id === currentUser.id)
      );

      const activeOwn = relationships.find(
        (item) =>
          item.status === "active" &&
          item.user_one_id === currentUser.id
      );

      const endedConnected = relationships.find(
        (item) =>
          item.status === "ended" &&
          item.user_two_id !== null &&
          (item.user_one_id === currentUser.id ||
            item.user_two_id === currentUser.id)
      );

      const endedOwn = relationships.find(
        (item) =>
          item.status === "ended" &&
          item.user_one_id === currentUser.id
      );

      const selectedRelationship =
        activeConnected ||
        activeOwn ||
        endedConnected ||
        endedOwn;

      if (!selectedRelationship) {
        setError("We couldn't find your Everly relationship.");
        setLoading(false);
        return;
      }

      setRelationship(selectedRelationship);

      const partnerId =
        selectedRelationship.user_one_id === currentUser.id
          ? selectedRelationship.user_two_id
          : selectedRelationship.user_one_id;

      if (partnerId) {
        const { data: partnerData } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", partnerId)
          .maybeSingle();

        setPartnerProfile(partnerData || null);
      }
    } catch (err) {
      console.error("Our Time load error:", err);

      setError(
        err?.message ||
          "Something went wrong while loading your relationship."
      );
    } finally {
      setLoading(false);
    }
  }

  const endTime = useMemo(() => {
    if (!relationship) {
      return now;
    }

    if (relationship.ended_at) {
      return new Date(relationship.ended_at);
    }

    return now;
  }, [relationship, now]);

  const duration = useMemo(() => {
    if (!relationship?.started_at) {
      return {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalDays: 0,
        totalHours: 0,
      };
    }

    return getDuration(
      relationship.started_at,
      endTime
    );
  }, [relationship, endTime]);

  const milestones = useMemo(() => {
    if (!relationship?.started_at) {
      return [];
    }

    const start = new Date(relationship.started_at);
    const currentTime = endTime;

    const possibleMilestones = [
      {
        label: "1 Month Together",
        date: addMonths(start, 1),
        type: "month",
      },
      {
        label: "100 Days Together",
        date: new Date(
          start.getTime() + 100 * 86400000
        ),
        type: "day",
      },
      {
        label: "6 Months Together",
        date: addMonths(start, 6),
        type: "month",
      },
      {
        label: "1 Year Together",
        date: addYears(start, 1),
        type: "year",
      },
      {
        label: "2 Years Together",
        date: addYears(start, 2),
        type: "year",
      },
      {
        label: "3 Years Together",
        date: addYears(start, 3),
        type: "year",
      },
      {
        label: "5 Years Together",
        date: addYears(start, 5),
        type: "year",
      },
    ];

    return possibleMilestones.map((milestone) => ({
      ...milestone,
      reached: currentTime >= milestone.date,
    }));
  }, [relationship, endTime]);

  const nextMilestone = milestones.find(
    (milestone) => !milestone.reached
  );

  const partnerName =
    partnerProfile?.display_name ||
    relationship?.partner_name ||
    "Your partner";

  if (loading) {
    return (
      <div className="our-time-page">
        <div className="our-time-loading">
          <div className="our-time-loading-heart">♡</div>
          <p>Loading your time together...</p>
        </div>
      </div>
    );
  }

  if (error || !relationship) {
    return (
      <div className="our-time-page">
        <div className="our-time-error-card">
          <div className="our-time-error-icon">♡</div>

          <h1>Your Time Together</h1>

          <p>
            {error || "We couldn't find your relationship."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="our-time-primary-button"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isEnded = relationship.status === "ended";

  return (
    <div className="our-time-page">
      <div className="our-time-shell">

        {/* TOP BAR */}
        <header className="our-time-topbar">
          <button
            type="button"
            className="our-time-back"
            onClick={() => navigate("/dashboard")}
          >
            ←
            <span>Dashboard</span>
          </button>

          <div className="our-time-brand">
            <span>♥</span>
            Everly
          </div>

          <div className="our-time-status">
            {isEnded ? "Relationship ended" : "Together"}
          </div>
        </header>

        {/* HERO */}
        <section className="our-time-hero">
          <div className="our-time-eyebrow">
            {isEnded
              ? "Your time together"
              : "Every moment, together"}
          </div>

          <h1>
            {partnerName}
            <span> &amp; You</span>
          </h1>

          <p className="our-time-hero-copy">
            {isEnded
              ? "A record of the time you shared together."
              : "A live record of every moment you've shared."}
          </p>

          <div className="our-time-heart">
            ♥
          </div>
        </section>

        {/* MAIN TIMER */}
        <section className="our-time-card">
          <div className="our-time-card-label">
            Time Together
          </div>

          <div className="our-time-grid">
            <div className="our-time-unit">
              <strong>{duration.years}</strong>
              <span>Years</span>
            </div>

            <div className="our-time-divider">:</div>

            <div className="our-time-unit">
              <strong>{duration.months}</strong>
              <span>Months</span>
            </div>

            <div className="our-time-divider">:</div>

            <div className="our-time-unit">
              <strong>{duration.days}</strong>
              <span>Days</span>
            </div>

            <div className="our-time-divider">:</div>

            <div className="our-time-unit">
              <strong>
                {String(duration.hours).padStart(2, "0")}
              </strong>
              <span>Hours</span>
            </div>

            <div className="our-time-divider">:</div>

            <div className="our-time-unit">
              <strong>
                {String(duration.minutes).padStart(2, "0")}
              </strong>
              <span>Minutes</span>
            </div>

            <div className="our-time-divider">:</div>

            <div className="our-time-unit">
              <strong>
                {String(duration.seconds).padStart(2, "0")}
              </strong>
              <span>Seconds</span>
            </div>
          </div>

          <div className="our-time-live-indicator">
            <span className={isEnded ? "ended" : ""}></span>

            {isEnded
              ? `Ended ${formatDateTime(
                  relationship.ended_at
                )}`
              : "Live timer"}
          </div>
        </section>

        {/* DETAILS */}
        <section className="our-time-details-grid">
          <div className="our-time-detail-card">
            <span className="our-time-detail-icon">
              ◷
            </span>

            <div>
              <span className="our-time-detail-label">
                Started
              </span>

              <strong>
                {formatDateTime(
                  relationship.started_at
                )}
              </strong>
            </div>
          </div>

          <div className="our-time-detail-card">
            <span className="our-time-detail-icon">
              ♡
            </span>

            <div>
              <span className="our-time-detail-label">
                Total days
              </span>

              <strong>
                {duration.totalDays.toLocaleString()} days
              </strong>
            </div>
          </div>

          <div className="our-time-detail-card">
            <span className="our-time-detail-icon">
              ✦
            </span>

            <div>
              <span className="our-time-detail-label">
                Total hours
              </span>

              <strong>
                {duration.totalHours.toLocaleString()} hours
              </strong>
            </div>
          </div>
        </section>

        {/* NEXT MILESTONE */}
        {nextMilestone && !isEnded && (
          <section className="our-time-next-card">
            <div>
              <span className="our-time-section-eyebrow">
                Coming up
              </span>

              <h2>{nextMilestone.label}</h2>

              <p>
                {formatDate(nextMilestone.date)}
              </p>
            </div>

            <div className="our-time-next-icon">
              ✦
            </div>
          </section>
        )}

        {/* MILESTONES */}
        <section className="our-time-section">
          <div className="our-time-section-heading">
            <div>
              <span className="our-time-section-eyebrow">
                Milestones
              </span>

              <h2>Your journey through time</h2>
            </div>
          </div>

          <div className="our-time-milestones">
            {milestones.map((milestone) => (
              <div
                key={milestone.label}
                className={`our-time-milestone ${
                  milestone.reached
                    ? "reached"
                    : ""
                }`}
              >
                <div className="our-time-milestone-icon">
                  {milestone.reached ? "✓" : "○"}
                </div>

                <div>
                  <strong>{milestone.label}</strong>

                  <span>
                    {formatDate(milestone.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER ACTIONS */}
        <section className="our-time-actions">
          <button
            type="button"
            onClick={() => navigate("/our-story")}
            className="our-time-secondary-button"
          >
            Our Story
          </button>

          <button
            type="button"
            onClick={() => navigate("/memories")}
            className="our-time-secondary-button"
          >
            Memories
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="our-time-primary-button"
          >
            Back to Dashboard
          </button>
        </section>

      </div>
    </div>
  );
}

export default OurTime;