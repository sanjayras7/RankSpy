import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ShareButton from "./ShareButton";

const MOCK_URL = "https://example.com";

function makeHashBytes(firstByte = 0x12) {
  const bytes = new Uint8Array(32);
  bytes[0] = firstByte;
  return bytes.buffer;
}

function hashFromBytes(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

beforeEach(() => {
  const mockDigest = vi.fn<[string, BufferSource], Promise<ArrayBuffer>>();
  mockDigest.mockResolvedValue(makeHashBytes());

  Object.defineProperty(globalThis, "crypto", {
    value: { subtle: { digest: mockDigest } },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn() },
    writable: true,
    configurable: true,
  });

  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ShareButton", () => {
  it("renders the share button in its initial state", () => {
    render(<ShareButton url={MOCK_URL} />);
    expect(screen.getByRole("button", { name: "Share Result" })).toBeInTheDocument();
  });

  it("shows 'Sharing...' while the request is in flight", async () => {
    let resolveFetch!: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => { resolveFetch = resolve; });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

    render(<ShareButton url={MOCK_URL} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share Result" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sharing..." })).toBeDisabled();
    });
    resolveFetch(new Response(JSON.stringify({}), { status: 200 }));
  });

  it("copies the share link to clipboard on success and shows 'Copied!'", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    render(<ShareButton url={MOCK_URL} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share Result" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
    });

    const hash = hashFromBytes(makeHashBytes());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `https://rankspy.com/r/${hash}`,
    );
  });

  it("shows an error message when the API returns 404", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "not_found", message: "Share link not found or expired" }), { status: 404 }),
    );

    render(<ShareButton url={MOCK_URL} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share Result" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Share link not found. Try re-analyzing the URL.",
      );
    });
  });

  it("shows an error message on network failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

    render(<ShareButton url={MOCK_URL} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share Result" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Failed to create share link. Check your connection.",
      );
    });
  });

  it("clears the error and retries when clicked again after an error", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    render(<ShareButton url={MOCK_URL} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share Result" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Failed to create share link. Check your connection.",
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share Result" }));
    });

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
    });
  });

  it("uses the same lowercase+notrailing normalization as the backend", async () => {
    const urlWithTrailingSlash = "https://Example.com/";
    const mockDigest = globalThis.crypto.subtle.digest as ReturnType<typeof vi.fn>;
    mockDigest.mockClear();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    render(<ShareButton url={urlWithTrailingSlash} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share Result" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
    });

    const encoder = new TextEncoder();
    expect(mockDigest).toHaveBeenCalledWith(
      "SHA-256",
      encoder.encode("https://example.com"),
    );
  });
});
