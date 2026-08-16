import Navbar from "@/components/Navbar";
import GrainEffect from "@/components/graineffect";
import MotionWrapper from "@/components/MotionWrapper";
import RouteAwareFooter from "@/components/RouteAwareFooter";
import SanitizedGoogleAnalytics from "@/components/analytics/SanitizedGoogleAnalytics";
import RouteAwareHeader from "@/components/RouteAwareHeader";
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
        <div className="site-default-chrome">
          <Navbar />
        </div>
      </RouteAwareHeader>
      <MotionWrapper>{children}</MotionWrapper>
      <div className="site-default-chrome" aria-hidden="true">
        <GrainEffect />
      </div>
      <SanitizedGoogleAnalytics />
      <CookieConsent />
      <ThemeSettings />
      <RouteAwareFooter />
      <div className="fixed bottom-0 left-0 right-0 z-50"></div>
    </>
  );
}
