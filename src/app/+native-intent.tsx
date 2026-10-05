// Google girişinden dönen sportapp://auth-callback adresi bir ekran değil;
// oturumu sign-in ekranı kuruyor, burada sadece yönlendirmeyi engelliyoruz.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes('auth-callback')) return null;
  } catch {}
  return path;
}
