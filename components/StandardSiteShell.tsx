import Navbar from "@/components/Navbar";
import GrainEffect from "@/components/graineffect";
import MotionWrapper from "@/components/MotionWrapper";
import RouteAwareFooter from "@/components/RouteAwareFooter";
import SanitizedGoogleAnalytics from "@/components/analytics/SanitizedGoogleAnalytics";

export default function StandardSiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="site-default-chrome">
        <Navbar />
      </div>
      <MotionWrapper>{children}</MotionWrapper>
      <div className="site-default-chrome" aria-hidden="true">
        <GrainEffect />
      </div>
      <SanitizedGoogleAnalytics />
      <RouteAwareFooter />
      <div className="fixed bottom-0 left-0 right-0 z-50"></div>
    </>
  );
}
