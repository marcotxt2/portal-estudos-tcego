"""
Testes do har_miner.py
@spec:AC-079
"""
import json
import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from har_miner import parse_question_block

SAMPLE_BLOCK = """
<div data-question-id="1234567" data-discipline-id="96">
  <div class="q-question-header">
    <div class="q-ref">
      <div class="q-id">
        <a target="_blank" href="/questoes-de-concursos/questoes/abc-123">Q1234567</a>
      </div>
    </div>
  </div>
  <div class="q-question-breadcrumb">
    <a href="/disciplinas/banco-de-dados">Banco de Dados</a>
    <a href="/disciplinas/banco-de-dados/transacoes">Gerencia de Transacoes</a>
  </div>
  <div class="q-question-info">
    <span><strong>Ano: </strong>2026</span>
    <span><strong>Banca: </strong><a href="/bancas/fcc">FCC</a></span>
    <span><strong>Orgao: </strong><a href="/concursos/artesp">ARTESP</a></span>
    <span class="q-exams">
      <strong>Prova: </strong>
      <a href="/provas/fcc-2026-artesp-agente-ti">FCC - 2026 - ARTESP - Agente de TI</a>
    </span>
  </div>
  <div class="q-question-enunciation"
       aria-label="Enunciado da questao sobre transacoes atomicas">
    Enunciado da questao sobre transacoes atomicas
  </div>
  <div class="q-question-options">
    <fieldset>
      <div>
        <label class="q-radio-button js-choose-alternative">
          <input type="radio" name="answer-question-1234567" value="A">
          <span class="q-option-item">A</span>
          <div class="q-item-enum js-alternative-content">Alternativa A</div>
        </label>
      </div>
      <div>
        <label class="q-radio-button js-choose-alternative">
          <input type="radio" name="answer-question-1234567" value="B">
          <span class="q-option-item">B</span>
          <div class="q-item-enum js-alternative-content">Alternativa B</div>
        </label>
      </div>
      <div>
        <label class="q-radio-button js-choose-alternative">
          <input type="radio" name="answer-question-1234567" value="C">
          <span class="q-option-item">C</span>
          <div class="q-item-enum js-alternative-content">Alternativa C</div>
        </label>
      </div>
      <div>
        <label class="q-radio-button js-choose-alternative">
          <input type="radio" name="answer-question-1234567" value="D">
          <span class="q-option-item">D</span>
          <div class="q-item-enum js-alternative-content">Alternativa D</div>
        </label>
      </div>
      <div>
        <label class="q-radio-button js-choose-alternative">
          <input type="radio" name="answer-question-1234567" value="E">
          <span class="q-option-item">E</span>
          <div class="q-item-enum js-alternative-content">Alternativa E</div>
        </label>
      </div>
    </fieldset>
  </div>
</div>
"""


class TestParseQuestionBlock:
    """@spec:AC-079"""

    def test_extracts_qc_id(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert q is not None
        assert q["qc_id"] == "1234567"

    def test_extracts_enunciado(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert "transacoes atomicas" in q["enunciado"]

    def test_extracts_five_alternativas(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert set(q["alternativas"].keys()) == {"A", "B", "C", "D", "E"}

    def test_alternativa_text(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert "Alternativa A" in q["alternativas"]["A"]

    def test_correct_option_is_null(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert q["correct_option"] is None

    def test_is_ai_generated_true(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert q["is_ai_generated"] is True

    def test_explanation_is_null(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert q["explanation"] is None

    def test_extracts_disciplina(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert q["disciplina"] == "Banco de Dados"

    def test_extracts_banca(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert q["banca"] == "FCC"

    def test_extracts_ano(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert q["ano"] == 2026

    def test_source_url_format(self):
        q = parse_question_block(SAMPLE_BLOCK)
        assert "qconcursos.com" in q["source_url"]
        assert "1234567" in q["source_url"]

    def test_returns_none_for_empty_block(self):
        q = parse_question_block("<div>sem questao</div>")
        assert q is None
