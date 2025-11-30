import os
from pathlib import Path
import sys

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def generate_tree(directory, prefix="", ignore_dirs=None):
    """Generate tree structure of directory"""
    if ignore_dirs is None:
        ignore_dirs = {'node_modules', '.git', 'build', 'dist', '__pycache__', '.vscode'}
    
    try:
        entries = sorted(Path(directory).iterdir(), key=lambda x: (not x.is_dir(), x.name))
    except PermissionError:
        return
    
    entries = [e for e in entries if e.name not in ignore_dirs]
    
    for i, entry in enumerate(entries):
        is_last = i == len(entries) - 1
        current_prefix = "+-- " if is_last else "|-- "
        print(f"{prefix}{current_prefix}{entry.name}")
        
        if entry.is_dir():
            extension = "    " if is_last else "|   "
            generate_tree(entry, prefix + extension, ignore_dirs)

if __name__ == "__main__":
    project_path = r"d:\Project_API_Kelompok\API_RYADI\ELearning"
    print(f"\n{Path(project_path).name}/")
    generate_tree(project_path)
    print("\nTree diagram saved!")
