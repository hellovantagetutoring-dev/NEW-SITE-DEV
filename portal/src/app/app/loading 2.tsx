export default function AppLoading() {
  return (
    <div className="route-loading" aria-busy="true" aria-live="polite">
      <div className="route-loading-bar" />
      <div className="route-loading-skel">
        <div className="skel skel-kicker" />
        <div className="skel skel-title" />
        <div className="skel skel-line" />
        <div className="skel skel-line skel-line-short" />
        <div className="skel-cards">
          <div className="skel skel-card" />
          <div className="skel skel-card" />
          <div className="skel skel-card" />
        </div>
      </div>
    </div>
  );
}
