import re
with open('src/components/RSVP.jsx', 'r') as f: content = f.read()
if 'RSVPFormFields' not in content: content = content.replace("import Card from './common/Card';", "import Card from './common/Card';\nimport RSVPFormFields from './common/RSVPFormFields';")
step_2_replacement = '''<RSVPFormFields formData={formData} setFormData={setFormData} showDetails={showDetails} setShowDetails={setShowDetails} step2Errors={step2Errors} showError={seatingError} setShowSeatingModal={setShowSeatingModal} isAdmin={isAdmin} />'''
pattern = r'(<div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/panel:bg-brand-accent/10 transition-colors duration-700" />).*?(<div className="flex justify-between items-center pt-4 border-t border-white/30">)'
content = re.sub(pattern, r'\1
' + step_2_replacement + r'
\2', content, flags=re.DOTALL)
with open('src/components/RSVP.jsx', 'w') as f: f.write(content)
