// @spec:AC-011 @spec:AC-009 @spec:AC-021
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';
import * as api from '../src/api';
import { ThemeProvider } from '../src/context/ThemeContext';

vi.mock('../src/api', () => ({
  fetchModules: vi.fn(),
  fetchDailySession: vi.fn(),
  fetchSessionByModule: vi.fn(),
  uploadPdf: vi.fn(),
  fetchUploadStatus: vi.fn(),
}));

// Helper: renderiza App com todos os Providers externos necessarios
// Os Providers internos (UploadProvider, QuestionsProvider) ja estao dentro do App.
function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

describe('App', () => {
  let intervalCb = null;

  beforeEach(() => {
    vi.resetAllMocks();

    const originalSetInterval = global.setInterval;
    vi.stubGlobal('setInterval', (cb, ms, ...args) => {
      if (ms === 3000) {
        intervalCb = cb;
        return 123;
      }
      return originalSetInterval(cb, ms, ...args);
    });
    vi.stubGlobal('clearInterval', vi.fn());

    // Mock localStorage e sessionStorage para isolar contextos
    const storageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] ?? null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: storageMock, writable: true });
    Object.defineProperty(window, 'sessionStorage', { value: { ...storageMock }, writable: true });

    api.fetchDailySession.mockResolvedValue({ theories: [], questions: [] });
    api.fetchSessionByModule.mockResolvedValue({ theories: [], questions: [] });
    api.fetchModules.mockResolvedValue([
      { id: 1, name: 'Initial Module' }
    ]);
  });

  afterEach(() => {
    intervalCb = null;
    vi.unstubAllGlobals();
  });

  it('re-fetches modules silently when upload completes without F5', async () => {
    // @spec:AC-011 @spec:AC-009 @spec:AC-019
    renderApp();

    expect(await screen.findByText('Initial Module')).toBeInTheDocument();
    expect(api.fetchModules).toHaveBeenCalledTimes(1);

    const uploadTabBtn = screen.getByText('Upload PDF');
    act(() => {
      uploadTabBtn.click();
    });

    api.fetchModules.mockResolvedValue([
      { id: 1, name: 'Initial Module' },
      { id: 2, name: 'New Module Uploaded' }
    ]);

    api.uploadPdf.mockResolvedValue({ task_id: 'task-test' });
    api.fetchUploadStatus.mockResolvedValue({ status: 'completed', processed_chunks: 1, total_chunks: 1 });

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'Initial Module' } });

    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    const input = document.getElementById('pdf-input');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // Esperar o mock do uploadPdf resolver e ir para pending
    await waitFor(() => {
      expect(screen.getByText('Preparando chunks...')).toBeInTheDocument();
    });

    // Trigger polling para obter status 'completed' e disparar o callback
    await act(async () => {
      if (intervalCb) await intervalCb();
    });

    // Validar se o novo modulo apareceu na sidebar
    expect(await screen.findByText('New Module Uploaded')).toBeInTheDocument();
  });
});
