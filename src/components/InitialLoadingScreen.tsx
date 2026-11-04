import skLogo from '../assets/images/skLogo.png';

export function InitialLoadingScreen() {
  return (
    <div
      className="initial-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="Loading SK Bagbaguin Youth Portal"
    >
      <div className="initial-loading-screen__content">
        <div className="initial-loading-screen__logo-wrap">
          <div className="initial-loading-screen__ring" />
          <img
            src={skLogo}
            alt="SK Bagbaguin Youth Assembly"
            className="initial-loading-screen__logo"
          />
        </div>
        <p className="initial-loading-screen__eyebrow">Sangguniang Kabataan</p>
        <h1>SK Bagbaguin Youth Portal</h1>
        <div className="initial-loading-screen__progress" aria-hidden="true">
          <span />
        </div>
        <p className="initial-loading-screen__status">Preparing your portal...</p>
      </div>
    </div>
  );
}
