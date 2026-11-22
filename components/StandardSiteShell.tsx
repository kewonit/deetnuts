import MotionWrapper from "@/components/MotionWrapper";
import SanitizedGoogleAnalytics from "@/components/analytics/SanitizedGoogleAnalytics";
import RouteAwareHeader from "@/components/RouteAwareHeader";
import { SiteNavbar } from "@/components/site-nav/SiteNavbar";
import CookieConsent from "@/components/analytics/CookieConsent";
import ThemeSettings from "@/components/theme/ThemeSettings";

// Each page brings its own body and footer: MhtShell for most of the site, while
// TimeKeeper and the college predictor have their own designs.
export default function StandardSiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RouteAwareHeader>
        <SiteNavbar />
      </RouteAwareHeader>
      <MotionWrapper>{children}</MotionWrapper>
      <SanitizedGoogleAnalytics />
      <CookieConsent />
      <ThemeSettings />
    </>
  );
}
