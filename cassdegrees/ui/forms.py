import json

from api.models import ProgramModel, SubplanModel, CourseModel
from django import forms
from django.core.exceptions import NON_FIELD_ERRORS
from django.forms import ModelForm


# fast and easy way to check if a word separated by spaces is in a sentence
# From: https://stackoverflow.com/questions/5319922/python-check-if-word-is-in-a-string
def contains_word(s, w):
    return f' {w} ' in f' {s} '


class JSONField(forms.CharField):

    def __init__(self, *args, field_id, **kwargs):
        super().__init__(widget=forms.HiddenInput(attrs={'id': field_id}), *args, **kwargs)

    def to_python(self, value):
        return json.loads(value)

    def prepare_value(self, value):
        if isinstance(value, str):
            return value
        else:
            return json.dumps(value)


class EditProgramFormSnippet(ModelForm):
    # Use custom handlers for JSON fields
    globalRequirements = JSONField(field_id='globalRequirements', required=False)
    rules = JSONField(field_id='rules', required=False)

    class Meta:
        model = ProgramModel
        fields = ('code', 'year', 'name', 'units', 'programType', 'globalRequirements', 'rules', 'staffNotes',
                  'studentNotes')
        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. BARTS"}),
            'year': forms.NumberInput(attrs={'class': "text tfull",
                                             'onkeydown': "javascript: return checkKeys(event)",
                                             'min': 2000, 'max': 3000}),
            'name': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. Bachelor of Arts"}),
            'units': forms.NumberInput(attrs={'class': "text tfull",
                                              'onkeydown': "javascript: return checkKeys(event)",
                                              'step': 6, 'max': 512}),
            'staffNotes': forms.Textarea(attrs={
                'class': "tfull",
                'placeholder': "Notes for other CASS staff - these will not be displayed on the final template"}),
            'studentNotes': forms.Textarea(attrs={
                'class': "tfull",
                'placeholder': "Explanatory program notes for students, shown on the final template"}),
            # ProgramType auto generated
        }
        labels = {
            'programType': "Program Type",
            'staffNotes': "Internal comments not shown on the template",
            'studentNotes': "Explanatory notes shown on the template",
        }
        error_messages = {
            NON_FIELD_ERRORS: {
                'unique_together': "A Program with the same %(field_labels)s already exists!",
            }
        }

    def clean_code(self):
        data = self.cleaned_data['code']
        if len(data) < 3:
            raise forms.ValidationError("This should be at least 3 characters!")
        return data.upper()

    def clean_year(self):
        data = self.cleaned_data['year']
        if data < 2000 or data > 3000:
            raise forms.ValidationError("This should be between 2000-3000!")
        return data

    def clean_name(self):
        data = self.cleaned_data['name']
        if len(data) < 5:
            raise forms.ValidationError("This should be at least 5 characters!")
        return data

    def clean_units(self):
        data = self.cleaned_data['units']
        if int(data) % 6 != 0:
            raise forms.ValidationError("Units should be a multiple of 6!")
        return data



class EditSubplanFormSnippet(ModelForm):
    # Automatically injected by default
    units = forms.IntegerField(widget=forms.HiddenInput(), required=False)
    rules = JSONField(field_id='rules', required=False)

    class Meta:
        model = SubplanModel
        fields = ('code', 'year', 'name', 'units', 'planType', 'rules', 'publish')
        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. ARTH-MIN"}),
            'year': forms.NumberInput(attrs={'class': "text tfull",
                                             'onkeydown': "javascript: return checkKeys(event)",
                                             'min': 2000, 'max': 3000}),
            'name': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. Art History Minor"}),
            'publish': forms.CheckboxInput()
            # See units above
            # planType auto generated
        }
        labels = {
            'planType': "Subplan Type",
        }
        error_messages = {
            NON_FIELD_ERRORS: {
                'unique_together': "A Subplan with the same %(field_labels)s already exists!",
            }
        }

    def clean_code(self):
        data = self.cleaned_data['code']
        data = data.upper()
        if len(data) < 3:
            raise forms.ValidationError("This should be at least 3 characters!")
        if "-" not in data:
            raise forms.ValidationError("Code should have '-' to split its plan type! E.g. ANTH-MAJ")
        try:
            plan = self.data['planType']
            subdata = data.split("-")
            if plan not in subdata and len(plan) > 0:
                raise forms.ValidationError("Code should have " + plan + " at the end of its code!")
        except KeyError:
            return data
        return data

    def clean_year(self):
        data = self.cleaned_data['year']
        if data < 2000 or data > 3000:
            raise forms.ValidationError("This should be between 2000-3000!")
        return data

    def clean_name(self):
        data = self.cleaned_data['name']
        if len(data) < 5:
            raise forms.ValidationError("This should be at least 5 characters!")
        if contains_word(str(data).lower(), 'major'):
            raise forms.ValidationError("Subplan Name should not include the word 'Major'!")
        if contains_word(str(data).lower(), 'minor'):
            raise forms.ValidationError("Subplan Name should not include the word 'Minor'!")
        if contains_word(str(data).lower(), 'specialisation'):
            raise forms.ValidationError("Subplan Name should not include the word 'Specialisation'!")
        return data

    def clean_units(self):
        # try and except fixes the issue of no plan type being selected throwing an Key Error
        try:
            # Generate units from subtype plan selected
            subplanUnits = \
                {
                    'MAJ': 48,
                    'MIN': 24,
                    'SPEC': 24
                }

            return subplanUnits[self.data["planType"]]
        except KeyError:
            raise forms.ValidationError("Please fill in all fields!")


class EditCourseFormSnippet(ModelForm):
    class Meta:
        model = CourseModel
        fields = ('code', 'year', 'name', 'units', 'offeredSem1', 'offeredSem2')
        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. ARTH1006, ARTH1100A"}),
            'year': forms.NumberInput(attrs={'class': "text tfull",
                                             'onkeydown': "javascript: return checkKeys(event)",
                                             'type': "number"}),
            'name': forms.TextInput(attrs={'class': "text tfull",
                                           'placeholder': "e.g. Art and Design Histories: Form and Space"}),
            'units': forms.NumberInput(attrs={'class': "text tfull",
                                              'onkeydown': "javascript: return checkKeys(event)",
                                              'type': "number"}),
        }
        labels = {
            'offeredSem1': "Offered in Semester 1",
            'offeredSem2': "Offered in Semester 2",
        }
        error_messages = {
            NON_FIELD_ERRORS: {
                'unique_together': "A Course with the same %(field_labels)s already exists!",
            }
        }

    def clean_code(self):
        data = self.cleaned_data['code']
        if len(data) != 8 and len(data) != 9:
            raise forms.ValidationError("This should be at least 8-9 characters  (4 Letters, 4 Numbers "
                                        "+ 1 Optional Letter)!")
        if not data[:4].isalpha():
            raise forms.ValidationError("Course Code should start with 4 letters!")
        if not data[4:8].isdigit():
            raise forms.ValidationError("Course Code should end with 4 numbers!")
        if len(data) == 9 and not data[-1:].isalpha():
            raise forms.ValidationError("Extra Key should be a letter e.g. A, B, C")
        return data.upper()

    def clean_year(self):
        data = self.cleaned_data['year']
        if data < 2000 or data > 3000:
            raise forms.ValidationError("This should be between 2000-3000!")
        return data

    def clean_name(self):
        data = self.cleaned_data['name']
        if len(data) < 5:
            raise forms.ValidationError("This should be at least 5 characters!")
        return data

    def clean_units(self):
        data = self.cleaned_data['units']
        if int(data) % 6 != 0:
            raise forms.ValidationError("Units should be a multiple of 6!")
        return data
