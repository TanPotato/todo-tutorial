import { act, renderHook, waitFor } from "@testing-library/react";
import { useTodos } from "@/hooks/use-todos";

beforeEach(() => {
  localStorage.clear();
});

describe("useTodos 우선순위", () => {
  it("addTodo에 전달한 우선순위로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "high");
    });

    expect(result.current.todos[0]).toMatchObject({
      text: "장보기",
      priority: "high",
      completed: false,
    });
  });

  it("우선순위를 생략하면 기본값(medium)으로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].priority).toBe("medium");
  });

  it("priority가 없는 기존 저장 데이터는 medium으로 보정해 로드한다", async () => {
    localStorage.setItem(
      "todos",
      JSON.stringify([{ id: "1", text: "구버전 할 일", completed: false }])
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].priority).toBe("medium");
  });

  it("추가한 우선순위를 localStorage에 저장한다", async () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "low");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "[]");
      expect(stored[0]?.priority).toBe("low");
    });
  });
});

describe("useTodos 마감일", () => {
  it("addTodo에 전달한 마감일로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("회의", "medium", "2026-07-01");
    });

    expect(result.current.todos[0]).toMatchObject({
      text: "회의",
      dueDate: "2026-07-01",
    });
  });

  it("마감일을 생략하면 dueDate 없이 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].dueDate).toBeUndefined();
  });

  it("새로 추가한 Todo에는 생성 시각(createdAt)이 기록된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("회의");
    });

    expect(typeof result.current.todos[0].createdAt).toBe("number");
  });

  it("createdAt이 없는 기존 데이터는 number로 보정해 로드한다", async () => {
    localStorage.setItem(
      "todos",
      JSON.stringify([
        { id: "1", text: "구버전 할 일", completed: false, priority: "medium" },
      ])
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(typeof result.current.todos[0].createdAt).toBe("number");
  });
});

describe("useTodos 카테고리", () => {
  it("addTodo에 전달한 카테고리로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("보고서", "medium", undefined, "work");
    });

    expect(result.current.todos[0].category).toBe("work");
  });

  it("카테고리를 생략하면 category 없이 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].category).toBeUndefined();
  });
});

describe("useTodos 손상 데이터 보호", () => {
  it("파싱할 수 없는 저장값을 빈 배열로 덮어쓰지 않는다", async () => {
    localStorage.setItem("todos", "{이건 JSON이 아님");

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toEqual([]);
    // 손상된 원본이 보존돼 복구 여지가 남아야 한다
    expect(localStorage.getItem("todos")).toBe("{이건 JSON이 아님");
  });

  it("배열이 아닌 저장값도 덮어쓰지 않는다", async () => {
    localStorage.setItem("todos", JSON.stringify({ x: 1 }));

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toEqual([]);
    expect(localStorage.getItem("todos")).toBe('{"x":1}');
  });

  it("손상 데이터 로드 후 새 항목을 추가하면 정상적으로 저장된다", async () => {
    localStorage.setItem("todos", "{이건 JSON이 아님");

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.addTodo("새 할 일");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "null");
      expect(Array.isArray(stored)).toBe(true);
      expect(stored[0]?.text).toBe("새 할 일");
    });
  });
});

describe("useTodos addTodo 가드", () => {
  it("빈 문자열로 호출하면 추가되지 않는다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("");
    });

    expect(result.current.todos).toHaveLength(0);
  });

  it("공백만 있는 문자열로 호출하면 추가되지 않는다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("   ");
    });

    expect(result.current.todos).toHaveLength(0);
  });

  it("가드에 막힌 뒤 정상 텍스트로 호출하면 정상적으로 추가된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("   ");
      result.current.addTodo("정상 텍스트");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe("정상 텍스트");
  });
});

describe("useTodos editTodo", () => {
  it("공백만으로 편집하면 해당 항목이 삭제된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "   ");
    });

    expect(result.current.todos).toHaveLength(0);
  });

  it("앞뒤 공백을 trim하여 저장한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "  수정된 텍스트  ");
    });

    expect(result.current.todos[0].text).toBe("수정된 텍스트");
  });

  it("존재하지 않는 id로 편집하면 목록이 변경되지 않는다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const before = result.current.todos;

    act(() => {
      result.current.editTodo("존재하지-않는-id", "새로운 텍스트");
    });

    expect(result.current.todos).toEqual(before);
  });
});

describe("useTodos toggleTodo", () => {
  it("지정한 항목만 completed를 반전시키고 나머지는 그대로 유지한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("첫번째");
      result.current.addTodo("두번째");
      result.current.addTodo("세번째");
    });
    const targetId = result.current.todos[1].id;

    act(() => {
      result.current.toggleTodo(targetId);
    });

    expect(
      result.current.todos.find((todo) => todo.id === targetId)?.completed
    ).toBe(true);
    expect(
      result.current.todos.filter((todo) => todo.id !== targetId)
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ completed: false })])
    );
    expect(
      result.current.todos.filter((todo) => todo.id !== targetId).length
    ).toBe(2);
  });

  it("같은 id로 두 번 연속 토글하면 원래 상태로 돌아온다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.toggleTodo(id);
    });
    act(() => {
      result.current.toggleTodo(id);
    });

    expect(result.current.todos[0].completed).toBe(false);
  });

  it("존재하지 않는 id로 토글하면 목록이 변경되지 않는다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const before = result.current.todos;

    act(() => {
      result.current.toggleTodo("존재하지-않는-id");
    });

    expect(result.current.todos).toEqual(before);
  });
});

describe("useTodos deleteTodo", () => {
  it("지정한 id만 삭제하고 나머지는 순서를 유지한 채 남는다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("첫번째");
      result.current.addTodo("두번째");
      result.current.addTodo("세번째");
    });
    const remaining = [
      result.current.todos[0].id,
      result.current.todos[2].id,
    ];
    const targetId = result.current.todos[1].id;

    act(() => {
      result.current.deleteTodo(targetId);
    });

    expect(result.current.todos.map((todo) => todo.id)).toEqual(remaining);
  });

  it("삭제 결과가 localStorage에도 반영된다", async () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.deleteTodo(id);
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "[]");
      expect(stored).toEqual([]);
    });
  });

  it("존재하지 않는 id로 삭제해도 목록이 변경되지 않는다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const before = result.current.todos;

    act(() => {
      result.current.deleteTodo("존재하지-않는-id");
    });

    expect(result.current.todos).toEqual(before);
  });
});
