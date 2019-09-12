import json

from api.models import ProgramModel, SubplanModel, CourseModel, ListModel
from django import forms
from django.core.exceptions import NON_FIELD_ERRORS
from django.forms import ModelForm
from django.urls import reverse

# fast and easy way to check if a word separated by spaces is in a sentence
# From: https://stackoverflow.com/questions/5319922/python-check-if-word-is-in-a-string
from django.utils.html import format_html


def contains_word(s, w):
    return f' {w} ' in f' {s} '


# For a given model check constraints c1 and c2 and raise link to conflicting record if applicable
# url resolution using
# https://stackoverflow.com/questions/9585491/how-do-i-pass-get-parameters-using-django-urlresolvers-reverse
# https://stackoverflow.com/questions/40886048/how-to-put-a-link-into-a-django-error-message
def raise_unique_error(view_str, conflictID):
    url = ("%s?id=" + str(conflictID)) % reverse(view_str)
    msg = format_html('An existing record (<a href="{}" target="_blank">view in new tab</a>) '
                      'with the same attributes is stopping the creation of this record. To fix this '
                      'ensure the fields flagged below are unique, continue working on the existing record or '
                      'delete the existing record.',
                      url)
    raise forms.ValidationError([
        forms.ValidationError(msg, code='testError')
    ])


# for any constraints c1 c2
# https://stackoverflow.com/questions/4659360/get-django-object-id-based-on-model-attribute
def check_constraint(model, data, c1, c2, view_str, formID):
    # check assignment as keys may not exist in cleaned dictionary if field level validation has failed
    try:
        draft_c1 = data[c1]
    except KeyError:
        draft_c1 = None
    try:
        draft_c2 = data[c2]
    except KeyError:
        draft_c2 = None

    # check that input has been received for the fields and then check for duplicate
    if draft_c1 is not None and draft_c2 is not None:
        try:
            conflict_id = model.objects.only('id').get(**{c1: draft_c1, c2: draft_c2}).id
            if conflict_id == formID:
                conflict_id = None
        except model.DoesNotExist:
            conflict_id = None
    else:
        conflict_id = None

    if conflict_id is not None:
        raise_unique_error(view_str, conflict_id)


# for any constraints c1 c2 c3
def check_three_constraint(model, data, c1, c2, c3, view_str, formID):
    # check assignment as keys may not exist in cleaned dictionary if field level validation has failed
    try:
        draft_c1 = data[c1]
    except KeyError:
        draft_c1 = None
    try:
        draft_c2 = data[c2]
    except KeyError:
        draft_c2 = None
    try:
        draft_c3 = data[c3]
    except KeyError:
        draft_c3 = None

    # check constraint and return conflicting ID if present
    if draft_c1 is not None and draft_c2 is not None and draft_c3 is not None:
        try:
            conflict_id = model.objects.only('id').get(**{
                c1: draft_c1,
                c2: draft_c2,
                c3: draft_c3}).id
            if conflict_id == formID:
                conflict_id = None
        except model.DoesNotExist:
            conflict_id = None
    else:
        conflict_id = None

    if conflict_id is not None:
        raise_unique_error(view_str, conflict_id)


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
        fields = ('code', 'year', 'name', 'units', 'programType', 'globalRequirements', 'rules', 'publish',
                  'staffNotes', 'studentNotes')
        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. BARTS"}),
            'year': forms.NumberInput(attrs={'class': "text eighth-width",
                                             'onkeydown': "javascript: return checkKeys(event)",
                                             'min': 2000, 'max': 3000}),
            'name': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. Bachelor of Arts"}),
            'units': forms.NumberInput(attrs={'class': "text eighth-width",
                                              'onkeydown': "javascript: return checkKeys(event)",
                                              'step': 6, 'max': 512}),
            'publish': forms.CheckboxInput(),
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
            raise forms.ValidationError("This should be between 2000 and 3000!")
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

    # Override clean to return links to existing content if unique_together constraint fails
    def clean(self):
        cleaned_data = super().clean()
        formID = self.instance.id

        check_constraint(ProgramModel, cleaned_data, 'code', 'year', 'edit_program', formID)
        check_constraint(ProgramModel, cleaned_data, 'name', 'year', 'edit_program', formID)

        return cleaned_data


class EditSubplanFormSnippet(ModelForm):
    # Automatically injected by default
    units = forms.IntegerField(widget=forms.HiddenInput(), required=False)
    rules = JSONField(field_id='rules', required=False)

    class Meta:
        model = SubplanModel
        fields = ('code', 'year', 'name', 'units', 'planType', 'rules', 'publish')
        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. ARTH-MIN"}),
            'year': forms.NumberInput(attrs={'class': "text eighth-width",
                                             'onkeydown': "javascript: return checkKeys(event)",
                                             'min': 2000, 'max': 3000}),
            'name': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. Art History"}),
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

    def clean(self):
        cleaned_data = super().clean()

        # use form ID to check whether this is updating an existing record
        formID = self.instance.id

        # relevant constraints are (code, year) and (name, year, planType)
        check_constraint(SubplanModel, cleaned_data, 'code', 'year', 'edit_subplan', formID)
        check_three_constraint(SubplanModel, cleaned_data, 'name', 'year', 'planType', 'edit_subplan', formID)

        return cleaned_data


class EditListFormSnippet(ModelForm):
    rules = JSONField(field_id='elements', required=False)

    class Meta:
        model = ListModel
        fields = ('name', 'year', 'elements')
        widgets = {
            'name': forms.TextInput(attrs={'class': "text tfull"}),
            'year': forms.NumberInput(attrs={'class': "text eighth-width",
                                             'onkeydown': "javascript: return checkKeys(event)",
                                             'type': "number"}),
            # elements is hidden field as it will be populated in the background by the multiselect widget
            'elements': forms.HiddenInput
        }


class EditCourseFormSnippet(ModelForm):
    rules = JSONField(field_id='rules', required=False)

    class Meta:
        model = CourseModel
        fields = ('code',
                  'name',
                  'units',
                  'offeredYears',
                  'offeredSem1',
                  'offeredSem2',
                  'offeredSummer',
                  'offeredAutumn',
                  'offeredWinter',
                  'offeredSpring',
                  'otherOffering',
                  'currentlyActive',
                  'rules')

        offered_years_choices = [
            ("ALL", "Every Year"),
            ("ODD", "Odd Years"),
            ("EVEN", "Even Years"),
            ("OTHER", "Other/Unknown")
        ]

        widgets = {
            'code': forms.TextInput(attrs={'class': "text tfull", 'placeholder': "e.g. ARTH1006, ARTH1100"}),
            'name': forms.TextInput(attrs={'class': "text tfull",
                                           'placeholder': "e.g. Art and Design Histories: Form and Space"}),
            'units': forms.NumberInput(attrs={'class': "text eighth-width",
                                              'onkeydown': "javascript: return checkKeys(event)",
                                              'type': "number"}),
            'offeredYears': forms.Select(choices=offered_years_choices, attrs={'class': "eighth-width"})
        }
        labels = {
            'offeredYears': "Years Offered",
            'offeredSem1': "Offered in Semester 1",
            'offeredSem2': "Offered in Semester 2",
            'offeredSummer': "Offered in Summer",
            'offeredAutumn': "Offered in Autumn",
            'offeredWinter': "Offered in Winter",
            'offeredSpring': "Offered in Spring",
            'otherOffering': "Other/Unknown Offering",
            'currentlyActive': "Currently Active Course",
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

    def clean(self):
        cleaned_data = super().clean()

        check_constraint(CourseModel, cleaned_data, 'code', 'year', 'edit_course', self.instance.id)

        return cleaned_data
