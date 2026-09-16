// @spec:AC-076
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReviewPendingTab from "../src/components/ReviewPendingTab";
import * as api from "../src/api";

vi.mock("../src/api", () => ({
  fetchPendingReview: vi.fn(),
  fetchContents: vi.fn(),
  classifyPendingQuestion: vi.fn(),
  discardPendingQuestion: vi.fn(),
}));

describe("ReviewPendingTab", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.fetchContents.mockResolvedValue([
      { id: 1, materia: "Banco de Dados", topico: "SQL" },
    ]);
  });

  it("@spec:AC-076 exibe lista de questoes pendentes e permite classificar ou descartar", async () => {
    api.fetchPendingReview.mockResolvedValue([
      {
        id: 99,
        statement: "Questao pendente de teste",
        options: { A: "Op 1", B: "Op 2" },
        question_number: 1,
        suggested_materia: "Banco de Dados",
        suggested_topico: "SQL",
      },
    ]);

    render(<ReviewPendingTab />);

    expect(await screen.findByText(/Questao pendente de teste/i)).toBeInTheDocument();
    expect(screen.getByText(/Sugestao Gemini: Banco de Dados \/ SQL/i)).toBeInTheDocument();

    const discardBtn = screen.getByText("Descartar");
    expect(discardBtn).toBeInTheDocument();

    api.discardPendingQuestion.mockResolvedValue({ message: "Questao descartada." });
    fireEvent.click(discardBtn);

    await waitFor(() => {
      expect(api.discardPendingQuestion).toHaveBeenCalledWith(99);
    });
  });
});
