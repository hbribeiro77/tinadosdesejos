import { describe, expect, it } from "vitest";
import {
  wishProductionViewerPublishIsConfiguredFromServerEnvV1,
  wishProductionViewerBaseUrlReadFromServerEnvV1,
} from "@/lib/wish-production-viewer-publish-env-read-from-server-v1";

describe("wishProductionViewerPublishEnvReadFromServerV1", () => {
  it("normaliza URL e exige URL + chave", () => {
    expect(
      wishProductionViewerBaseUrlReadFromServerEnvV1({
        WISH_PRODUCTION_VIEWER_BASE_URL: "https://tina.example.com/",
      }),
    ).toBe("https://tina.example.com");

    expect(
      wishProductionViewerPublishIsConfiguredFromServerEnvV1({
        WISH_PRODUCTION_VIEWER_BASE_URL: "https://tina.example.com",
        WISH_PRODUCTION_VIEWER_IMPORT_API_KEY: "secret",
      }),
    ).toBe(true);

    expect(
      wishProductionViewerPublishIsConfiguredFromServerEnvV1({
        WISH_PRODUCTION_VIEWER_BASE_URL: "https://tina.example.com",
        WISH_PRODUCTION_VIEWER_IMPORT_API_KEY: "",
      }),
    ).toBe(false);
  });
});
