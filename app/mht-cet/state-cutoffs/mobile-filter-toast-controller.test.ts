import assert from "node:assert/strict";
import test from "node:test";

import {
  closeMobileFilterToast,
  getMobileFilterToastConfig,
  MOBILE_FILTER_TOAST_ID,
  openMobileFilterToast,
  shouldAutoDismissMobileFilterToast,
} from "./mobile-filter-toast-controller";

test("getMobileFilterToastConfig returns the fixed Sonner target", () => {
  assert.deepEqual(getMobileFilterToastConfig(), {
    id: MOBILE_FILTER_TOAST_ID,
    position: "bottom-center",
    duration: Infinity,
    dismissible: false,
    unstyled: true,
  });
});

test("openMobileFilterToast dismisses any existing instance before showing", () => {
  const calls: string[] = [];

  const nextToastId = openMobileFilterToast(
    (config) => {
      calls.push(`show:${config.id}:${config.position}:${config.duration}`);
      return config.id;
    },
    (toastId) => {
      calls.push(`dismiss:${toastId}`);
    },
  );

  assert.equal(nextToastId, MOBILE_FILTER_TOAST_ID);
  assert.deepEqual(calls, [
    `dismiss:${MOBILE_FILTER_TOAST_ID}`,
    `show:${MOBILE_FILTER_TOAST_ID}:bottom-center:Infinity`,
  ]);
});

test("closeMobileFilterToast dismisses the fixed mobile filter toast", () => {
  const calls: string[] = [];

  const result = closeMobileFilterToast((toastId) => {
    calls.push(`dismiss:${toastId}`);
  });

  assert.equal(result, null);
  assert.deepEqual(calls, [`dismiss:${MOBILE_FILTER_TOAST_ID}`]);
});

test("shouldAutoDismissMobileFilterToast only closes at desktop widths", () => {
  assert.equal(shouldAutoDismissMobileFilterToast(375), false);
  assert.equal(shouldAutoDismissMobileFilterToast(1023), false);
  assert.equal(shouldAutoDismissMobileFilterToast(1024), true);
  assert.equal(shouldAutoDismissMobileFilterToast(1440), true);
});
