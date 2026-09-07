from app.database import SessionLocal
from app.models import Module
from seed import modules_to_seed

def fix_modules():
    db = SessionLocal()
    try:
        # Delete modules that are not in the official list
        db.query(Module).filter(Module.name.not_in(modules_to_seed)).delete(synchronize_session=False)
        db.commit()
        print("Deleted old modules successfully.")
        
        # Now run seed to ensure all 7 exist
        existing = db.query(Module.name).all()
        existing_names = {m[0] for m in existing}
        
        new_modules = []
        for index, name in enumerate(modules_to_seed):
            if name not in existing_names:
                new_modules.append(Module(name=name, day_of_week=index % 7))
        
        if new_modules:
            db.bulk_save_objects(new_modules)
            db.commit()
            print(f"{len(new_modules)} novos módulos oficiais adicionados.")
        else:
            print("Todos os módulos oficiais já existem e os antigos foram limpos.")
    except Exception as e:
        print(f"Erro ao consertar modulos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_modules()
