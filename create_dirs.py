import os
import subprocess
import sys

base_path = r"c:\Users\sithe\OneDrive\Desktop\web_dev\smart billing\frontend"

directories = [
    "",
    "src",
    "src/api",
    "src/components", 
    "src/context",
    "src/pages",
    "src/utils",
    "public"
]

print("Creating directories...")
for d in directories:
    path = os.path.join(base_path, d)
    os.makedirs(path, exist_ok=True)
    print(f"Created: {path}")

print("\nDirectories created successfully!")
print("\nNext steps:")
print("1. cd into frontend directory")
print("2. Run: npm create vite@latest . -- --template react")
print("3. Run: npm install react-router-dom axios tailwindcss postcss autoprefixer @headlessui/react lucide-react")
print("4. Run: npx tailwindcss init -p")
print("\nOr just run npm install in the frontend directory after the files are created.")
