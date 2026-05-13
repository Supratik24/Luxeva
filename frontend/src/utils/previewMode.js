const previewFlag = import.meta.env.VITE_USE_PREVIEW_AUTH;

export const isPreviewAuthEnabled =
  previewFlag === "true" || (previewFlag !== "false" && import.meta.env.DEV);
