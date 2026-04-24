export const MOBILE_FILTER_TOAST_ID = "state-cutoff-mobile-filters-panel";

export interface MobileFilterToastConfig {
  id: string;
  position: "bottom-center";
  duration?: number;
  dismissible?: boolean;
  unstyled?: boolean;
}

export const getMobileFilterToastConfig = (): MobileFilterToastConfig => ({
  id: MOBILE_FILTER_TOAST_ID,
  position: "bottom-center",
  duration: Infinity,
  dismissible: false,
  unstyled: true,
});

export const openMobileFilterToast = (
  showToast: (config: MobileFilterToastConfig) => string | number,
  dismissToast: (toastId?: string | number) => void,
): string | number => {
  dismissToast(MOBILE_FILTER_TOAST_ID);
  return showToast(getMobileFilterToastConfig());
};

export const closeMobileFilterToast = (
  dismissToast: (toastId?: string | number) => void,
): null => {
  dismissToast(MOBILE_FILTER_TOAST_ID);
  return null;
};

export const shouldAutoDismissMobileFilterToast = (
  viewportWidth: number,
): boolean => {
  return viewportWidth >= 1024;
};
