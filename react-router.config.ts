import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  allowedActionOrigins: ["munchkin-picker.localhost"],
} satisfies Config;
