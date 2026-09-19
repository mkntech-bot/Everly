import { useNavigate } from "react-router-dom";
import "./App.css";

function Landing() {
  const navigate = useNavigate();

  // ==========================================
  // GO TO AUTH
  // ==========================================

  const goToAuth = () => {
    navigate("/auth");
  };

  // ==========================================
  // SCROLL TO FEATURES
  // ==========================================

  const scrollToFeatures = () => {
    document
      .getElementById("features")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <div className="everly-page">

      {/* ======================================
          NAVIGATION
      ====================================== */}

      <header className="navbar">

        <div
          className="logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-heart">
            ♥
          </span>

          <span>
            Everly
          </span>
        </div>

        <nav className="nav-links">

          <a href="#features">
            Features
          </a>

          <a href="#about">
            About
          </a>

          <a href="#story">
            Our Story
          </a>

        </nav>

        <div className="nav-actions">

          {/* LOGIN */}

          <button
            className="login-btn"
            onClick={goToAuth}
          >
            Log in
          </button>

          {/* GET STARTED */}

          <button
            className="get-started-btn"
            onClick={goToAuth}
          >
            Get Started
          </button>

        </div>

      </header>

      {/* ======================================
          HERO
      ====================================== */}

      <main>

        <section
          className="hero"
          id="story"
        >

          <div className="hero-content">

            <div className="eyebrow">
              <span>
                ♥
              </span>

              Every moment, together.
            </div>

            <h1>
              Your story
              <br />
              <span>
                starts here.
              </span>
            </h1>

            <p className="hero-description">
              Keep track of the moments that matter.
              Celebrate your time together, save your
              memories, and build your story in one
              beautiful place.
            </p>

            <div className="hero-buttons">

              {/* START YOUR STORY */}

              <button
                className="primary-btn"
                onClick={goToAuth}
              >
                Start Your Story

                <span>
                  →
                </span>
              </button>

              {/* LEARN MORE */}

              <button
                className="secondary-btn"
                onClick={scrollToFeatures}
              >
                Learn More
              </button>

            </div>

            <div className="trust-line">

              <span>
                ✦ Private by design
              </span>

              <span className="dot">
                •
              </span>

              <span>
                Made for two
              </span>

            </div>

          </div>

          {/* ==================================
              RELATIONSHIP CARD
          ================================== */}

          <div className="timer-card">

            <div className="floating-heart heart-one">
              ♥
            </div>

            <div className="floating-heart heart-two">
              ♥
            </div>

            <p className="timer-label">
              TOGETHER FOR
            </p>

            <div className="timer">

              <div className="time-unit">

                <strong>
                  2
                </strong>

                <span>
                  Years
                </span>

              </div>

              <div className="time-unit">

                <strong>
                  4
                </strong>

                <span>
                  Months
                </span>

              </div>

              <div className="time-unit">

                <strong>
                  18
                </strong>

                <span>
                  Days
                </span>

              </div>

            </div>

            <p className="timer-caption">
              Every moment counts.
            </p>

          </div>

        </section>

        {/* ======================================
            FEATURES
        ====================================== */}

        <section
          className="features-section"
          id="features"
        >

          <div className="section-heading">

            <span>
              WHAT EVERLY HOLDS
            </span>

            <h2>
              More than a timer.
            </h2>

            <p>
              A private place to keep the moments,
              memories, and milestones that make
              your story yours.
            </p>

          </div>

          <div className="feature-grid">

            {/* OUR TIME */}

            <div className="feature-card">

              <div className="feature-icon">
                ♡
              </div>

              <h3>
                Our Time
              </h3>

              <p>
                Watch your relationship grow with a
                live counter that keeps every moment
                connected.
              </p>

            </div>

            {/* OUR STORY */}

            <div className="feature-card">

              <div className="feature-icon">
                ✦
              </div>

              <h3>
                Our Story
              </h3>

              <p>
                Build a timeline of the moments that
                made your relationship what it is today.
              </p>

            </div>

            {/* MEMORIES */}

            <div className="feature-card">

              <div className="feature-icon">
                ▣
              </div>

              <h3>
                Memories
              </h3>

              <p>
                Keep your favorite photos and memories
                together in one private space.
              </p>

            </div>

            {/* IMPORTANT DATES */}

            <div className="feature-card">

              <div className="feature-icon">
                ♡
              </div>

              <h3>
                Important Dates
              </h3>

              <p>
                Never lose track of anniversaries,
                birthdays, milestones, and other
                moments that matter.
              </p>

            </div>

          </div>

        </section>

        {/* ======================================
            ABOUT
        ====================================== */}

        <section
          className="about-section"
          id="about"
        >

          <div className="about-card">

            <div>

              <span className="section-tag">
                YOUR STORY. YOUR SPACE.
              </span>

              <h2>
                Some moments
                <br />
                deserve to stay.
              </h2>

            </div>

            <p>
              Everly is designed to give two people
              a private digital home where their
              relationship can grow, be remembered,
              and become a story worth keeping.
            </p>

          </div>

        </section>

      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="footer">

        <div className="footer-logo">

          <span>
            ♥
          </span>

          Everly

        </div>

        <p>
          Every moment, together.
        </p>

        <span>
          © 2026 Everly
        </span>

      </footer>

    </div>
  );
}

export default Landing;