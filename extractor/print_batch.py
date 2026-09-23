import json
import sys

def print_batch(start, end):
    with open('extractor/questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for q in data[start:end]:
        enunc = q['enunciado'].replace('\n', ' ').replace('\r', '')
        print(f"ID: {q['qc_id']} | Disc: {q.get('disciplina')} | Top: {q.get('topico')}")
        print(f"Q: {enunc}")
        for k, v in q['alternativas'].items():
            if v:
                print(f"  {k}: {v.replace('\n', ' ').replace('\r', '')}")
        print("-" * 40)

if __name__ == "__main__":
    start = int(sys.argv[1])
    end = int(sys.argv[2])
    print_batch(start, end)
