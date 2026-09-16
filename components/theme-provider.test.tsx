import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTheme } from "next-themes";
import { ThemeProvider } from "@/components/theme-provider";

function mockMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function ThemeProbe() {
  const { resolvedTheme } = useTheme();
  return <span data-testid="resolved-theme">{resolvedTheme}</span>;
}

function renderWithTheme() {
  return render(
    <ThemeProvider defaultTheme="light" enableSystem={false}>
      <ThemeProbe />
      <input aria-label="일반 입력" />
      <textarea aria-label="여러 줄 입력" />
    </ThemeProvider>
  );
}

async function expectTheme(theme: "light" | "dark") {
  await waitFor(() =>
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent(theme)
  );
}

beforeEach(() => {
  mockMatchMedia();
  localStorage.clear();
  document.documentElement.className = "";
});

describe("ThemeProvider 다크모드 단축키", () => {
  it("일반 영역에서 'd' 키를 누르면 라이트/다크 테마가 토글된다", async () => {
    renderWithTheme();
    await expectTheme("light");

    fireEvent.keyDown(document.body, { key: "d" });
    await expectTheme("dark");

    fireEvent.keyDown(document.body, { key: "d" });
    await expectTheme("light");
  });

  it("input에 포커스된 상태에서는 'd'를 눌러도 테마가 바뀌지 않는다", async () => {
    renderWithTheme();
    await expectTheme("light");

    const input = screen.getByLabelText("일반 입력");
    fireEvent.keyDown(input, { key: "d" });

    await expectTheme("light");
  });

  it("textarea에 포커스된 상태에서는 'd'를 눌러도 테마가 바뀌지 않는다", async () => {
    renderWithTheme();
    await expectTheme("light");

    const textarea = screen.getByLabelText("여러 줄 입력");
    fireEvent.keyDown(textarea, { key: "d" });

    await expectTheme("light");
  });

  it("ctrl+d, meta+d, alt+d 조합에서는 테마가 바뀌지 않는다", async () => {
    renderWithTheme();
    await expectTheme("light");

    fireEvent.keyDown(document.body, { key: "d", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "d", metaKey: true });
    fireEvent.keyDown(document.body, { key: "d", altKey: true });

    await expectTheme("light");
  });

  it("repeat 이벤트(키 길게 누름)에서는 토글이 발생하지 않는다", async () => {
    renderWithTheme();
    await expectTheme("light");

    fireEvent.keyDown(document.body, { key: "d", repeat: true });

    await expectTheme("light");
  });

  it("대문자 'D' 입력에도 테마가 토글된다", async () => {
    renderWithTheme();
    await expectTheme("light");

    fireEvent.keyDown(document.body, { key: "D" });

    await expectTheme("dark");
  });
});
