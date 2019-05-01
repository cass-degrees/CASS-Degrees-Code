import json

from api.models import ProgramModel, SubplanModel, CourseModel
from django import forms
from django.core.exceptions import NON_FIELD_ERRORS
from django.forms import ModelForm


class JSONField(forms.CharField):

    def __init__(self, *args, field_id, **kwargs):
        super().__init__(widget=forms.HiddenInput(attrs={'id': field_id}), *args, **kwargs)

    def to_python(self, value):
        return json.loads(value)

    def prepare_value(self, value):
        return json.dumps(value)


class EditProgramFormSnippet(ModelForm):
    # Use custom handlers for JSON fields
    globalRequirements = JSONField(field_id='globalRequirements', required=False)

    class Meta:
        model = ProgramModel
        fields = ('code', 'year', 'name', 'units', 'programType', 'globalRequirements')
        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. BARTS"}),
            'year': forms.NumberInput(attrs={'class': "text tfull", 'min': 2000, 'max': 3000}),
            'name': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. Bachelor of Arts"}),
            'units': forms.NumberInput(attrs={'class': "text tfull", 'step': 6, 'max': 512}),
            # ProgramType auto generated
        }
        labels = {
            'programType': "Program Type",
        }
        error_messages = {
            NON_FIELD_ERRORS: {
                'unique_together': "A program with the same %(field_labels)s already exists!",
            }
        }

    def clean_code(self):
        data = self.cleaned_data['code']
        if len(data) < 3:
            raise forms.ValidationError("This should be at least 3 characters!")
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
        return data


class EditSubplanFormSnippet(ModelForm):
    # Automatically injected by default
    units = forms.IntegerField(widget=forms.HiddenInput(), required=False)

    class Meta:
        model = SubplanModel
        fields = ('code', 'year', 'name', 'units', 'planType', 'publish')
        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. ARTH-MIN"}),
            'year': forms.NumberInput(attrs={'class': "text tfull", 'min': 2000, 'max': 3000}),
            'name': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. Art History Minor"}),
            'publish': forms.CheckboxInput()
            # See units above
            # planType auto generated
        }
        labels = {
            'planType': "Plan Type",
        }
        error_messages = {
            NON_FIELD_ERRORS: {
                'unique_together': "A plan with the same %(field_labels)s already exists!",
            }
        }

    def clean_code(self):
        data = self.cleaned_data['code']
        if len(data) < 3:
            raise forms.ValidationError("This should be at least 3 characters!")
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
        return data

    def clean_units(self):
        # Generate units from subtype plan selected
        subplanUnits = \
            {
                'MAJ': 48,
                'MIN': 24,
                'SPEC': 24
            }

        return subplanUnits[self.data["planType"]]


class EditCourseFormSnippet(ModelForm):
    class Meta:
        model = CourseModel
        fields = ('code', 'year', 'name', 'units', 'offeredSem1', 'offeredSem2')
        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. ARTH1006"}),
            'year': forms.NumberInput(attrs={'class': "text tfull", 'type': "number"}),
            'name': forms.TextInput(attrs={'class': "text tfull",
                                           'placeholder': "e.g. Art and Design Histories: Form and Space"}),
            'units': forms.NumberInput(attrs={'class': "text tfull", 'type': "number"}),
        }
        labels = {
            'offeredSem1': "Offered in Semester 1",
            'offeredSem2': "Offered in Semester 2",
        }
        error_messages = {
            NON_FIELD_ERRORS: {
                'unique_together': "A plan with the same %(field_labels)s already exists!",
            }
        }

    def clean_code(self):
        data = self.cleaned_data['code']
        if len(data) < 4:
            raise forms.ValidationError("This should be at least 4 characters!")
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
        return data
