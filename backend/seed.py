from app.database import SessionLocal, engine, Base
from app.models import Module

modules_to_seed = [
    "Engenharia de Software",
    "Desenvolvimento de Sistemas",
    "Engenharia de Software Assistida por Inteligência Artificial",
    "DevOps e Plataforma de Desenvolvimento",
    "Banco de Dados",
    "Inteligência Artificial e Ciência de Dados",
    "Segurança da Informação",
    "Sistemas Operacionais, Redes e Computação em Nuvem",
    "Governança de Tecnologia da Informação",
    "Legislação Aplicada à Tecnologia da Informação",
    "Língua Inglesa (Leitura Técnica)"
]

def seed_modules():
    db = SessionLocal()
    try:
        # Pega módulos existentes
        existing = db.query(Module.name).all()
        existing_names = {m[0] for m in existing}
        
        new_modules = []
        for index, name in enumerate(modules_to_seed):
            if name not in existing_names:
                # O day_of_week pode ser index % 7 (distribuir ao longo da semana) ou 0
                new_modules.append(Module(name=name, day_of_week=index % 7))
        
        if new_modules:
            db.bulk_save_objects(new_modules)
            db.commit()
            print(f"{len(new_modules)} módulos adicionados com sucesso!")
        else:
            print("Todos os módulos já estavam cadastrados.")
    except Exception as e:
        print(f"Erro ao popular banco de dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Iniciando seed de módulos...")
    seed_modules()
    print("Seed finalizado.")
