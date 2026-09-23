import os

# @spec:AC-006
def test_directory_structure_exists():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_dir = os.path.join(base_dir, "input_pdfs")
    
    assert os.path.exists(target_dir), "O diretório input_pdfs deve existir para receber as matérias."
    
    materias_esperadas = [
        "Engenharia de Software e Desenvolvimento",
        "Banco de Dados (Relacional, NoSQL, Vetorial)",
        "Segurança da Informação",
        "Língua Inglesa (Leitura Técnica)"
    ]
    
    for materia in materias_esperadas:
        materia_path = os.path.join(target_dir, materia)
        assert os.path.exists(materia_path), f"A pasta para a matéria '{materia}' deve existir."

