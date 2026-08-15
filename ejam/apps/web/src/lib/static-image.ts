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
    webp: "/exams/jee_main.webp",
    fallback: "/exams/jee_main.webp",
  },
  "jee-advanced": {
    webp: "/exams/jee_adv.webp",
    fallback: "/exams/jee_adv.webp",
  },
  "mht-cet": {
    webp: "/exams/mht_cet.webp",
    fallback: "/exams/mht_cet.webp",
  },
  bitsat: {
    webp: "/exams/bitsat.webp",
    fallback: "/exams/bitsat.webp",
  },
} as const satisfies Record<string, StaticImageSource>;

export const PREDICTOR_ILLUSTRATIONS = {
  empty: {
    poster: {
      webp: "/media/empty.webp",
      fallback: "/media/empty.webp",
      blurDataURL:
        "data:image/webp;base64,UklGRrAAAABXRUJQVlA4WAoAAAAQAAAABwAABwAAQUxQSD0AAAABYBPZtpPzswMEUCEEa3Q5eshggR4JCKHLIiIiQWqF4GdB4hfrEaJJruuK0ETn3gUYiqsFhBdvU+BAA1YAAFZQOCBMAAAA0AEAnQEqCAAIAAOAWiWQAnQA9B0QNgAA/uiGNnCRtbwKhfX1+o1nhlPyiUSLmYR8ycEkmF+NOnPXgWn5VINnee9NuCojRAa98tQAAA==",
    },
    webm: "/media/empty.webm",
  },
  error: {
    poster: {
      webp: "/media/404.webp",
      fallback: "/media/404.webp",
      blurDataURL:
        "data:image/webp;base64,UklGRrAAAABXRUJQVlA4WAoAAAAQAAAABwAABwAAQUxQSD8AAAABYFJr25Pn+0eDX7MakIRUyL0cDrUy4KlAEdwOEREJymiEnwVFVK1HgiG7rqvHkJ77FGMprh4QN2yjpwQDaAAAVlA4IEoAAACQAQCdASoIAAgAA4BaJQAAXOsnYgAA/uiGNnCRtcMus0nuSUmbt/8sY8S3QACl8mdGZHqhd2RWv7QC2URIDTX74eIDp8tTxAAAAA==",
    },
    webm: "/media/404.webm",
  },
} as const satisfies Record<string, LoopIllustrationSource>;

export const PREDICTOR_CARD_ART = {
  webp: "/media/predict.webp",
  fallback: "/media/predict.webp",
} as const satisfies StaticImageSource;

export const COLLEGE_PREDICTOR_LCP_PRELOAD =
  PREDICTOR_ILLUSTRATIONS.empty.poster.webp;
