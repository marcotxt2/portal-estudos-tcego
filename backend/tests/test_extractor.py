import pytest
from app.services.extractor import extract_content_with_gemini, process_pdf_background
from tenacity import RetryError
from unittest.mock import patch, MagicMock

@patch('app.services.extractor.genai.Client')
def test_backoff_on_quota_exceeded_spec_AC_001(mock_client_class):
    """
    @spec:AC-001 - Dado que a API do Gemini retorna o erro HTTP 429 ou 503, Quando o extrator
    receber o erro, Então a biblioteca Tenacity deve aplicar backoff e eventualmente 
    levantar RetryError quando as tentativas se esgotarem.
    """
    mock_client = MagicMock()
    mock_client_class.return_value = mock_client
    
    mock_part = MagicMock()
    
    # Simula erro de cota
    mock_client.models.generate_content.side_effect = Exception("429 Quota exceeded for quota metric")
    
    with patch('app.services.extractor.types.Part.from_uri', return_value=mock_part):
        with pytest.raises(RetryError) as exc_info:
            # Chama a funcao; ela deve tentar e falhar as 5 vezes, levantando RetryError
            extract_content_with_gemini("dummy.pdf", '[]')
    
    assert "Quota exceeded for quota metric" in str(exc_info.value.last_attempt.exception())

@patch('app.services.extractor.extract_content_with_gemini')
@patch('app.services.extractor.SessionLocal')
def test_save_error_status_in_task_spec_AC_002(mock_session_local, mock_extract):
    """
    @spec:AC-002 - Dado que o processo falha (esgota retentativas), a task deve ser atualizada para status 'error'
    com a errorMessage adequada.
    """
    mock_extract.side_effect = Exception("Falha ao processar chunk: Timeout ou cota após retentativas.")
    
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    
    mock_task = MagicMock()
    mock_task.id = "123"
    mock_task.status = "processing"
    
    mock_db.query.return_value.filter.return_value.first.return_value = mock_task
    
    # mock PdfReader to return dummy pages
    mock_reader = MagicMock()
    mock_reader.pages = [MagicMock()]
    mock_writer = MagicMock()
    
    with patch('app.services.extractor.pypdf.PdfReader', return_value=mock_reader), \
         patch('app.services.extractor.pypdf.PdfWriter', return_value=mock_writer), \
         patch('app.services.extractor.os.path.basename', return_value="dummy.pdf"), \
         patch('app.services.extractor.os.remove'):
        process_pdf_background("dummy.pdf", "ModuloX", "123")
    
    # Task should be marked as error
    assert mock_task.status == "error"
    assert "Timeout ou cota" in mock_task.error_message
