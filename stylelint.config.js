/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  rules: {
    // CSS Modules class names are read from TypeScript, so they are camelCase.
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]*$",
      { message: (selector) => `Expected "${selector}" to be camelCase` },
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      { ignorePseudoClasses: ["global"] },
    ],
    // Range syntax, such as (width >= 768px), needs Safari 16.4.
    "media-feature-range-notation": "prefix",
    // Safari before 15.4 needs the prefixed forms of these properties.
    "property-no-vendor-prefix": [
      true,
      {
        ignoreProperties: [
          "-webkit-mask-image",
          "-webkit-mask-composite",
          "-webkit-backdrop-filter",
        ],
      },
    ],
  },
};
