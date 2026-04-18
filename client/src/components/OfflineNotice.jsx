function OfflineNotice() {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 animate-rise-in">
      Offline mode: the app shell is cached, but live scoring updates need a connection.
    </div>
  );
}

export default OfflineNotice;
