import re

with open('src/components/Events.jsx', 'r') as f:
    content = f.read()

# Fix unquoted keys inside the map like [title]:
for key in ['title', 'description', 'date', 'time', 'location', 'mapLink', 'dressCodeMale', 'dressCodeFemale']:
    content = content.replace(f"[{key}]:", f"['{key}']: ")

with open('src/components/Events.jsx', 'w') as f:
    f.write(content)
