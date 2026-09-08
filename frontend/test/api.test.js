import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFilteredQuestions, fetchReview } from '../src/api';

describe('api - fetchFilteredQuestions & fetchReview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('serializa corretamente os parametros em camelCase emitidos pelo FilterPanel', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
    global.fetch = fetchMock;

    await fetchFilteredQuestions({
      materia: 'Sistemas Operacionais, Redes e Nuvem',
      contentIds: [54, 55],
      searchQuery: 'protocolo',
      apenasErros: true
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('materia=Sistemas+Operacionais%2C+Redes+e+Nuvem');
    expect(calledUrl).toContain('content_ids=54%2C55');
    expect(calledUrl).toContain('q=protocolo');
    expect(calledUrl).toContain('apenas_erros=true');
  });

  it('serializa corretamente os parametros em snake_case', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
    global.fetch = fetchMock;

    await fetchFilteredQuestions({
      materia: 'Banco de Dados',
      content_ids: [1],
      q: 'ACID',
      apenas_erros: true
    });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('materia=Banco+de+Dados');
    expect(calledUrl).toContain('content_ids=1');
    expect(calledUrl).toContain('q=ACID');
    expect(calledUrl).toContain('apenas_erros=true');
  });

  it('serializa contentIds para fetchReview', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ review_items: [] })
    });
    global.fetch = fetchMock;

    await fetchReview({
      materia: 'Seguranca',
      contentIds: [10, 20]
    });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('materia=Seguranca');
    expect(calledUrl).toContain('content_ids=10%2C20');
  });
});
