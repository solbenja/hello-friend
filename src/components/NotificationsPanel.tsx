import * as React from "react";
import {
  type Notification,
  getNotifs, markAllRead, clearAll, timeAgo,
} from "@/lib/notifications";

const NotifIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ReactElement> = {
    swap: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>),
    lp: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>),
    deploy: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>),
    points: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>),
    checkin: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M9 16l2 2 4-4" /></svg>),
    nft: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>),
    gf: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>),
    quest: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>),
    faucet: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>),
  };
  return (
    <div className="w-9 h-9 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center dark:text-white text-gray-700 flex-shrink-0">
      <div className="w-4 h-4">{icons[type] ?? icons.swap}</div>
    </div>
  );
};

const NotificationItem = ({ notif }: { notif: Notification }) => (
  <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-default ${notif.read ? "bg-[#0a0a0a] border-[#141414]" : "bg-[#0f0f0f] border-[#1f1f1f]"}`}>
    <NotifIcon type={notif.type} />
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-semibold leading-snug">{notif.title}</p>
      <p className="text-[#666] text-xs mt-0.5 leading-snug">{notif.message}</p>
      <p className="text-[#444] text-xs mt-1 font-mono">{timeAgo(notif.timestamp)}</p>
    </div>
    {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0 shrink-0" />}
  </div>
);

export function useNotifications(wallet?: string) {
  const [notifs, setNotifs] = React.useState<Notification[]>([]);
  React.useEffect(() => {
    if (!wallet) { setNotifs([]); return; }
    setNotifs(getNotifs(wallet));
    const onUpdate = () => setNotifs(getNotifs(wallet));
    window.addEventListener("litdex:notif", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("litdex:notif", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [wallet]);
  return { notifs, setNotifs };
}

export default function NotificationsPanel({
  open, onClose, wallet,
}: { open: boolean; onClose: () => void; wallet?: string }) {
  const { notifs, setNotifs } = useNotifications(wallet);
  const w = wallet || "";

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={onClose} />}
      <div
        className="fixed right-0 top-0 h-full z-[9999] flex flex-col w-full sm:w-[360px]"
        style={{
          maxWidth: "100vw",
          background: "#080808",
          borderLeft: "1px solid #1f1f1f",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease",
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
          <span className="text-white font-bold text-base">Notifications</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNotifs(markAllRead(w))}
              className="text-[#555] hover:text-white text-xs transition-colors"
            >
              Mark all read
            </button>
            <button onClick={onClose}>
              <svg className="w-4 h-4 text-[#555] hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
              <svg className="w-10 h-10 text-[#2a2a2a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p className="text-[#333] text-sm">No notifications yet</p>
            </div>
          ) : (
            notifs.map(n => (
              <div key={n.id}>
                <NotificationItem notif={n} />
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[#1f1f1f]">
          <button
            onClick={() => setNotifs(clearAll(w))}
            className="w-full text-center text-[#444] hover:text-[#888] text-xs transition-colors py-2"
          >
            Clear all notifications
          </button>
        </div>
      </div>
    </>
  );
}
