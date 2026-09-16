// @spec:AC-073
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import QuestionViewer from "../src/components/QuestionViewer";

vi.mock("../src/api", () => ({
  submitAnswer: vi.fn(),
}));

describe("QuestionViewer", () => {
  const sampleQuestion = {
    id: 101,
    statement: "Qual o padrao de projeto Singleton?",
    options: { A: "Criacional", B: "Estrutural" },
    correct_option: "A",
    source_type: "exam",
    question_number: 15,
    exam: { cargo: "Analista TI", ano: 2024 },
  };

  it("@spec:AC-073 renderiza o badge de origem FCC no card da questao", () => {
    render(
      <QuestionViewer
        question={sampleQuestion}
        questionIndex={0}
        totalQuestions={1}
        savedAnswer={null}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        isFirst={true}
        isLast={true}
      />
    );

    expect(screen.getByText("FCC | Analista TI | 2024 | Q.15")).toBeInTheDocument();
  });
});
