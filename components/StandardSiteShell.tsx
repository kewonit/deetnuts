import GrainEffect from "@/components/graineffect";
import MotionWrapper from "@/components/MotionWrapper";
import RouteAwareFooter from "@/components/RouteAwareFooter";
import SanitizedGoogleAnalytics from "@/components/analytics/SanitizedGoogleAnalytics";
import RouteAwareHeader, { RouteAwareGrain } from "@/components/RouteAwareHeader";
import { SiteNavbar } from "@/components/site-nav/SiteNavbar";
import CookieConsent from "@/components/analytics/CookieConsent";
import ThemeSettings from "@/components/theme/ThemeSettings";

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
      <RouteAwareGrain>
        <div className="site-default-chrome" aria-hidden="true">
          <GrainEffect />
        </div>
      </RouteAwareGrain>
      <SanitizedGoogleAnalytics />
      <CookieConsent />
      <ThemeSettings />
      <RouteAwareFooter />
      <div className="fixed bottom-0 left-0 right-0 z-50"></div>
    </>
  );
}
