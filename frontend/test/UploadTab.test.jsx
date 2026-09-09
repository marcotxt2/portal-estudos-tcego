// @spec:AC-010 @spec:AC-013 @spec:AC-014 @spec:AC-015 @spec:AC-018 @spec:AC-021
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import UploadTab from '../src/components/UploadTab';
import { UploadProvider } from '../src/context/UploadContext';
import * as api from '../src/api';

vi.mock('../src/api', () => ({
  fetchModules: vi.fn(),
  uploadPdf: vi.fn(),
  fetchUploadStatus: vi.fn(),
  fetchUploads: vi.fn(),
}));

// Helper: renderiza UploadTab dentro do Provider obrigatorio
function renderUploadTab(props = {}) {
  const onUploadComplete = props.onUploadComplete ?? vi.fn();
  return render(
    <UploadProvider onUploadComplete={onUploadComplete}>
      <UploadTab />
    </UploadProvider>
  );
}

describe('UploadTab', () => {
  const mockModules = [
    { id: 1, name: 'Módulo 1' },
    { id: 2, name: 'Módulo 2' },
  ];

  let intervalCb = null;

  beforeEach(() => {
    vi.resetAllMocks();
    api.fetchModules.mockResolvedValue(mockModules);
    api.fetchUploads.mockResolvedValue([]);

    // Mock localStorage para nao interferir nos testes
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] ?? null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

    // Mock setInterval manualmente para nao quebrar o waitFor do RTL
    const originalSetInterval = global.setInterval;
    vi.stubGlobal('setInterval', (cb, ms, ...args) => {
      if (ms === 3000) {
        intervalCb = cb;
        return 123;
      }
      return originalSetInterval(cb, ms, ...args);
    });
    vi.stubGlobal('clearInterval', vi.fn());
  });

  afterEach(() => {
    intervalCb = null;
    vi.unstubAllGlobals();
  });

  it('renders modules select and dropzone', async () => {
    renderUploadTab();

    expect(await screen.findByText('Módulo 1')).toBeInTheDocument();
    expect(screen.getByText('Arraste PDFs ou clique para selecionar')).toBeInTheDocument();
  });

  it('handles multiple files upload', async () => {
    // @spec:AC-013
    api.uploadPdf.mockResolvedValue({ task_id: 'task-123' });

    renderUploadTab();

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'Módulo 1' } });

    const file1 = new File(['dummy content 1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['dummy content 2'], 'test2.pdf', { type: 'application/pdf' });

    const input = document.getElementById('pdf-input');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1, file2] } });
    });

    expect(await screen.findByText('test1.pdf')).toBeInTheDocument();
    expect(await screen.findByText('test2.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 arquivos')).toBeInTheDocument();

    expect(api.uploadPdf).toHaveBeenCalledTimes(2);
  });

  it('polls status and displays progress bar steps', async () => {
    // @spec:AC-010 @spec:AC-019
    api.uploadPdf.mockResolvedValue({ task_id: 'task-123' });
    api.fetchUploadStatus
      .mockResolvedValueOnce({ status: 'processing', processed_chunks: 2, total_chunks: 10 })
      .mockResolvedValueOnce({ status: 'completed', processed_chunks: 10, total_chunks: 10 });

    renderUploadTab();

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'Módulo 1' } });

    const file1 = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.getElementById('pdf-input');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1] } });
    });

    // pending state
    await waitFor(() => {
      expect(screen.getByText('Preparando chunks...')).toBeInTheDocument();
    });

    // trigger interval 1 (processing)
    await act(async () => {
      if (intervalCb) await intervalCb();
    });

    await waitFor(() => {
      expect(screen.getByText('Analisando com IA (2/10 chunks)')).toBeInTheDocument();
    });

    // trigger interval 2 (completed)
    await act(async () => {
      if (intervalCb) await intervalCb();
    });

    await waitFor(() => {
      expect(screen.getByText('Extracao concluida')).toBeInTheDocument();
    });
  });

  it('maps gemini errors correctly', async () => {
    // @spec:AC-015
    api.uploadPdf.mockResolvedValue({ task_id: 'task-err' });
    api.fetchUploadStatus.mockResolvedValueOnce({
      status: 'error',
      error_message: 'Quota exceeded (429 RESOURCE_EXHAUSTED)',
    });

    renderUploadTab();

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'Módulo 1' } });

    const file1 = new File(['dummy content'], 'error.pdf', { type: 'application/pdf' });
    const input = document.getElementById('pdf-input');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file1] } });
    });

    // trigger interval to get error status
    await act(async () => {
      if (intervalCb) await intervalCb();
    });

    await waitFor(() => {
      expect(screen.getByText('Cota da IA esgotada. Aguarde alguns minutos e tente novamente.')).toBeInTheDocument();
    });
  });

  it('handles drag over and drop', async () => {
    // @spec:AC-014
    renderUploadTab();

    const dropzoneText = await screen.findByText('Arraste PDFs ou clique para selecionar');
    const dropzone = dropzoneText.closest('div').parentElement;

    fireEvent.dragOver(dropzone);

    await waitFor(() => {
      expect(screen.getByText('Solte os arquivos aqui')).toBeInTheDocument();
    });

    fireEvent.dragLeave(dropzone);

    await waitFor(() => {
      expect(screen.getByText('Arraste PDFs ou clique para selecionar')).toBeInTheDocument();
    });

    const file1 = new File(['dummy content'], 'drop.pdf', { type: 'application/pdf' });
    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'Módulo 1' } });
    api.uploadPdf.mockResolvedValue({ task_id: 'task-drop' });

    await act(async () => {
      fireEvent.drop(dropzone, { dataTransfer: { files: [file1] } });
    });

    expect(await screen.findByText('drop.pdf')).toBeInTheDocument();
  });

  it('displays extracted questions count when upload completes with count', async () => {
    api.uploadPdf.mockResolvedValue({ task_id: 'task-count' });
    api.fetchUploadStatus
      .mockResolvedValueOnce({
        status: 'completed',
        processed_chunks: 2,
        total_chunks: 2,
        extracted_questions_count: 8
      });

    renderUploadTab();

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'Módulo 1' } });

    const file = new File(['content'], 'apostila.pdf', { type: 'application/pdf' });
    const input = document.getElementById('pdf-input');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await act(async () => {
      if (intervalCb) await intervalCb();
    });

    await waitFor(() => {
      expect(screen.getByText('Extracao concluida (8 questoes extraidas)')).toBeInTheDocument();
    });
  });

  it('renders history of processed materials with extracted questions count', async () => {
    api.fetchUploads.mockResolvedValue([
      {
        id: 'hist-1',
        filename: 'direito_adm.pdf',
        module_name: 'Direito Administrativo',
        status: 'completed',
        extracted_questions_count: 15,
        created_at: '2026-09-08T10:00:00Z',
      },
    ]);

    renderUploadTab();

    expect(await screen.findByText('direito_adm.pdf')).toBeInTheDocument();
    expect(screen.getByText('15 questoes')).toBeInTheDocument();
    expect(screen.getByText('Concluido')).toBeInTheDocument();
  });
});
