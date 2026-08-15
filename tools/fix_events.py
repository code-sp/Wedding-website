import re

with open('src/components/Events.jsx', 'r') as f:
    content = f.read()

# Replace deleteEvent(id)
content = re.sub(
    r'deleteEvent\((.*?)\)', 
    r"updateContentData('events', events.filter(e => e.id !== \1))", 
    content
)

# Replace updateEvent(id, 'field', value) -> we have to map this to:
# updateContentData('events', events.map(e => e.id === id ? { ...e, [field]: value } : e))
def repl_update_event(match):
    id_arg, field_arg, val_arg = match.groups()
    return f"updateContentData('events', events.map(e => e.id === {id_arg} ? {{ ...e, [{field_arg}]: {val_arg} }} : e))"

# updateEvent(activeEvent.id, 'title', e.target.value)
content = re.sub(
    r"updateEvent\((.*?),\s*['\"](.*?)['\"],\s*(.*?)\)",
    repl_update_event,
    content
)

with open('src/components/Events.jsx', 'w') as f:
    f.write(content)

