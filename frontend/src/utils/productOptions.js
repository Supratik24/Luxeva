const COLOR_CONFIG = {
  blue: {
    swatch: "#5a8fb7",
    border: "#3f6f93",
    surface: "radial-gradient(circle at top, rgba(141, 190, 226, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(90, 143, 183, 0.18)"
  },
  pink: {
    swatch: "#d58faf",
    border: "#b16d8a",
    surface: "radial-gradient(circle at top, rgba(232, 177, 202, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(213, 143, 175, 0.18)"
  },
  mustard: {
    swatch: "#c49a2d",
    border: "#9a7721",
    surface: "radial-gradient(circle at top, rgba(233, 204, 123, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(196, 154, 45, 0.18)"
  },
  black: {
    swatch: "#1f1f1f",
    border: "#101010",
    surface: "radial-gradient(circle at top, rgba(93, 93, 93, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(31, 31, 31, 0.22)"
  },
  navy: {
    swatch: "#1f3d68",
    border: "#162947",
    surface: "radial-gradient(circle at top, rgba(84, 118, 169, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(31, 61, 104, 0.2)"
  },
  olive: {
    swatch: "#687442",
    border: "#4b5530",
    surface: "radial-gradient(circle at top, rgba(164, 180, 122, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(104, 116, 66, 0.18)"
  },
  grey: {
    swatch: "#7f8791",
    border: "#5d636c",
    surface: "radial-gradient(circle at top, rgba(195, 201, 208, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(127, 135, 145, 0.16)"
  },
  gray: {
    swatch: "#7f8791",
    border: "#5d636c",
    surface: "radial-gradient(circle at top, rgba(195, 201, 208, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(127, 135, 145, 0.16)"
  },
  white: {
    swatch: "#f5f3eb",
    border: "#d4d0c6",
    surface: "radial-gradient(circle at top, rgba(255, 255, 255, 0.55), rgba(246, 240, 230, 0.9) 60%)",
    overlay: "rgba(255, 255, 255, 0.12)"
  },
  beige: {
    swatch: "#dcc7aa",
    border: "#b49c7d",
    surface: "radial-gradient(circle at top, rgba(237, 220, 192, 0.4), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(220, 199, 170, 0.16)"
  },
  taupe: {
    swatch: "#98867b",
    border: "#76655c",
    surface: "radial-gradient(circle at top, rgba(195, 179, 170, 0.4), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(152, 134, 123, 0.16)"
  },
  brown: {
    swatch: "#6d4c3d",
    border: "#54372b",
    surface: "radial-gradient(circle at top, rgba(185, 141, 118, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(109, 76, 61, 0.18)"
  },
  silver: {
    swatch: "#bac3cb",
    border: "#8d98a1",
    surface: "radial-gradient(circle at top, rgba(216, 223, 229, 0.45), rgba(255, 255, 255, 0.9) 58%)",
    overlay: "rgba(186, 195, 203, 0.14)"
  },
  standard: {
    swatch: "#d4b483",
    border: "#b28f5d",
    surface: "radial-gradient(circle at top, rgba(230, 206, 166, 0.35), rgba(255, 255, 255, 0.82) 58%)",
    overlay: "rgba(212, 180, 131, 0.12)"
  }
};

export const normalizeColorName = (value = "") => String(value).trim().toLowerCase();

export const getColorConfig = (value = "") => {
  const key = normalizeColorName(value);
  return (
    COLOR_CONFIG[key] || {
      swatch: "#c79f7c",
      border: "#9f7858",
      surface: "radial-gradient(circle at top, rgba(226, 191, 164, 0.35), rgba(255, 255, 255, 0.82) 58%)",
      overlay: "rgba(199, 159, 124, 0.14)"
    }
  );
};

export const hasRealColorOptions = (colors = []) =>
  Array.isArray(colors) && colors.length > 0 && !colors.every((color) => normalizeColorName(color) === "standard");

export const hasVariantImageOptions = (product) => {
  const variantImages = product?.variantImages || {};
  return Object.keys(variantImages).length > 1;
};

export const getVariantImage = (product, selectedColor = "") => {
  const variantImages = product?.variantImages || {};
  const exact = variantImages[selectedColor];
  if (exact) {
    return { url: exact, alt: `${product?.name || "Product"} in ${selectedColor}` };
  }

  const firstVariant = Object.entries(variantImages)[0];
  if (firstVariant) {
    return { url: firstVariant[1], alt: `${product?.name || "Product"} in ${firstVariant[0]}` };
  }

  return product?.images?.[0] || null;
};
