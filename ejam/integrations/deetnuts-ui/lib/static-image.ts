export type StaticImageSource = {
  webp: string;
  fallback: string;
  blurDataURL?: string;
};

export type LoopIllustrationSource = {
  poster: StaticImageSource;
  webm: string;
};

export const EXAM_LOGO_SIZE = 36;
export const EXAM_LOGO_ASSET_PX = 72;

export const EXAM_LOGOS = {
  "jee-main": {
    webp: "/ejam/exams/jee_main.webp",
    fallback: "/ejam/exams/jee_main.webp",
  },
  "jee-advanced": {
    webp: "/ejam/exams/jee_adv.webp",
    fallback: "/ejam/exams/jee_adv.webp",
  },
  "mht-cet": {
    webp: "/ejam/exams/mht_cet.webp",
    fallback: "/ejam/exams/mht_cet.webp",
  },
} as const satisfies Record<string, StaticImageSource>;

export const PREDICTOR_ILLUSTRATIONS = {
  empty: {
    poster: {
      webp: "/ejam/media/empty.webp",
      fallback: "/ejam/media/empty.webp",
      blurDataURL:
        "data:image/webp;base64,UklGRrAAAABXRUJQVlA4WAoAAAAQAAAABwAABwAAQUxQSD0AAAABYBPZtpPzswMEUCEEa3Q5eshggR4JCKHLIiIiQWqF4GdB4hfrEaJJruuK0ETn3gUYiqsFhBdvU+BAA1YAAFZQOCBMAAAA0AEAnQEqCAAIAAOAWiWQAnQA9B0QNgAA/uiGNnCRtbwKhfX1+o1nhlPyiUSLmYR8ycEkmF+NOnPXgWn5VINnee9NuCojRAa98tQAAA==",
    },
    webm: "/ejam/media/empty.webm",
  },
  error: {
    poster: {
      webp: "/ejam/media/404.webp",
      fallback: "/ejam/media/404.webp",
      blurDataURL:
        "data:image/webp;base64,UklGRrAAAABXRUJQVlA4WAoAAAAQAAAABwAABwAAQUxQSD8AAAABYFJr25Pn+0eDX7MakIRUyL0cDrUy4KlAEdwOEREJymiEnwVFVK1HgiG7rqvHkJ77FGMprh4QN2yjpwQDaAAAVlA4IEoAAACQAQCdASoIAAgAA4BaJQAAXOsnYgAA/uiGNnCRtcMus0nuSUmbt/8sY8S3QACl8mdGZHqhd2RWv7QC2URIDTX74eIDp8tTxAAAAA==",
    },
    webm: "/ejam/media/404.webm",
  },
} as const satisfies Record<string, LoopIllustrationSource>;

export const COLLEGE_PREDICTOR_LCP_PRELOAD =
  PREDICTOR_ILLUSTRATIONS.empty.poster.webp;
