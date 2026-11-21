// Part 2: hands the finished recording from the scan page to the My Data page.
// shortcut: kept in browser memory only, so it is gone after a page refresh; save it (e.g. Supabase Storage) if it must survive.
let latestUrl: string | null = null;

export const setLatestRecording = (url: string) => {
  latestUrl = url;
};
export const getLatestRecording = () => latestUrl;
